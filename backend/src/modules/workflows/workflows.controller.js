import workflowService from './workflows.service.js';
import logger from '../../utils/logger.js';

// @desc    Create new workflow
// @route   POST /api/workflows
// @access  Private
export const createWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workflows
// @route   GET /api/workflows
// @access  Private
export const getWorkflows = async (req, res, next) => {
  try {
    const result = await workflowService.getWorkflows(req.query, req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      data: result.workflows,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workflow by ID
// @route   GET /api/workflows/:id
// @access  Private
export const getWorkflowById = async (req, res, next) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id);

    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workflow
// @route   PATCH /api/workflows/:id
// @access  Private
export const updateWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.updateWorkflow(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete workflow
// @route   DELETE /api/workflows/:id
// @access  Private
export const deleteWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.deleteWorkflow(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Workflow archived successfully',
      data: workflow
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger workflow execution
// @route   POST /api/workflows/:id/trigger
// @access  Private
export const triggerWorkflow = async (req, res, next) => {
  try {
    const execution = await workflowService.triggerWorkflow(
      req.params.id,
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      data: execution,
      message: 'Workflow execution started'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workflow execution history
// @route   GET /api/workflows/:id/history
// @access  Private
export const getWorkflowHistory = async (req, res, next) => {
  try {
    const result = await workflowService.getWorkflowHistory(req.params.id, req.query);

    res.status(200).json({
      success: true,
      data: result.executions,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get execution by ID
// @route   GET /api/workflows/executions/:id
// @access  Private
export const getExecutionById = async (req, res, next) => {
  try {
    const execution = await workflowService.getExecutionById(req.params.id);

    res.status(200).json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

