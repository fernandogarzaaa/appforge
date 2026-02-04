/**
 * Admin API Keys Controller
 */

import { v4 as uuidv4 } from 'uuid';
import { successResponse, createError } from '../utils/helpers.js';
import { generateToken, hash } from '../utils/encryption.js';

const apiKeyStore = new Map();

const maskKey = (value) => {
  if (!value) return '';
  const safe = String(value);
  if (safe.length <= 8) return `${safe.slice(0, 2)}...${safe.slice(-2)}`;
  return `${safe.slice(0, 4)}...${safe.slice(-4)}`;
};

const normalizeRateLimit = (rateLimit) => {
  if (!rateLimit) {
    return { requestsPerMinute: 60, burst: 120 };
  }
  if (typeof rateLimit === 'number') {
    return { requestsPerMinute: rateLimit, burst: Math.max(rateLimit * 2, 60) };
  }
  return {
    requestsPerMinute: rateLimit.requestsPerMinute || 60,
    burst: rateLimit.burst || Math.max((rateLimit.requestsPerMinute || 60) * 2, 60)
  };
};

const serializeKey = (record) => ({
  id: record.id,
  name: record.name,
  status: record.status,
  keyPreview: maskKey(record.key),
  keyHash: record.keyHash,
  rateLimit: record.rateLimit,
  createdAt: record.createdAt,
  createdBy: record.createdBy,
  rotatedAt: record.rotatedAt || null,
  previousKeyExpiresAt: record.previousKeyExpiresAt || null,
  lastUsedAt: record.lastUsedAt || null,
  usage: record.usage || { requests: 0, errors: 0 }
});

export const listKeys = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const offset = (page - 1) * limit;

    const keys = Array.from(apiKeyStore.values())
      .sort((a, b) => b.createdAt - a.createdAt);

    const paged = keys.slice(offset, offset + limit).map(serializeKey);

    res.json(successResponse({
      page,
      limit,
      total: keys.length,
      keys: paged
    }, 'API keys retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const createKey = async (req, res, next) => {
  try {
    const { name, rateLimit } = req.body;

    if (!name) {
      throw createError(400, 'Key name is required');
    }

    const keyValue = generateToken(32);
    const record = {
      id: uuidv4(),
      name,
      key: keyValue,
      keyHash: hash(keyValue),
      rateLimit: normalizeRateLimit(rateLimit),
      status: 'active',
      createdAt: new Date(),
      createdBy: req.user?.id || 'system',
      usage: {
        requests: 0,
        errors: 0
      }
    };

    apiKeyStore.set(record.id, record);

    res.status(201).json(successResponse({
      ...serializeKey(record),
      key: keyValue
    }, 'API key created successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = apiKeyStore.get(id);

    if (!record) {
      throw createError(404, 'API key not found');
    }

    apiKeyStore.delete(id);

    res.json(successResponse({ id }, 'API key deleted successfully'));
  } catch (err) {
    next(err);
  }
};

export const rotateKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = apiKeyStore.get(id);

    if (!record) {
      throw createError(404, 'API key not found');
    }

    const now = new Date();
    const newKey = generateToken(32);

    record.previousKey = record.key;
    record.previousKeyExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    record.key = newKey;
    record.keyHash = hash(newKey);
    record.rotatedAt = now;

    apiKeyStore.set(record.id, record);

    res.json(successResponse({
      ...serializeKey(record),
      key: newKey
    }, 'API key rotated successfully'));
  } catch (err) {
    next(err);
  }
};

export const getKeyUsage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = apiKeyStore.get(id);

    if (!record) {
      throw createError(404, 'API key not found');
    }

    res.json(successResponse({
      id: record.id,
      name: record.name,
      rateLimit: record.rateLimit,
      usage: record.usage || { requests: 0, errors: 0 },
      lastUsedAt: record.lastUsedAt || null
    }, 'API key usage retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export default {
  listKeys,
  createKey,
  deleteKey,
  rotateKey,
  getKeyUsage
};
