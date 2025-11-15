import mongoose from 'mongoose';

const workflowVersionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  steps: [{
    id: String,
    type: {
      type: String,
      enum: ['approval', 'condition', 'auto', 'notification'],
      required: true
    },
    label: String,
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assigneeRole: {
      type: String,
      enum: ['admin', 'manager', 'user']
    },
    slaHours: Number,
    position: {
      x: Number,
      y: Number
    }
  }],
  edges: [{
    id: String,
    source: String,
    target: String,
    condition: String,
    label: String
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
workflowVersionSchema.index({ workflowId: 1, versionNumber: -1 });

export default mongoose.model('WorkflowVersion', workflowVersionSchema);

