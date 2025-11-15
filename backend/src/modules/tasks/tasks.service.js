import Task from '../../models/Task.js';
import WorkflowExecution from '../../models/WorkflowExecution.js';
import Notification from '../../models/Notification.js';
import { addToQueue } from '../../jobs/workflowQueue.js';
import logger from '../../utils/logger.js';

class TaskService {
  async getTasks(query, userId, userRole) {
    const filter = {};

    // Filter by assignee unless admin
    if (userRole !== 'admin') {
      filter.assignedTo = userId;
    } else if (query.assignedTo) {
      filter.assignedTo = query.assignedTo;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.workflowId) {
      filter.workflowId = query.workflowId;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('workflowId', 'name')
      .populate('completedBy', 'name email')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(filter);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getTaskById(taskId) {
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email role')
      .populate('workflowId', 'name description')
      .populate('workflowExecutionId')
      .populate('completedBy', 'name email');

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async approveTask(taskId, userId, comment) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    // Check if user is assigned to this task
    if (task.assignedTo.toString() !== userId.toString()) {
      throw new Error('Not authorized to approve this task');
    }

    if (task.status !== 'pending') {
      throw new Error('Task is not pending');
    }

    task.status = 'approved';
    task.completedAt = new Date();
    task.completedBy = userId;

    if (comment) {
      task.comments.push({
        userId,
        comment,
        createdAt: new Date()
      });
    }

    await task.save();

    // Update workflow execution
    await this.updateWorkflowExecution(task, 'approved');

    // Create notification for workflow owner
    await this.createNotification(task, userId, 'approved');

    logger.info(`Task approved: ${taskId} by user: ${userId}`);

    return task;
  }

  async rejectTask(taskId, userId, comment) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    // Check if user is assigned to this task
    if (task.assignedTo.toString() !== userId.toString()) {
      throw new Error('Not authorized to reject this task');
    }

    if (task.status !== 'pending') {
      throw new Error('Task is not pending');
    }

    task.status = 'rejected';
    task.completedAt = new Date();
    task.completedBy = userId;

    if (comment) {
      task.comments.push({
        userId,
        comment: comment || 'Rejected',
        createdAt: new Date()
      });
    }

    await task.save();

    // Update workflow execution
    await this.updateWorkflowExecution(task, 'rejected');

    // Create notification for workflow owner
    await this.createNotification(task, userId, 'rejected');

    logger.info(`Task rejected: ${taskId} by user: ${userId}`);

    return task;
  }

  async updateWorkflowExecution(task, result) {
    const execution = await WorkflowExecution.findById(task.workflowExecutionId);

    if (execution) {
      execution.stepHistory.push({
        stepId: task.stepId,
        status: result,
        startedAt: task.createdAt,
        completedAt: task.completedAt,
        executedBy: task.completedBy,
        result: result
      });

      // If rejected, mark execution as failed
      if (result === 'rejected') {
        execution.status = 'failed';
        execution.completedAt = new Date();
        execution.error = 'Task rejected by user';
      } else {
        // Continue workflow execution
        await addToQueue('workflow-execution', {
          executionId: execution._id,
          workflowId: task.workflowId,
          currentStepId: task.stepId
        });
      }

      await execution.save();
    }
  }

  async createNotification(task, userId, action) {
    const execution = await WorkflowExecution.findById(task.workflowExecutionId)
      .populate('triggeredBy');

    if (execution && execution.triggeredBy) {
      await Notification.create({
        userId: execution.triggeredBy._id,
        title: `Task ${action}`,
        message: `A task in your workflow has been ${action}`,
        type: action === 'approved' ? 'success' : 'warning',
        relatedEntity: 'task',
        relatedEntityId: task._id
      });
    }
  }

  async addComment(taskId, userId, comment) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    task.comments.push({
      userId,
      comment,
      createdAt: new Date()
    });

    await task.save();
    return task;
  }
}

export default new TaskService();

