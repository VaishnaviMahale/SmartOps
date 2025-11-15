import express from 'express';
import { 
  getUsers, 
  getUserById, 
  updateUserRole, 
  deleteUser,
  updateUser 
} from './users.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { auditLogger } from '../../middlewares/auditLogger.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'manager'), getUsers);
router.get('/:id', authenticate, getUserById);
router.patch('/:id', authenticate, auditLogger('update_user', 'user'), updateUser);
router.patch('/:id/role', authenticate, authorize('admin'), auditLogger('update_role', 'user'), updateUserRole);
router.delete('/:id', authenticate, authorize('admin'), auditLogger('delete_user', 'user'), deleteUser);

export default router;

