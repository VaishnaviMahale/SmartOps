import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
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
  workflowVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowVersion',
    required: true
  },
  stepId: {
    type: String,
    required: true
  },
  stepType: {
    type: String,
    enum: ['approval', 'condition', 'auto', 'notification'],
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  dueDate: Date,
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
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
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ workflowExecutionId: 1 });
taskSchema.index({ status: 1, dueDate: 1 });

export default mongoose.model('Task', taskSchema);

