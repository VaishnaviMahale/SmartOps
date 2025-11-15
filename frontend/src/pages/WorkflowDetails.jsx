import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { PlayArrow, Edit, ArrowBack } from '@mui/icons-material';
import {
  useGetWorkflowByIdQuery,
  useGetWorkflowHistoryQuery,
  useTriggerWorkflowMutation,
} from '../features/api/apiSlice';
import { toast } from 'react-toastify';
import { subscribeToWorkflow, unsubscribeFromWorkflow } from '../utils/socket';

const WorkflowDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: workflowData, isLoading } = useGetWorkflowByIdQuery(id);
  const { data: historyData } = useGetWorkflowHistoryQuery({ id, limit: 10 });
  const [triggerWorkflow, { isLoading: isTriggeringWorkflow }] = useTriggerWorkflowMutation();

  useEffect(() => {
    subscribeToWorkflow(id);
    return () => {
      unsubscribeFromWorkflow(id);
    };
  }, [id]);

  const handleTrigger = async () => {
    try {
      await triggerWorkflow({ id, data: {} }).unwrap();
      toast.success('Workflow execution started');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to trigger workflow');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const workflow = workflowData?.data;

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/workflows')}
        sx={{ mb: 2 }}
      >
        Back to Workflows
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          {workflow?.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/workflows/${id}/edit`)}
          >
            Edit
          </Button>
          {workflow?.status === 'active' && (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleTrigger}
              disabled={isTriggeringWorkflow}
            >
              Run Workflow
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Description
            </Typography>
            <Typography color="text.secondary">
              {workflow?.description || 'No description provided'}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={workflow?.status}
                color={workflow?.status === 'active' ? 'success' : 'default'}
              />
              {workflow?.tags?.map((tag, index) => (
                <Chip key={index} label={tag} variant="outlined" />
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Workflow Steps
            </Typography>
            {workflow?.currentVersion?.steps?.length > 0 ? (
              <List>
                {workflow.currentVersion.steps.map((step, index) => (
                  <ListItem key={step.id} divider>
                    <ListItemText
                      primary={`${index + 1}. ${step.label || step.id}`}
                      secondary={`Type: ${step.type} ${step.slaHours ? `| SLA: ${step.slaHours}h` : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No steps defined</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Execution History
            </Typography>
            {historyData?.data?.length > 0 ? (
              <List>
                {historyData.data.map((execution) => (
                  <ListItem key={execution._id} divider>
                    <ListItemText
                      primary={new Date(execution.createdAt).toLocaleString()}
                      secondary={
                        <Chip
                          label={execution.status}
                          size="small"
                          color={
                            execution.status === 'completed'
                              ? 'success'
                              : execution.status === 'failed'
                              ? 'error'
                              : 'default'
                          }
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No execution history</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkflowDetails;

