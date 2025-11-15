import express from 'express';
import {
  getTasks,
  getTaskById,
  approveTask,
  rejectTask,
  addComment
} from './tasks.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { auditLogger } from '../../middlewares/auditLogger.js';

const router = express.Router();

router.get('/', authenticate, getTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/:id/approve', authenticate, auditLogger('approve_task', 'task'), approveTask);
router.post('/:id/reject', authenticate, auditLogger('reject_task', 'task'), rejectTask);
router.post('/:id/comment', authenticate, auditLogger('add_comment', 'task'), addComment);

export default router;

