import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  useGetAnalyticsSummaryQuery,
  useGetSLAMetricsQuery,
  useGetUserPerformanceQuery,
  useGetWorkflowTrendsQuery,
  useGetBottlenecksQuery,
} from '../features/api/apiSlice';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  const [dateRange, setDateRange] = useState('30');

  const { data: summaryData } = useGetAnalyticsSummaryQuery({});
  const { data: slaData } = useGetSLAMetricsQuery({});
  const { data: performanceData } = useGetUserPerformanceQuery({});
  const { data: trendsData } = useGetWorkflowTrendsQuery({ days: dateRange });
  const { data: bottlenecksData } = useGetBottlenecksQuery();

  // Prepare pie chart data for execution status
  const executionStatusData = summaryData?.data?.executions
    ? [
        { name: 'Completed', value: summaryData.data.executions.completed },
        { name: 'Failed', value: summaryData.data.executions.failed },
        { name: 'Running', value: summaryData.data.executions.running },
      ]
    : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Analytics Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={dateRange} label="Time Range" onChange={(e) => setDateRange(e.target.value)}>
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Workflows
              </Typography>
              <Typography variant="h4" component="div" fontWeight={600}>
                {summaryData?.data?.workflows?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Executions
              </Typography>
              <Typography variant="h4" component="div" fontWeight={600}>
                {summaryData?.data?.executions?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="h4" component="div" fontWeight={600} color="success.main">
                {summaryData?.data?.executions?.completionRate || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                SLA Breach Rate
              </Typography>
              <Typography variant="h4" component="div" fontWeight={600} color="error.main">
                {slaData?.data?.breachRate || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Execution Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Execution Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={executionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {executionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              User Performance
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={performanceData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="userName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalTasks" fill="#8884d8" name="Total Tasks" />
                <Bar dataKey="approved" fill="#82ca9d" name="Approved" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Workflow Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Workflow Execution Trends
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={trendsData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Executions" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Bottlenecks */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Performance Bottlenecks
            </Typography>
            <Box sx={{ mt: 2 }}>
              {bottlenecksData?.data?.length > 0 ? (
                bottlenecksData.data.map((bottleneck, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={500}>
                      {bottleneck.workflowName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Step: {bottleneck.stepId} | Avg Duration: {bottleneck.avgDuration?.toFixed(2)} minutes
                      | Executions: {bottleneck.executionCount}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No bottlenecks detected</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;

