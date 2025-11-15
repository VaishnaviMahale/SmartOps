import cron from 'node-cron';
import SLALog from '../models/SLALog.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

class ScheduledJobs {
  startAll() {
    // Check SLA breaches every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkSLABreaches();
    });

    // Send SLA warnings (1 hour before breach)
    cron.schedule('*/15 * * * *', async () => {
      await this.sendSLAWarnings();
    });

    // Daily summary at 9 AM
    cron.schedule('0 9 * * *', async () => {
      await this.sendDailySummary();
    });

    logger.info('Scheduled jobs started');
  }

  async checkSLABreaches() {
    try {
      const now = new Date();

      // Find SLA logs that should be checked
      const slaLogs = await SLALog.find({
        breached: false,
        dueTime: { $lt: now },
        completedTime: { $exists: false }
      }).populate('taskId');

      for (const slaLog of slaLogs) {
        // Check if task is still pending
        if (slaLog.taskId && slaLog.taskId.status === 'pending') {
          slaLog.breached = true;
          slaLog.breachDuration = Math.round((now - slaLog.dueTime) / 1000 / 60); // minutes

          // Add notification entry
          slaLog.notificationsSent.push({
            type: 'breach',
            sentAt: now
          });

          await slaLog.save();

          // Create notification for assignee
          await Notification.create({
            userId: slaLog.taskId.assignedTo,
            title: 'SLA Breach',
            message: `Task has breached its SLA by ${slaLog.breachDuration} minutes`,
            type: 'error',
            priority: 'high',
            relatedEntity: 'task',
            relatedEntityId: slaLog.taskId._id
          });

          // Emit socket event
          global.io?.emit('sla:breach', {
            taskId: slaLog.taskId._id,
            workflowId: slaLog.workflowId,
            breachDuration: slaLog.breachDuration
          });

          logger.warn(`SLA breach detected for task: ${slaLog.taskId._id}`);
        }
      }

      if (slaLogs.length > 0) {
        logger.info(`Checked ${slaLogs.length} SLA breaches`);
      }
    } catch (error) {
      logger.error(`Error checking SLA breaches: ${error.message}`);
    }
  }

  async sendSLAWarnings() {
    try {
      const now = new Date();
      const warningTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      // Find SLAs approaching breach
      const slaLogs = await SLALog.find({
        breached: false,
        dueTime: { $gt: now, $lt: warningTime },
        completedTime: { $exists: false },
        'notificationsSent.type': { $ne: 'warning' }
      }).populate('taskId');

      for (const slaLog of slaLogs) {
        if (slaLog.taskId && slaLog.taskId.status === 'pending') {
          // Add warning notification entry
          slaLog.notificationsSent.push({
            type: 'warning',
            sentAt: now
          });
          await slaLog.save();

          // Create notification
          const minutesRemaining = Math.round((slaLog.dueTime - now) / 1000 / 60);
          await Notification.create({
            userId: slaLog.taskId.assignedTo,
            title: 'SLA Warning',
            message: `Task SLA will breach in ${minutesRemaining} minutes`,
            type: 'warning',
            priority: 'high',
            relatedEntity: 'task',
            relatedEntityId: slaLog.taskId._id
          });

          // Emit socket event
          global.io?.emit('sla:warning', {
            taskId: slaLog.taskId._id,
            workflowId: slaLog.workflowId,
            minutesRemaining
          });

          logger.info(`SLA warning sent for task: ${slaLog.taskId._id}`);
        }
      }

      if (slaLogs.length > 0) {
        logger.info(`Sent ${slaLogs.length} SLA warnings`);
      }
    } catch (error) {
      logger.error(`Error sending SLA warnings: ${error.message}`);
    }
  }

  async sendDailySummary() {
    try {
      // This is a placeholder - implement daily summary email logic
      logger.info('Daily summary job executed');
    } catch (error) {
      logger.error(`Error sending daily summary: ${error.message}`);
    }
  }
}

export default new ScheduledJobs();

