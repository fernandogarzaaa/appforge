/**
 * Admin Authentication & Audit Middleware
 */

import AuditLog from '../models/AuditLog.js';

const ADMIN_ROLE = 'admin';

const inferResourceType = (path = '') => {
  if (path.includes('/users')) return 'user';
  if (path.includes('/keys')) return 'apiKey';
  if (path.includes('/secrets')) return 'environment';
  if (path.includes('/config')) return 'system';
  if (path.includes('/monitoring')) return 'system';
  return 'system';
};

const getResourceId = (req) => (
  req.params?.id ||
  req.params?.userId ||
  req.params?.keyId ||
  req.params?.secretId ||
  req.params?.configId ||
  null
);

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ADMIN_ROLE) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
      timestamp: new Date().toISOString()
    });
  }

  return next();
};

export const auditAction = (req, res, next) => {
  res.on('finish', async () => {
    try {
      const status = res.statusCode < 400 ? 'success' : 'failure';
      const action = `${req.method} ${req.originalUrl}`;
      const resourceType = inferResourceType(req.originalUrl || req.path);

      await AuditLog.logAction({
        action,
        userId: req.user?.id,
        resourceType,
        resourceId: getResourceId(req),
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          params: req.params
        },
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent') || 'Unknown',
        status
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test' && !process.argv.includes('--test')) {
        console.warn('⚠️  Admin audit log failed:', error.message);
      }
    }
  });

  next();
};

export default {
  isAdmin,
  auditAction
};
