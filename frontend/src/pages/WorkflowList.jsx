import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Search,
  PlayArrow,
  Edit,
  Delete,
} from '@mui/icons-material';
import {
  useGetWorkflowsQuery,
  useDeleteWorkflowMutation,
  useTriggerWorkflowMutation,
} from '../features/api/apiSlice';
import { toast } from 'react-toastify';

const WorkflowList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const { data: workflowsData, isLoading } = useGetWorkflowsQuery({ search });
  const [deleteWorkflow] = useDeleteWorkflowMutation();
  const [triggerWorkflow] = useTriggerWorkflowMutation();

  const handleMenuOpen = (event, workflow) => {
    setAnchorEl(event.currentTarget);
    setSelectedWorkflow(workflow);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedWorkflow(null);
  };

  const handleTrigger = async (workflowId) => {
    try {
      await triggerWorkflow({ id: workflowId, data: {} }).unwrap();
      toast.success('Workflow execution started');
      handleMenuClose();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to trigger workflow');
    }
  };

  const handleEdit = (workflowId) => {
    navigate(`/workflows/${workflowId}/edit`);
    handleMenuClose();
  };

  const handleDelete = async (workflowId) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await deleteWorkflow(workflowId).unwrap();
        toast.success('Workflow deleted successfully');
        handleMenuClose();
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to delete workflow');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Workflows
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/workflows/new')}
        >
          Create Workflow
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search workflows..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Grid container spacing={3}>
          {workflowsData?.data?.map((workflow) => (
            <Grid item xs={12} sm={6} md={4} key={workflow._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" component="div" fontWeight={600}>
                      {workflow.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, workflow)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {workflow.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={workflow.status}
                      size="small"
                      color={workflow.status === 'active' ? 'success' : 'default'}
                    />
                    {workflow.tags?.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/workflows/${workflow._id}`)}
                  >
                    View Details
                  </Button>
                  {workflow.status === 'active' && (
                    <Button
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={() => handleTrigger(workflow._id)}
                    >
                      Run
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(selectedWorkflow?._id)}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleTrigger(selectedWorkflow?._id)}>
          <PlayArrow fontSize="small" sx={{ mr: 1 }} />
          Trigger
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedWorkflow?._id)}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default WorkflowList;

