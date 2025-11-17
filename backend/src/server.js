console.log('Starting SmartOps Backend...');

import 'dotenv/config';

console.log('dotenv loaded');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

console.log('Core packages imported');

import connectDB from './config/database.js';
import { createQueues } from './jobs/workflowQueue.js';
import { initializeSocket } from './sockets/socketHandler.js';
import errorHandler from './middlewares/errorHandler.js';
import logger from './utils/logger.js';
import scheduledJobs from './jobs/scheduledJobs.js';
import startWorker from './jobs/worker.js';

console.log('Internal modules imported');

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import workflowRoutes from './modules/workflows/workflows.routes.js';
import taskRoutes from './modules/tasks/tasks.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';

console.log('All routes imported successfully');

// Create logs directory
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs', { recursive: true });
  console.log('Logs directory created/verified');
} catch (err) {
  console.log('Logs directory error (non-fatal):', err.message);
}

console.log('Creating Express app...');
const app = express();
console.log('Creating HTTP server...');
const server = createServer(app);
console.log('Express app and server created');

logger.info('Server instance created');

console.log('Setting up middleware...');
// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('Basic middleware configured');

console.log('Basic middleware configured');

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
console.log('Rate limiting configured');

logger.info('Rate limiting enabled', limiter);

console.log('Setting up routes...');
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
console.log('All routes configured');

console.log('All routes configured');

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);
console.log('Error handlers configured');

// Initialize services
const startServer = async () => {
  console.log('startServer function called');
  try {
    // Log environment check
    logger.info('Starting server initialization...');
    logger.info(`Environment: ${process.env.NODE_ENV || 'not set'}`);
    logger.info(`MongoDB URI configured: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
    logger.info(`JWT Secret configured: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);

    // Connect to MongoDB
    await connectDB();
    logger.info('Connected to MongoDB');

    // Create in-memory queues
    await createQueues();
    logger.info('In-memory queues created');

    // Initialize Socket.IO
    initializeSocket(server);
    logger.info('Socket.IO initialized');

    // Start worker
    await startWorker();
    logger.info('Worker started');

    // Start scheduled jobs
    scheduledJobs.startAll();
    logger.info('Scheduled jobs started');
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`Using in-memory queue (Redis not required)`);
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    logger.error(`Error stack: ${error.stack}`);
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

console.log('About to call startServer()...');
startServer();

