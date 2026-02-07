/**
 * Admin Monitoring Controller
 * Provides system metrics, health checks, logging, and performance monitoring
 * Integrates with AuditLog for comprehensive system tracking
 */

import os from 'os';
import mongoose from 'mongoose';
import { successResponse, createError } from '../utils/helpers.js';
import AuditLog from '../models/AuditLog.js';
import redisCache from '../utils/redisCache.js';

/**
 * Get real-time system metrics
 * GET /admin/monitoring/metrics
 */
export const getRealTimeMetrics = async (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const loadAverage = os.loadavg();
    const cpus = os.cpus();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cpu: {
        loadAverage,
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        speed: cpus[0]?.speed || 0
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        percentUsed: ((totalMem - freeMem) / totalMem * 100).toFixed(2),
        process: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers || 0
        }
      },
      node: {
        version: process.version,
        arch: process.arch,
        platform: process.platform,
        pid: process.pid
      },
      requests: {
        total: req.app?.locals?.requestCount || 0,
        perMinute: req.app?.locals?.requestsPerMinute || 0,
        active: req.app?.locals?.activeRequests || 0
      }
    };

    res.json(successResponse(metrics, 'Real-time metrics retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

import base44Service from '../services/base44Service.js';

/**
 * Get admin dashboard stats (proxy to Base44)
 * GET /admin/monitoring/stats
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // Fetch stats in parallel
    const [projects, agents, deployments, users] = await Promise.all([
      base44Service.listEntities('Project').catch(() => []),
      base44Service.listEntities('CustomAgent').catch(() => []),
      base44Service.listEntities('AgentDeployment').catch(() => []),
      base44Service.listEntities('User').catch(() => [])
    ]);

    const stats = {
      projects: projects.length,
      agents: agents.length,
      deployments: deployments.length,
      users: users.length,
      activeAgents: agents.filter(a => a.is_active).length,
      activeDeployments: deployments.filter(d => d.status === 'active').length
    };

    res.json(successResponse(stats, 'Dashboard stats retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get system logs with filtering
 * GET /admin/monitoring/logs
 */
export const getSystemLogs = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';

    const { action, status, resourceType, startDate, endDate, userId } = req.query;

    // Build filter
    const filter = {};

    if (action) filter.action = action;
    if (status) filter.status = status;
    if (resourceType) filter.resourceType = resourceType;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Execute query
    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email username')
        .lean()
    ]);

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      logs
    }, 'System logs retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get recent errors
 * GET /admin/monitoring/errors
 */
export const getRecentErrors = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments({
        $or: [
          { status: 'failure' },
          { errorMessage: { $ne: null } }
        ]
      }),
      AuditLog.find({
        $or: [
          { status: 'failure' },
          { errorMessage: { $ne: null } }
        ]
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email username')
        .lean()
    ]);

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      errors: logs
    }, 'Recent errors retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get system health check
 * GET /admin/monitoring/health
 */
export const getHealthCheck = async (req, res, next) => {
  try {
    const mongoReadyState = mongoose.connection?.readyState || 0;
    const mongoStatus = mongoReadyState === 1 ? 'connected' : 'disconnected';
    const redisStatus = redisCache.isRedisConnected?.() ? 'connected' : 'disconnected';

    const health = {
      status: mongoStatus === 'connected' && redisStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus
      },
      details: {
        mongodb: {
          state: mongoReadyState,
          states: ['disconnected', 'connected', 'connecting', 'disconnecting']
        }
      }
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(successResponse(health, 'Health check completed'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get active sessions
 * GET /admin/monitoring/sessions
 */
export const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = Array.isArray(req.app?.locals?.activeSessions)
      ? req.app.locals.activeSessions
      : [];

    const sessionData = {
      total: sessions.length,
      timestamp: new Date().toISOString(),
      sessions: sessions.map(session => ({
        userId: session.userId,
        loginTime: session.loginTime,
        lastActivity: session.lastActivity,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      }))
    };

    res.json(successResponse(sessionData, 'Active sessions retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get audit log statistics
 * GET /admin/monitoring/stats/audit
 */
export const getAuditStats = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    const stats = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $facet: {
          byAction: [
            {
              $group: {
                _id: '$action',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          byResourceType: [
            {
              $group: {
                _id: '$resourceType',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          byDay: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const aggregated = stats[0] || {};

    res.json(successResponse({
      period: `Last ${days} days`,
      startDate,
      endDate: new Date(),
      stats: aggregated
    }, 'Audit statistics retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get action history by type
 * GET /admin/monitoring/actions/:actionType
 */
export const getActionHistory = async (req, res, next) => {
  try {
    const { actionType } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments({ action: actionType }),
      AuditLog.find({ action: actionType })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email username')
        .lean()
    ]);

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      action: actionType,
      logs
    }, `Action history for "${actionType}" retrieved successfully`));
  } catch (err) {
    next(err);
  }
};

/**
 * Get resource activity history
 * GET /admin/monitoring/resources/:resourceType/:resourceId
 */
export const getResourceHistory = async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments({ resourceType, resourceId }),
      AuditLog.find({ resourceType, resourceId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email username')
        .lean()
    ]);

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      resourceType,
      resourceId,
      history: logs
    }, `Resource history retrieved successfully`));
  } catch (err) {
    next(err);
  }
};

/**
 * Get performance report
 * GET /admin/monitoring/performance
 */
export const getPerformanceReport = async (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cpus = os.cpus();

    // Calculate CPU usage (simple approximation)
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const report = {
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        formatted: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
      },
      memory: {
        system: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          percentUsed: ((usedMemory / totalMemory) * 100).toFixed(2)
        },
        process: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          heapPercent: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2),
          external: memoryUsage.external
        }
      },
      cpu: {
        cores: cpus.length,
        loadAverage: os.loadavg(),
        currentLoad: os.loadavg()[0] / cpus.length
      }
    };

    res.json(successResponse(report, 'Performance report retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Clear old audit logs (maintenance)
 * DELETE /admin/monitoring/logs/cleanup
 */
export const cleanupOldLogs = async (req, res, next) => {
  try {
    const { daysToKeep = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    res.json(successResponse({
      deletedCount: result.deletedCount,
      daysKept: daysToKeep,
      cutoffDate
    }, 'Old logs cleaned up successfully'));
  } catch (err) {
    next(err);
  }
};

export default {
  getRealTimeMetrics,
  getSystemLogs,
  getRecentErrors,
  getHealthCheck,
  getActiveSessions,
  getAuditStats,
  getActionHistory,
  getResourceHistory,
  getPerformanceReport,
  cleanupOldLogs
};
