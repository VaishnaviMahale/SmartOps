import Workflow from '../../models/Workflow.js';
import WorkflowExecution from '../../models/WorkflowExecution.js';
import Task from '../../models/Task.js';
import SLALog from '../../models/SLALog.js';
import User from '../../models/User.js';

class AnalyticsService {
  async getSummary(startDate, endDate) {
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Workflow statistics
    const totalWorkflows = await Workflow.countDocuments();
    const activeWorkflows = await Workflow.countDocuments({ status: 'active' });

    // Execution statistics
    const totalExecutions = await WorkflowExecution.countDocuments(dateFilter);
    const completedExecutions = await WorkflowExecution.countDocuments({
      ...dateFilter,
      status: 'completed'
    });
    const failedExecutions = await WorkflowExecution.countDocuments({
      ...dateFilter,
      status: 'failed'
    });
    const runningExecutions = await WorkflowExecution.countDocuments({
      status: 'running'
    });

    // Task statistics
    const totalTasks = await Task.countDocuments(dateFilter);
    const pendingTasks = await Task.countDocuments({
      status: 'pending'
    });
    const approvedTasks = await Task.countDocuments({
      ...dateFilter,
      status: 'approved'
    });
    const rejectedTasks = await Task.countDocuments({
      ...dateFilter,
      status: 'rejected'
    });

    // Calculate success rate
    const completionRate = totalExecutions > 0
      ? ((completedExecutions / totalExecutions) * 100).toFixed(2)
      : 0;

    // Average execution time
    const avgExecutionTime = await this.getAverageExecutionTime(dateFilter);

    return {
      workflows: {
        total: totalWorkflows,
        active: activeWorkflows
      },
      executions: {
        total: totalExecutions,
        completed: completedExecutions,
        failed: failedExecutions,
        running: runningExecutions,
        completionRate: parseFloat(completionRate)
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        approved: approvedTasks,
        rejected: rejectedTasks
      },
      performance: {
        avgExecutionTime
      }
    };
  }

  async getAverageExecutionTime(dateFilter) {
    const result = await WorkflowExecution.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'completed',
          completedAt: { $exists: true }
        }
      },
      {
        $project: {
          duration: {
            $subtract: ['$completedAt', '$startedAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    if (result.length > 0) {
      // Convert milliseconds to minutes
      return Math.round(result[0].avgDuration / 1000 / 60);
    }

    return 0;
  }

  async getSLAMetrics(startDate, endDate) {
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalSLAs = await SLALog.countDocuments(dateFilter);
    const breachedSLAs = await SLALog.countDocuments({
      ...dateFilter,
      breached: true
    });

    const breachRate = totalSLAs > 0
      ? ((breachedSLAs / totalSLAs) * 100).toFixed(2)
      : 0;

    // Get SLA breaches by workflow
    const breachesByWorkflow = await SLALog.aggregate([
      {
        $match: {
          ...dateFilter,
          breached: true
        }
      },
      {
        $group: {
          _id: '$workflowId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'workflows',
          localField: '_id',
          foreignField: '_id',
          as: 'workflow'
        }
      },
      {
        $unwind: '$workflow'
      },
      {
        $project: {
          workflowName: '$workflow.name',
          breachCount: '$count'
        }
      },
      {
        $sort: { breachCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return {
      total: totalSLAs,
      breached: breachedSLAs,
      breachRate: parseFloat(breachRate),
      breachesByWorkflow
    };
  }

  async getUserPerformance(startDate, endDate) {
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.completedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const userStats = await Task.aggregate([
      {
        $match: {
          ...dateFilter,
          completedBy: { $exists: true },
          status: { $in: ['approved', 'rejected', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$completedBy',
          totalTasks: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          avgCompletionTime: {
            $avg: {
              $subtract: ['$completedAt', '$createdAt']
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userName: '$user.name',
          userEmail: '$user.email',
          totalTasks: 1,
          approved: 1,
          rejected: 1,
          avgCompletionTime: { $divide: ['$avgCompletionTime', 1000 * 60] } // Convert to minutes
        }
      },
      {
        $sort: { totalTasks: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return userStats;
  }

  async getWorkflowTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await WorkflowExecution.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return trends;
  }

  async getBottlenecks() {
    // Find steps that take longest to complete
    const bottlenecks = await Task.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'approved'] },
          completedAt: { $exists: true }
        }
      },
      {
        $project: {
          stepId: 1,
          workflowId: 1,
          duration: {
            $subtract: ['$completedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: {
            workflowId: '$workflowId',
            stepId: '$stepId'
          },
          avgDuration: { $avg: '$duration' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gte: 3 } // At least 3 executions
        }
      },
      {
        $lookup: {
          from: 'workflows',
          localField: '_id.workflowId',
          foreignField: '_id',
          as: 'workflow'
        }
      },
      {
        $unwind: '$workflow'
      },
      {
        $project: {
          workflowName: '$workflow.name',
          stepId: '$_id.stepId',
          avgDuration: { $divide: ['$avgDuration', 1000 * 60] }, // Convert to minutes
          executionCount: '$count'
        }
      },
      {
        $sort: { avgDuration: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return bottlenecks;
  }
}

export default new AnalyticsService();

