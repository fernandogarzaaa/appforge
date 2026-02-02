/**
 * Input validation schemas
 */

import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(100).required(),
  organizationName: Joi.string().optional()
});

export const quantumCircuitSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().max(1000).optional(),
  numQubits: Joi.number().min(1).max(20).required(),
  gates: Joi.array().items(
    Joi.object({
      type: Joi.string().required(),
      targets: Joi.array().items(Joi.number()).required(),
      params: Joi.object().optional()
    })
  ).optional()
});

export const documentSchema = Joi.object({
  title: Joi.string().max(255).required(),
  content: Joi.string().max(100000).optional(),
  projectId: Joi.string().required(),
  isPublic: Joi.boolean().optional()
});

export const encryptionSchema = Joi.object({
  data: Joi.string().required(),
  algorithm: Joi.string().valid('AES', 'RSA').optional()
});

// Team schemas
export const teamSchemas = {
  createTeam: Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(500).allow(''),
    settings: Joi.object({
      isPublic: Joi.boolean(),
      allowMemberInvites: Joi.boolean(),
      requireApproval: Joi.boolean(),
      maxMembers: Joi.number().integer().min(1).max(1000)
    })
  }),

  updateTeam: Joi.object({
    name: Joi.string().trim().min(3).max(100),
    description: Joi.string().trim().max(500).allow(''),
    settings: Joi.object({
      isPublic: Joi.boolean(),
      allowMemberInvites: Joi.boolean(),
      requireApproval: Joi.boolean(),
      maxMembers: Joi.number().integer().min(1).max(1000)
    })
  }),

  addMember: Joi.object({
    userId: Joi.string().required(),
    role: Joi.string().valid('member', 'admin', 'viewer').default('member')
  }),

  updateMemberRole: Joi.object({
    role: Joi.string().valid('member', 'admin', 'viewer').required()
  }),

  transferOwnership: Joi.object({
    newOwnerId: Joi.string().required()
  })
};

// Permission schemas
export const permissionSchemas = {
  checkPermission: Joi.object({
    userId: Joi.string(),
    action: Joi.string()
      .valid('read', 'create', 'update', 'delete', 'execute', 'manage', 'admin')
      .required(),
    resourceType: Joi.string()
      .valid('project', 'team', 'deployment', 'apiKey', 'environment', 'quantum', 'collaboration')
      .required(),
    resourceId: Joi.string().required()
  }),

  grantPermission: Joi.object({
    userId: Joi.string().required(),
    action: Joi.string()
      .valid('read', 'create', 'update', 'delete', 'execute', 'manage', 'admin')
      .required(),
    resourceType: Joi.string()
      .valid('project', 'team', 'deployment', 'apiKey', 'environment', 'quantum', 'collaboration')
      .required(),
    resourceId: Joi.string().required(),
    expiresAt: Joi.date().iso().greater('now').allow(null)
  }),

  revokePermission: Joi.object({
    userId: Joi.string().required(),
    action: Joi.string()
      .valid('read', 'create', 'update', 'delete', 'execute', 'manage', 'admin')
      .required(),
    resourceType: Joi.string()
      .valid('project', 'team', 'deployment', 'apiKey', 'environment', 'quantum', 'collaboration')
      .required(),
    resourceId: Joi.string().required()
  })
};

export const gdprRequestSchema = Joi.object({
  requestType: Joi.string().valid('data-export', 'deletion', 'portability').required(),
  userId: Joi.string().required(),
  reason: Joi.string().optional()
});

export const persistenceSchemas = {
  userStateUpsert: Joi.object({
    state: Joi.object().default({}),
    version: Joi.number().integer().min(1).default(1),
    checksum: Joi.string().optional(),
    deviceId: Joi.string().optional(),
    platform: Joi.string().optional(),
    appVersion: Joi.string().optional(),
    lastSyncedAt: Joi.date().iso().optional(),
    dirtySince: Joi.date().iso().optional(),
    metadata: Joi.object().default({})
  }),

  analyticsEvent: Joi.object({
    event: Joi.string().required(),
    sessionId: Joi.string().optional(),
    properties: Joi.object().default({}),
    durationMs: Joi.number().min(0).optional(),
    success: Joi.boolean().default(true),
    source: Joi.string().optional(),
    context: Joi.object().default({}),
    metadata: Joi.object().default({})
  }),

  syncLog: Joi.object({
    entityType: Joi.string().required(),
    entityId: Joi.string().required(),
    action: Joi.string().valid('create', 'update', 'delete', 'conflict', 'resolve').required(),
    direction: Joi.string().valid('push', 'pull').default('push'),
    status: Joi.string().valid('success', 'failed', 'pending').default('success'),
    version: Joi.number().integer().min(1).default(1),
    diff: Joi.object().default({}),
    error: Joi.string().optional(),
    metadata: Joi.object().default({})
  })
};

export const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message,
      type: d.type
    }));
    const err = new Error('Validation Failed');
    err.details = details;
    err.status = 400;
    throw err;
  }

  return value;
};
