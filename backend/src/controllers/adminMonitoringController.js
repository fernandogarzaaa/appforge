/**
 * Admin Monitoring Controller
 */

import os from 'os';
import mongoose from 'mongoose';
import { successResponse } from '../utils/helpers.js';
import AuditLog from '../models/AuditLog.js';
import redisCache from '../utils/redisCache.js';

export const getRealTimeMetrics = async (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const loadAverage = os.loadavg();

    const metrics = {
      cpu: {
        loadAverage,
        cores: os.cpus().length
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        process: memoryUsage
      },
      uptime: process.uptime(),
      requests: {
        total: req.app?.locals?.requestCount || 0,
        perMinute: req.app?.locals?.requestsPerMinute || 0
      },
      timestamp: new Date().toISOString()
    };

    res.json(successResponse(metrics, 'Real-time metrics retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getSystemLogs = async (req, res, next) => {
  try {
    const { action, status, resourceType, startDate, endDate } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    const query = {};
    if (action) query.action = action;
    if (status) query.status = status;
    if (resourceType) query.resourceType = resourceType;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(successResponse(logs, 'System logs retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getRecentErrors = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const logs = await AuditLog.find({
      $or: [
        { status: 'failure' },
        { errorMessage: { $ne: null } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(successResponse(logs, 'Recent errors retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getHealthCheck = async (req, res, next) => {
  try {
    const mongoReadyState = mongoose.connection?.readyState || 0;
    const mongoStatus = mongoReadyState === 1 ? 'connected' : 'disconnected';
    const redisStatus = redisCache.isRedisConnected() ? 'connected' : 'disconnected';

    const status = mongoStatus === 'connected' ? 'ok' : 'degraded';

    const health = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus
      }
    };

    res.json(successResponse(health, 'Health check retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = Array.isArray(req.app?.locals?.activeSessions)
      ? req.app.locals.activeSessions
      : [];

    res.json(successResponse({
      total: sessions.length,
      sessions
    }, 'Active sessions retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export default {
  getRealTimeMetrics,
  getSystemLogs,
  getRecentErrors,
  getHealthCheck,
  getActiveSessions
};
