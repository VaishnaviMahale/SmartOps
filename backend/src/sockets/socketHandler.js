import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Subscribe to workflow updates
    socket.on('subscribe:workflow', (workflowId) => {
      socket.join(`workflow:${workflowId}`);
      logger.info(`User ${socket.userId} subscribed to workflow: ${workflowId}`);
    });

    // Unsubscribe from workflow
    socket.on('unsubscribe:workflow', (workflowId) => {
      socket.leave(`workflow:${workflowId}`);
      logger.info(`User ${socket.userId} unsubscribed from workflow: ${workflowId}`);
    });

    // Subscribe to execution updates
    socket.on('subscribe:execution', (executionId) => {
      socket.join(`execution:${executionId}`);
      logger.info(`User ${socket.userId} subscribed to execution: ${executionId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Make io globally available
  global.io = io;

  logger.info('Socket.IO initialized successfully');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper functions to emit events
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToWorkflow = (workflowId, event, data) => {
  if (io) {
    io.to(`workflow:${workflowId}`).emit(event, data);
  }
};

export const emitToExecution = (executionId, event, data) => {
  if (io) {
    io.to(`execution:${executionId}`).emit(event, data);
  }
};

