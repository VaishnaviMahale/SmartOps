import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

export const auditLogger = (action, entity) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function (data) {
      // Only log successful operations
      if (res.statusCode < 400 && req.user) {
        const auditData = {
          userId: req.user.id,
          action,
          entity,
          entityId: req.params.id || data?.data?.id || data?.data?._id,
          metadata: {
            method: req.method,
            url: req.originalUrl,
            query: req.query,
            body: sanitizeBody(req.body)
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        };

        // Extract workflow-related IDs if available
        if (data?.data?.workflowId) {
          auditData.workflowId = data.data.workflowId;
        }
        if (data?.data?.workflowVersionId) {
          auditData.workflowVersionId = data.data.workflowVersionId;
        }
        if (data?.data?.workflowExecutionId) {
          auditData.workflowExecutionId = data.data.workflowExecutionId;
        }

        // Save audit log (non-blocking)
        AuditLog.create(auditData).catch(err => {
          logger.error(`Failed to create audit log: ${err.message}`);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

// Sanitize sensitive data from body
const sanitizeBody = (body) => {
  if (!body) return {};
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
};

