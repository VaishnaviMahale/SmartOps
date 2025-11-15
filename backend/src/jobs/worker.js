import { getQueue } from './workflowQueue.js';
import workflowEngine from './workflowEngine.js';
import logger from '../utils/logger.js';

const startWorker = async () => {
  try {
    const queue = getQueue();

    // Process workflow execution jobs
    queue.process('workflow-execution', 5, async (job) => {
      const { executionId, currentStepId } = job.data;
      
      logger.info(`Processing workflow execution job: ${job.id}`, {
        executionId,
        currentStepId
      });

      await workflowEngine.executeWorkflow(executionId, currentStepId);

      return { success: true };
    });

    // Event handlers
    queue.on('completed', (job, result) => {
      logger.info(`Job completed: ${job.id}`, result);
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job failed: ${job.id}`, {
        error: err.message,
        stack: err.stack
      });
    });

    queue.on('stalled', (job) => {
      logger.warn(`Job stalled: ${job.id}`);
    });

    logger.info('Workflow worker started successfully');

  } catch (error) {
    logger.error(`Error starting worker: ${error.message}`);
    process.exit(1);
  }
};

export default startWorker;

// If running as standalone worker
if (import.meta.url === `file://${process.argv[1]}`) {
  import('dotenv/config');
  import('../config/database.js').then(({ default: connectDB }) => {
    return connectDB();
  }).then(() => {
    return import('./workflowQueue.js').then(({ createQueues }) => {
      return createQueues();
    });
  }).then(() => {
    startWorker();
  }).catch((error) => {
    logger.error(`Failed to start worker: ${error.message}`);
    process.exit(1);
  });
}

