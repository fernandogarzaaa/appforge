/**
 * Admin Secrets Controller
 */

import { v4 as uuidv4 } from 'uuid';
import { successResponse, createError } from '../utils/helpers.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const secretStore = new Map();

const maskValue = (value) => {
  if (!value) return '';
  const safe = String(value);
  if (safe.length <= 6) return '*'.repeat(Math.max(3, safe.length));
  return `${safe.slice(0, 2)}${'*'.repeat(Math.max(2, safe.length - 4))}${safe.slice(-2)}`;
};

const serializeSecret = (secret, includeValue = false) => {
  const decrypted = secret.value ? decrypt(secret.value) : '';
  return {
    id: secret.id,
    name: secret.name,
    description: secret.description || '',
    metadata: secret.metadata || {},
    value: includeValue ? decrypted : undefined,
    valueMasked: includeValue ? undefined : maskValue(decrypted),
    createdAt: secret.createdAt,
    updatedAt: secret.updatedAt,
    lastAccessedAt: secret.lastAccessedAt || null,
    createdBy: secret.createdBy
  };
};

export const listSecrets = async (req, res, next) => {
  try {
    const secrets = Array.from(secretStore.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((secret) => serializeSecret(secret, false));

    res.json(successResponse(secrets, 'Secrets retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    const secret = secretStore.get(id);

    if (!secret) {
      throw createError(404, 'Secret not found');
    }

    secret.lastAccessedAt = new Date();
    secretStore.set(secret.id, secret);

    res.json(successResponse(serializeSecret(secret, true), 'Secret retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const createSecret = async (req, res, next) => {
  try {
    const { name, value, description, metadata } = req.body;

    if (!name) {
      throw createError(400, 'Secret name is required');
    }

    if (!value) {
      throw createError(400, 'Secret value is required');
    }

    const id = uuidv4();
    const now = new Date();

    const secret = {
      id,
      name,
      description: description || '',
      metadata: metadata || {},
      value: encrypt(String(value)),
      createdAt: now,
      updatedAt: now,
      createdBy: req.user?.id || 'system'
    };

    secretStore.set(id, secret);

    res.status(201).json(successResponse(serializeSecret(secret, true), 'Secret created successfully'));
  } catch (err) {
    next(err);
  }
};

export const updateSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { value, description, metadata } = req.body;

    const secret = secretStore.get(id);
    if (!secret) {
      throw createError(404, 'Secret not found');
    }

    if (value !== undefined) {
      secret.value = encrypt(String(value));
    }

    if (description !== undefined) {
      secret.description = description;
    }

    if (metadata !== undefined) {
      secret.metadata = metadata;
    }

    secret.updatedAt = new Date();

    secretStore.set(secret.id, secret);

    res.json(successResponse(serializeSecret(secret, true), 'Secret updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    const secret = secretStore.get(id);

    if (!secret) {
      throw createError(404, 'Secret not found');
    }

    secretStore.delete(id);

    res.json(successResponse({ id }, 'Secret deleted successfully'));
  } catch (err) {
    next(err);
  }
};

export const exportConfig = async (req, res, next) => {
  try {
    const secrets = Array.from(secretStore.values()).map((secret) => ({
      id: secret.id,
      name: secret.name,
      description: secret.description || '',
      metadata: secret.metadata || {},
      value: secret.value ? decrypt(secret.value) : ''
    }));

    const payload = {
      exportedAt: new Date().toISOString(),
      secrets
    };

    const encryptedPayload = encrypt(JSON.stringify(payload));

    res.json(successResponse({
      encrypted: true,
      payload: encryptedPayload,
      count: secrets.length
    }, 'Secrets exported successfully'));
  } catch (err) {
    next(err);
  }
};

export const importConfig = async (req, res, next) => {
  try {
    const { payload, encrypted = true } = req.body;

    if (!payload) {
      throw createError(400, 'Payload is required');
    }

    const decoded = encrypted ? decrypt(payload) : payload;
    const parsed = typeof decoded === 'string' ? JSON.parse(decoded) : decoded;

    if (!parsed || !Array.isArray(parsed.secrets)) {
      throw createError(400, 'Invalid secrets payload');
    }

    const now = new Date();
    let created = 0;
    let updated = 0;

    parsed.secrets.forEach((item) => {
      if (!item?.name || item?.value === undefined) {
        return;
      }

      const existing = item.id ? secretStore.get(item.id) : Array.from(secretStore.values()).find((s) => s.name === item.name);
      if (existing) {
        existing.value = encrypt(String(item.value));
        existing.description = item.description || existing.description;
        existing.metadata = item.metadata || existing.metadata;
        existing.updatedAt = now;
        secretStore.set(existing.id, existing);
        updated += 1;
      } else {
        const id = item.id || uuidv4();
        secretStore.set(id, {
          id,
          name: item.name,
          description: item.description || '',
          metadata: item.metadata || {},
          value: encrypt(String(item.value)),
          createdAt: now,
          updatedAt: now,
          createdBy: req.user?.id || 'system'
        });
        created += 1;
      }
    });

    res.json(successResponse({ created, updated }, 'Secrets imported successfully'));
  } catch (err) {
    next(err);
  }
};

export default {
  listSecrets,
  getSecret,
  updateSecret,
  createSecret,
  deleteSecret,
  exportConfig,
  importConfig
};
