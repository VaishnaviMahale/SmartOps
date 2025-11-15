import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import {
  AccountTree,
  Assignment,
  Add,
  TrendingUp,
} from '@mui/icons-material';
import {
  useGetWorkflowsQuery,
  useGetTasksQuery,
  useGetAnalyticsSummaryQuery,
} from '../features/api/apiSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const { data: workflowsData, isLoading: workflowsLoading } = useGetWorkflowsQuery({
    limit: 5,
  });

  const { data: tasksData, isLoading: tasksLoading } = useGetTasksQuery({
    status: 'pending',
    limit: 5,
  });

  const { data: analyticsData } = useGetAnalyticsSummaryQuery({});

  const stats = [
    {
      title: 'Total Workflows',
      value: analyticsData?.data?.workflows?.total || 0,
      color: 'primary',
      icon: <AccountTree />,
    },
    {
      title: 'Active Workflows',
      value: analyticsData?.data?.workflows?.active || 0,
      color: 'success',
      icon: <TrendingUp />,
    },
    {
      title: 'Pending Tasks',
      value: analyticsData?.data?.tasks?.pending || 0,
      color: 'warning',
      icon: <Assignment />,
    },
    {
      title: 'Completion Rate',
      value: `${analyticsData?.data?.executions?.completionRate || 0}%`,
      color: 'info',
      icon: <TrendingUp />,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/workflows/new')}
        >
          Create Workflow
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Welcome back, {user?.name}!
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight={600}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: `${stat.color}.light`,
                      color: `${stat.color}.main`,
                      p: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Workflows */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Workflows
              </Typography>
              <Button size="small" onClick={() => navigate('/workflows')}>
                View All
              </Button>
            </Box>
            {workflowsLoading ? (
              <Typography>Loading...</Typography>
            ) : workflowsData?.data?.length > 0 ? (
              workflowsData.data.map((workflow) => (
                <Box
                  key={workflow._id}
                  sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => navigate(`/workflows/${workflow._id}`)}
                >
                  <Typography variant="subtitle1" fontWeight={500}>
                    {workflow.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {workflow.description}
                  </Typography>
                  <Chip
                    label={workflow.status}
                    size="small"
                    color={workflow.status === 'active' ? 'success' : 'default'}
                  />
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No workflows yet</Typography>
            )}
          </Paper>
        </Grid>

        {/* Pending Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Pending Tasks
              </Typography>
              <Button size="small" onClick={() => navigate('/tasks')}>
                View All
              </Button>
            </Box>
            {tasksLoading ? (
              <Typography>Loading...</Typography>
            ) : tasksData?.data?.length > 0 ? (
              tasksData.data.map((task) => (
                <Box
                  key={task._id}
                  sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => navigate('/tasks')}
                >
                  <Typography variant="subtitle1" fontWeight={500}>
                    {task.workflowId?.name || 'Task'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Step: {task.stepId}
                  </Typography>
                  <Chip
                    label={task.priority}
                    size="small"
                    color={task.priority === 'high' ? 'error' : 'default'}
                  />
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No pending tasks</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

