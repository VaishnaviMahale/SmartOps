import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import {
  useGetTasksQuery,
  useApproveTaskMutation,
  useRejectTaskMutation,
  useAddTaskCommentMutation,
} from '../features/api/apiSlice';
import { toast } from 'react-toastify';

const TaskInbox = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState('');

  const status = ['pending', 'approved', 'rejected'][tabValue];
  const { data: tasksData, isLoading } = useGetTasksQuery({ status });

  const [approveTask, { isLoading: isApproving }] = useApproveTaskMutation();
  const [rejectTask, { isLoading: isRejecting }] = useRejectTaskMutation();
  const [addComment] = useAddTaskCommentMutation();

  const handleOpenDialog = (task, action) => {
    setSelectedTask(task);
    setActionType(action);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTask(null);
    setComment('');
    setActionType('');
  };

  const handleAction = async () => {
    if (!selectedTask) return;

    try {
      if (actionType === 'approve') {
        await approveTask({ id: selectedTask._id, comment }).unwrap();
        toast.success('Task approved successfully');
      } else if (actionType === 'reject') {
        if (!comment) {
          toast.error('Please provide a reason for rejection');
          return;
        }
        await rejectTask({ id: selectedTask._id, comment }).unwrap();
        toast.success('Task rejected successfully');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to process task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} sx={{ mb: 3 }}>
        Task Inbox
      </Typography>

      <Paper>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
        <Divider />

        {isLoading ? (
          <Box sx={{ p: 3 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : tasksData?.data?.length > 0 ? (
          <List>
            {tasksData.data.map((task) => (
              <ListItem
                key={task._id}
                divider
                sx={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  py: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {task.workflowId?.name || 'Task'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Step: {task.stepId} | Type: {task.stepType}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={task.priority}
                      size="small"
                      color={getPriorityColor(task.priority)}
                    />
                    <Chip
                      label={task.status}
                      size="small"
                      color={
                        task.status === 'approved'
                          ? 'success'
                          : task.status === 'rejected'
                          ? 'error'
                          : 'default'
                      }
                    />
                  </Box>
                </Box>

                {task.dueDate && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Due: {new Date(task.dueDate).toLocaleString()}
                  </Typography>
                )}

                {task.comments?.length > 0 && (
                  <Box sx={{ mt: 1, mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2">
                      Comment: {task.comments[task.comments.length - 1].comment}
                    </Typography>
                  </Box>
                )}

                {task.status === 'pending' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => handleOpenDialog(task, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleOpenDialog(task, 'reject')}
                    >
                      Reject
                    </Button>
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">No {status} tasks</Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Task' : 'Reject Task'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedTask?.workflowId?.name} - {selectedTask?.stepId}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={actionType === 'approve' ? 'Comment (optional)' : 'Reason for rejection'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required={actionType === 'reject'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={isApproving || isRejecting}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskInbox;

