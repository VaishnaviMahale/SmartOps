import mongoose from 'mongoose';

const workflowExecutionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  workflowVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowVersion',
    required: true
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed', 'cancelled'],
    default: 'running'
  },
  currentStepId: String,
  executionData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  stepHistory: [{
    stepId: String,
    status: String,
    startedAt: Date,
    completedAt: Date,
    executedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    result: mongoose.Schema.Types.Mixed,
    error: String
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  error: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
workflowExecutionSchema.index({ workflowId: 1, status: 1 });
workflowExecutionSchema.index({ triggeredBy: 1 });
workflowExecutionSchema.index({ createdAt: -1 });

export default mongoose.model('WorkflowExecution', workflowExecutionSchema);

