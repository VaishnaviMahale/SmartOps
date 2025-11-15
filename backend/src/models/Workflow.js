import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowVersion'
  },
  versions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowVersion'
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true
  }],
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
workflowSchema.index({ createdBy: 1 });
workflowSchema.index({ status: 1 });
workflowSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Workflow', workflowSchema);

