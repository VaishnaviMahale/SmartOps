import Workflow from '../../models/Workflow.js';
import WorkflowVersion from '../../models/WorkflowVersion.js';
import WorkflowExecution from '../../models/WorkflowExecution.js';
import { addToQueue } from '../../jobs/workflowQueue.js';
import logger from '../../utils/logger.js';

class WorkflowService {
  async createWorkflow(data, userId) {
    const workflow = await Workflow.create({
      name: data.name,
      description: data.description,
      createdBy: userId,
      tags: data.tags || []
    });

    // Create initial version if steps provided
    if (data.steps && data.steps.length > 0) {
      const version = await this.createVersion(workflow._id, data.steps, data.edges);
      workflow.currentVersion = version._id;
      workflow.versions.push(version._id);
      await workflow.save();
    }

    return workflow;
  }

  async createVersion(workflowId, steps, edges) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const versionNumber = workflow.versions.length + 1;

    const version = await WorkflowVersion.create({
      workflowId,
      versionNumber,
      steps,
      edges: edges || []
    });

    return version;
  }

  async getWorkflows(query, userId, userRole) {
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Non-admins can only see their own workflows
    if (userRole !== 'admin') {
      filter.createdBy = userId;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const workflows = await Workflow.find(filter)
      .populate('createdBy', 'name email')
      .populate('currentVersion')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Workflow.countDocuments(filter);

    return {
      workflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getWorkflowById(workflowId) {
    const workflow = await Workflow.findById(workflowId)
      .populate('createdBy', 'name email role')
      .populate('currentVersion')
      .populate('versions');

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return workflow;
  }

  async updateWorkflow(workflowId, data, userId) {
    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Check ownership (unless admin)
    if (workflow.createdBy.toString() !== userId.toString()) {
      throw new Error('Not authorized to update this workflow');
    }

    if (data.name) workflow.name = data.name;
    if (data.description) workflow.description = data.description;
    if (data.status) workflow.status = data.status;
    if (data.tags) workflow.tags = data.tags;

    // If steps are updated, create new version
    if (data.steps && data.steps.length > 0) {
      const version = await this.createVersion(workflowId, data.steps, data.edges);
      workflow.currentVersion = version._id;
      workflow.versions.push(version._id);
    }

    await workflow.save();
    return workflow;
  }

  async deleteWorkflow(workflowId, userId, userRole) {
    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Check ownership (unless admin)
    if (userRole !== 'admin' && workflow.createdBy.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this workflow');
    }

    // Soft delete - archive instead
    workflow.status = 'archived';
    await workflow.save();

    return workflow;
  }

  async triggerWorkflow(workflowId, userId, executionData = {}) {
    const workflow = await Workflow.findById(workflowId)
      .populate('currentVersion');

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.status !== 'active') {
      throw new Error('Workflow is not active');
    }

    if (!workflow.currentVersion) {
      throw new Error('Workflow has no active version');
    }

    // Create execution record
    const execution = await WorkflowExecution.create({
      workflowId,
      workflowVersionId: workflow.currentVersion._id,
      triggeredBy: userId,
      status: 'running',
      executionData,
      currentStepId: workflow.currentVersion.steps[0]?.id
    });

    // Add to queue for processing
    await addToQueue('workflow-execution', {
      executionId: execution._id,
      workflowId,
      versionId: workflow.currentVersion._id
    });

    logger.info(`Workflow triggered: ${workflowId} by user: ${userId}`);

    return execution;
  }

  async getWorkflowHistory(workflowId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { workflowId };

    if (query.status) {
      filter.status = query.status;
    }

    const executions = await WorkflowExecution.find(filter)
      .populate('triggeredBy', 'name email')
      .populate('workflowVersionId')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await WorkflowExecution.countDocuments(filter);

    return {
      executions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getExecutionById(executionId) {
    const execution = await WorkflowExecution.findById(executionId)
      .populate('workflowId')
      .populate('workflowVersionId')
      .populate('triggeredBy', 'name email');

    if (!execution) {
      throw new Error('Execution not found');
    }

    return execution;
  }
}

export default new WorkflowService();

