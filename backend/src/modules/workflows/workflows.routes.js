import express from 'express';
import {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  triggerWorkflow,
  getWorkflowHistory,
  getExecutionById
} from './workflows.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { auditLogger } from '../../middlewares/auditLogger.js';

const router = express.Router();

router.post('/', authenticate, auditLogger('create_workflow', 'workflow'), createWorkflow);
router.get('/', authenticate, getWorkflows);
router.get('/executions/:id', authenticate, getExecutionById);
router.get('/:id', authenticate, getWorkflowById);
router.patch('/:id', authenticate, auditLogger('update_workflow', 'workflow'), updateWorkflow);
router.delete('/:id', authenticate, auditLogger('delete_workflow', 'workflow'), deleteWorkflow);
router.post('/:id/trigger', authenticate, auditLogger('trigger_workflow', 'execution'), triggerWorkflow);
router.get('/:id/history', authenticate, getWorkflowHistory);

export default router;

