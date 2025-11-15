import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['User', 'Workflow', 'Task', 'Analytics', 'Notification'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: '/api/auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),
    getMe: builder.query({
      query: () => '/api/auth/me',
      providesTags: ['User'],
    }),

    // Workflow endpoints
    getWorkflows: builder.query({
      query: (params) => ({
        url: '/api/workflows',
        params,
      }),
      providesTags: ['Workflow'],
    }),
    getWorkflowById: builder.query({
      query: (id) => `/api/workflows/${id}`,
      providesTags: (result, error, id) => [{ type: 'Workflow', id }],
    }),
    createWorkflow: builder.mutation({
      query: (workflow) => ({
        url: '/api/workflows',
        method: 'POST',
        body: workflow,
      }),
      invalidatesTags: ['Workflow'],
    }),
    updateWorkflow: builder.mutation({
      query: ({ id, ...workflow }) => ({
        url: `/api/workflows/${id}`,
        method: 'PATCH',
        body: workflow,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Workflow', id }, 'Workflow'],
    }),
    deleteWorkflow: builder.mutation({
      query: (id) => ({
        url: `/api/workflows/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workflow'],
    }),
    triggerWorkflow: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/workflows/${id}/trigger`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workflow'],
    }),
    getWorkflowHistory: builder.query({
      query: ({ id, ...params }) => ({
        url: `/api/workflows/${id}/history`,
        params,
      }),
    }),
    getExecutionById: builder.query({
      query: (id) => `/api/workflows/executions/${id}`,
    }),

    // Task endpoints
    getTasks: builder.query({
      query: (params) => ({
        url: '/api/tasks',
        params,
      }),
      providesTags: ['Task'],
    }),
    getTaskById: builder.query({
      query: (id) => `/api/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    approveTask: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/api/tasks/${id}/approve`,
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: ['Task'],
    }),
    rejectTask: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/api/tasks/${id}/reject`,
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: ['Task'],
    }),
    addTaskComment: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/api/tasks/${id}/comment`,
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }],
    }),

    // Analytics endpoints
    getAnalyticsSummary: builder.query({
      query: (params) => ({
        url: '/api/analytics/summary',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getSLAMetrics: builder.query({
      query: (params) => ({
        url: '/api/analytics/sla',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getUserPerformance: builder.query({
      query: (params) => ({
        url: '/api/analytics/performance',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getWorkflowTrends: builder.query({
      query: (params) => ({
        url: '/api/analytics/trends',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getBottlenecks: builder.query({
      query: () => '/api/analytics/bottlenecks',
      providesTags: ['Analytics'],
    }),

    // User endpoints
    getUsers: builder.query({
      query: (params) => ({
        url: '/api/users',
        params,
      }),
      providesTags: ['User'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/api/users/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/api/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Notification endpoints
    getNotifications: builder.query({
      query: (params) => ({
        url: '/api/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),
    markNotificationAsRead: builder.mutation({
      query: (id) => ({
        url: `/api/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: '/api/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetMeQuery,
  useGetWorkflowsQuery,
  useGetWorkflowByIdQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useTriggerWorkflowMutation,
  useGetWorkflowHistoryQuery,
  useGetExecutionByIdQuery,
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useApproveTaskMutation,
  useRejectTaskMutation,
  useAddTaskCommentMutation,
  useGetAnalyticsSummaryQuery,
  useGetSLAMetricsQuery,
  useGetUserPerformanceQuery,
  useGetWorkflowTrendsQuery,
  useGetBottlenecksQuery,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = apiSlice;

