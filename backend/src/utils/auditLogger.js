import AuditLog from '../models/AuditLog.js';

/**
 * Log an audit event
 * @param {Object} data - Audit log data
 * @param {string} data.action - Action performed
 * @param {string} data.userId - User who performed the action
 * @param {string} data.resourceType - Type of resource affected
 * @param {string} data.resourceId - ID of the resource
 * @param {Object} data.details - Additional details
 * @param {Object} req - Express request object (optional)
 */
export const logAudit = async (data, req = null) => {
  try {
    const auditData = {
      action: data.action,
      userId: data.userId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: data.details || {},
      status: data.status || 'success',
      errorMessage: data.errorMessage || null
    };

    // Add request metadata if available
    if (req) {
      auditData.ipAddress = req.ip || req.connection.remoteAddress;
      auditData.userAgent = req.get('user-agent') || 'Unknown';
      auditData.metadata = {
        method: req.method,
        path: req.path,
        query: req.query
      };
    }

    await AuditLog.logAction(auditData);
  } catch (error) {
    // Log to console but don't throw - audit logging should never break the app
    console.error('Audit log error:', error);
  }
};

/**
 * Get audit logs for a user
 */
export const getUserAuditLogs = async (userId, limit = 50) => {
  return await AuditLog.getUserActivity(userId, limit);
};

/**
 * Get audit logs for a resource
 */
export const getResourceAuditLogs = async (resourceType, resourceId, limit = 50) => {
  return await AuditLog.getResourceHistory(resourceType, resourceId, limit);
};

/**
 * Get audit logs by action type
 */
export const getAuditLogsByAction = async (action, startDate = null, endDate = null) => {
  return await AuditLog.getActionsByType(action, startDate, endDate);
};

/**
 * Create audit middleware for routes
 */
export const auditMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to log after response
    res.json = function (data) {
      // Log the audit event
      logAudit(
        {
          action,
          userId: req.user?.id,
          resourceType,
          resourceId: req.params.id || data?.data?._id || data?.data?.id,
          details: {
            method: req.method,
            path: req.path,
            body: req.body,
            success: res.statusCode < 400
          },
          status: res.statusCode < 400 ? 'success' : 'failure'
        },
        req
      );

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};
