import logger from '../utils/logger.js';

// In-memory queue implementation (replaces Bull/Redis)
class InMemoryQueue {
  constructor() {
    this.jobs = [];
    this.processing = false;
    this.processors = new Map();
  }

  async add(jobType, data, options = {}) {
    const job = {
      id: `${jobType}-${Date.now()}-${Math.random()}`,
      type: jobType,
      data,
      options,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.attempts || 3,
    };

    this.jobs.push(job);
    logger.info(`Job added to queue: ${job.id}`);

    // Process immediately if not already processing
    if (!this.processing) {
      this.processJobs();
    }

    return job;
  }

  process(jobType, concurrency, handler) {
    this.processors.set(jobType, { handler, concurrency });
    logger.info(`Processor registered for: ${jobType}`);
  }

  async processJobs() {
    if (this.processing) return;
    this.processing = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      const processor = this.processors.get(job.type);

      if (!processor) {
        logger.warn(`No processor found for job type: ${job.type}`);
        continue;
      }

      try {
        logger.info(`Processing job: ${job.id}`);
        await processor.handler(job);
        logger.info(`Job completed: ${job.id}`);
      } catch (error) {
        job.attempts++;
        logger.error(`Job failed: ${job.id}`, { error: error.message, attempts: job.attempts });

        if (job.attempts < job.maxAttempts) {
          // Retry with exponential backoff
          const delay = Math.pow(2, job.attempts) * 1000;
          logger.info(`Retrying job ${job.id} in ${delay}ms`);
          
          setTimeout(() => {
            this.jobs.push(job);
            if (!this.processing) {
              this.processJobs();
            }
          }, delay);
        } else {
          logger.error(`Job failed permanently after ${job.attempts} attempts: ${job.id}`);
        }
      }
    }

    this.processing = false;
  }

  on(event, handler) {
    // Stub for event handlers (compatible with Bull API)
    logger.info(`Event handler registered: ${event}`);
  }

  async getJob(jobId) {
    return this.jobs.find(j => j.id === jobId);
  }

  async getJobCounts() {
    return {
      waiting: this.jobs.length,
      active: this.processing ? 1 : 0,
      completed: 0,
      failed: 0,
    };
  }
}

let workflowQueue;

export const createQueues = async () => {
  try {
    workflowQueue = new InMemoryQueue();
    logger.info('In-memory workflow queue created successfully');
    return workflowQueue;
  } catch (error) {
    logger.error(`Error creating queues: ${error.message}`);
    throw error;
  }
};

export const addToQueue = async (queueName, data, options = {}) => {
  try {
    if (!workflowQueue) {
      throw new Error('Queue not initialized');
    }

    const job = await workflowQueue.add(queueName, data, {
      priority: options.priority || 5,
      delay: options.delay || 0,
      attempts: 3,
      ...options
    });

    logger.info(`Job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    logger.error(`Error adding job to queue: ${error.message}`);
    throw error;
  }
};

export const getQueue = () => {
  if (!workflowQueue) {
    throw new Error('Queue not initialized');
  }
  return workflowQueue;
};
