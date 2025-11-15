import mongoose from 'mongoose';

const slaLogSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  workflowExecutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowExecution',
    required: true
  },
  stepId: {
    type: String,
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  slaHours: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  dueTime: {
    type: Date,
    required: true
  },
  completedTime: Date,
  breached: {
    type: Boolean,
    default: false
  },
  breachDuration: Number, // minutes
  notificationsSent: [{
    type: {
      type: String,
      enum: ['warning', 'breach']
    },
    sentAt: Date
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
slaLogSchema.index({ workflowId: 1, breached: 1 });
slaLogSchema.index({ workflowExecutionId: 1 });
slaLogSchema.index({ timestamp: -1 });

export default mongoose.model('SLALog', slaLogSchema);

