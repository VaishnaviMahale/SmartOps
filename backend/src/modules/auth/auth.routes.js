import express from 'express';
import { signup, login, getMe } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { auditLogger } from '../../middlewares/auditLogger.js';

const router = express.Router();

router.post('/signup', auditLogger('signup', 'user'), signup);
router.post('/login', auditLogger('login', 'user'), login);
router.get('/me', authenticate, getMe);

export default router;

