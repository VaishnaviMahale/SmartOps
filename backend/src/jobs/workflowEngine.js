import WorkflowExecution from '../models/WorkflowExecution.js';
import WorkflowVersion from '../models/WorkflowVersion.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import SLALog from '../models/SLALog.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

class WorkflowEngine {
  async executeWorkflow(executionId, currentStepId = null) {
    try {
      const execution = await WorkflowExecution.findById(executionId)
        .populate('workflowVersionId');

      if (!execution) {
        throw new Error('Execution not found');
      }

      if (execution.status !== 'running') {
        logger.info(`Execution ${executionId} is not running, skipping`);
        return;
      }

      const version = execution.workflowVersionId;
      const steps = version.steps;

      // Find next step to execute
      let nextStep;
      if (currentStepId) {
        // Find the next step after current
        nextStep = this.findNextStep(steps, version.edges, currentStepId, execution);
      } else {
        // Start with first step
        nextStep = steps[0];
      }

      if (!nextStep) {
        // No more steps, mark as completed
        execution.status = 'completed';
        execution.completedAt = new Date();
        await execution.save();
        logger.info(`Workflow execution completed: ${executionId}`);
        
        // Emit socket event
        global.io?.emit('workflow:completed', {
          executionId: execution._id,
          workflowId: execution.workflowId,
          status: 'completed'
        });
        
        return;
      }

      // Update current step
      execution.currentStepId = nextStep.id;
      await execution.save();

      // Execute the step based on type
      await this.executeStep(execution, nextStep, version);

    } catch (error) {
      logger.error(`Error executing workflow: ${error.message}`);
      
      // Mark execution as failed
      const execution = await WorkflowExecution.findById(executionId);
      if (execution) {
        execution.status = 'failed';
        execution.error = error.message;
        execution.completedAt = new Date();
        await execution.save();
        
        // Emit socket event
        global.io?.emit('workflow:failed', {
          executionId: execution._id,
          workflowId: execution.workflowId,
          error: error.message
        });
      }
    }
  }

  findNextStep(steps, edges, currentStepId, execution) {
    // Find edges that start from current step
    const outgoingEdges = edges.filter(e => e.source === currentStepId);

    if (outgoingEdges.length === 0) {
      return null; // No next step
    }

    // For conditional branching, evaluate conditions
    for (const edge of outgoingEdges) {
      if (edge.condition) {
        if (this.evaluateCondition(edge.condition, execution)) {
          return steps.find(s => s.id === edge.target);
        }
      } else {
        // No condition, take this edge
        return steps.find(s => s.id === edge.target);
      }
    }

    return null;
  }

  evaluateCondition(condition, execution) {
    // Simple condition evaluation
    // In production, use a proper expression evaluator
    try {
      // Example: "status === 'approved'"
      // This is simplified - implement proper condition evaluation
      return true;
    } catch (error) {
      logger.error(`Error evaluating condition: ${error.message}`);
      return false;
    }
  }

  async executeStep(execution, step, version) {
    logger.info(`Executing step: ${step.id} of type: ${step.type}`);

    switch (step.type) {
      case 'approval':
        await this.handleApprovalStep(execution, step, version);
        break;
      case 'notification':
        await this.handleNotificationStep(execution, step);
        break;
      case 'auto':
        await this.handleAutoStep(execution, step);
        break;
      case 'condition':
        await this.handleConditionStep(execution, step);
        break;
      default:
        logger.warn(`Unknown step type: ${step.type}`);
    }
  }

  async handleApprovalStep(execution, step, version) {
    // Find assignee
    let assignee;
    if (step.assignee) {
      assignee = step.assignee;
    } else if (step.assigneeRole) {
      // Find first user with this role
      const user = await User.findOne({ role: step.assigneeRole, isActive: true });
      assignee = user?._id;
    }

    if (!assignee) {
      throw new Error('No assignee found for approval step');
    }

    // Calculate due date based on SLA
    let dueDate;
    if (step.slaHours) {
      dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + step.slaHours);

      // Create SLA log
      await SLALog.create({
        workflowId: execution.workflowId,
        workflowExecutionId: execution._id,
        stepId: step.id,
        slaHours: step.slaHours,
        startTime: new Date(),
        dueTime: dueDate
      });
    }

    // Create task
    const task = await Task.create({
      workflowId: execution.workflowId,
      workflowExecutionId: execution._id,
      workflowVersionId: version._id,
      stepId: step.id,
      stepType: step.type,
      assignedTo: assignee,
      dueDate,
      metadata: step.config || {}
    });

    // Create notification
    await Notification.create({
      userId: assignee,
      title: 'New Task Assigned',
      message: `You have a new approval task: ${step.label || step.id}`,
      type: 'info',
      priority: 'high',
      relatedEntity: 'task',
      relatedEntityId: task._id
    });

    // Emit socket event
    global.io?.emit('task:created', {
      taskId: task._id,
      assignedTo: assignee,
      workflowId: execution.workflowId
    });

    logger.info(`Approval task created: ${task._id}`);
    
    // Workflow pauses here, will continue when task is approved/rejected
  }

  async handleNotificationStep(execution, step) {
    // Send notification based on config
    const config = step.config || {};
    
    if (config.userId) {
      await Notification.create({
        userId: config.userId,
        title: config.title || 'Workflow Notification',
        message: config.message || 'A workflow step has been executed',
        type: 'info',
        relatedEntity: 'execution',
        relatedEntityId: execution._id
      });

      // Emit socket event
      global.io?.emit('notification:new', {
        userId: config.userId,
        title: config.title,
        message: config.message
      });
    }

    // Continue to next step immediately
    const { addToQueue } = await import('./workflowQueue.js');
    await addToQueue('workflow-execution', {
      executionId: execution._id,
      workflowId: execution.workflowId,
      currentStepId: step.id
    });
  }

  async handleAutoStep(execution, step) {
    // Execute auto action based on config
    const config = step.config || {};
    
    logger.info(`Executing auto step with config: ${JSON.stringify(config)}`);
    
    // Add step to history
    execution.stepHistory.push({
      stepId: step.id,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      result: 'Auto-executed'
    });
    await execution.save();

    // Continue to next step
    const { addToQueue } = await import('./workflowQueue.js');
    await addToQueue('workflow-execution', {
      executionId: execution._id,
      workflowId: execution.workflowId,
      currentStepId: step.id
    });
  }

  async handleConditionStep(execution, step) {
    // Evaluate condition and continue
    logger.info(`Evaluating condition step: ${step.id}`);
    
    // Add to history
    execution.stepHistory.push({
      stepId: step.id,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      result: 'Condition evaluated'
    });
    await execution.save();

    // Continue to next step (condition will be evaluated in findNextStep)
    const { addToQueue } = await import('./workflowQueue.js');
    await addToQueue('workflow-execution', {
      executionId: execution._id,
      workflowId: execution.workflowId,
      currentStepId: step.id
    });
  }
}

export default new WorkflowEngine();

