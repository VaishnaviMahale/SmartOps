import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow'
  },
  workflowVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowVersion'
  },
  workflowExecutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowExecution'
  },
  stepId: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  entity: {
    type: String,
    enum: ['workflow', 'task', 'user', 'step', 'execution'],
    required: true
  },
  entityId: String,
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ workflowId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);

