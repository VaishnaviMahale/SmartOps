import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { addNotification } from '../features/notifications/notificationSlice';
import { apiSlice } from '../features/api/apiSlice';

let socket = null;

export const useSocket = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    // Initialize socket connection
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token,
      },
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Listen for notifications
    socket.on('notification:new', (data) => {
      dispatch(addNotification(data));
      toast.info(data.title);
    });

    // Listen for task events
    socket.on('task:created', (data) => {
      dispatch(apiSlice.util.invalidateTags(['Task']));
      toast.info('New task assigned to you');
    });

    socket.on('task:updated', (data) => {
      dispatch(apiSlice.util.invalidateTags(['Task']));
    });

    // Listen for workflow events
    socket.on('workflow:completed', (data) => {
      dispatch(apiSlice.util.invalidateTags(['Workflow']));
      toast.success('Workflow completed successfully');
    });

    socket.on('workflow:failed', (data) => {
      dispatch(apiSlice.util.invalidateTags(['Workflow']));
      toast.error(`Workflow failed: ${data.error}`);
    });

    // Listen for SLA events
    socket.on('sla:warning', (data) => {
      toast.warning(`SLA Warning: Task will breach in ${data.minutesRemaining} minutes`);
    });

    socket.on('sla:breach', (data) => {
      toast.error(`SLA Breach: Task has exceeded deadline`);
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [token, dispatch]);

  return socket;
};

export const subscribeToWorkflow = (workflowId) => {
  if (socket) {
    socket.emit('subscribe:workflow', workflowId);
  }
};

export const unsubscribeFromWorkflow = (workflowId) => {
  if (socket) {
    socket.emit('unsubscribe:workflow', workflowId);
  }
};

export const subscribeToExecution = (executionId) => {
  if (socket) {
    socket.emit('subscribe:execution', executionId);
  }
};

