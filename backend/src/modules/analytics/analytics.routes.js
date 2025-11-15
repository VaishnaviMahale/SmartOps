import express from 'express';
import {
  getSummary,
  getSLAMetrics,
  getUserPerformance,
  getWorkflowTrends,
  getBottlenecks
} from './analytics.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = express.Router();

router.get('/summary', authenticate, authorize('admin', 'manager'), getSummary);
router.get('/sla', authenticate, authorize('admin', 'manager'), getSLAMetrics);
router.get('/performance', authenticate, authorize('admin', 'manager'), getUserPerformance);
router.get('/trends', authenticate, authorize('admin', 'manager'), getWorkflowTrends);
router.get('/bottlenecks', authenticate, authorize('admin', 'manager'), getBottlenecks);

export default router;

