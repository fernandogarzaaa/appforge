import UserState from '../models/UserState.js';
import Analytics from '../models/Analytics.js';
import SyncLog from '../models/SyncLog.js';
import { successResponse, createError } from '../utils/helpers.js';
import { validate, persistenceSchemas } from '../validators/schemas.js';
import { emitEvent } from '../websocket/emitter.js';

// User State
export const getUserState = async (req, res, next) => {
  try {
    const state = await UserState.findOne({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(successResponse(state || null, 'User state retrieved'));
  } catch (err) {
    next(err);
  }
};

export const upsertUserState = async (req, res, next) => {
  try {
    const payload = validate(persistenceSchemas.userStateUpsert, req.body);
    const state = await UserState.findOneAndUpdate(
      { userId: req.user.id },
      { ...payload, userId: req.user.id, lastSyncedAt: payload.lastSyncedAt || new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    emitEvent('state:updated', { userId: req.user.id, deviceId: payload.deviceId, version: state.version });
    res.status(201).json(successResponse(state, 'User state saved'));
  } catch (err) {
    next(err);
  }
};

// Analytics
export const createAnalyticsEvent = async (req, res, next) => {
  try {
    const payload = validate(persistenceSchemas.analyticsEvent, req.body);
    const record = await Analytics.create({ ...payload, userId: req.user.id });
    emitEvent('analytics:event', { userId: req.user.id, event: payload.event, sessionId: payload.sessionId });
    res.status(201).json(successResponse(record, 'Analytics event recorded'));
  } catch (err) {
    next(err);
  }
};

export const listAnalyticsEvents = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const events = await Analytics.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(successResponse(events, 'Analytics events retrieved'));
  } catch (err) {
    next(err);
  }
};

// Sync Logs
export const createSyncLog = async (req, res, next) => {
  try {
    const payload = validate(persistenceSchemas.syncLog, req.body);
    const record = await SyncLog.create({ ...payload, userId: req.user.id });
    emitEvent('sync:log', { userId: req.user.id, entityType: payload.entityType, action: payload.action, status: payload.status });
    res.status(201).json(successResponse(record, 'Sync log recorded'));
  } catch (err) {
    next(err);
  }
};

export const listSyncLogs = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const query = { userId: req.user.id };
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;

    const logs = await SyncLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(successResponse(logs, 'Sync logs retrieved'));
  } catch (err) {
    next(err);
  }
};
