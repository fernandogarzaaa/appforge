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

export const gdprRequestSchema = Joi.object({
  requestType: Joi.string().valid('data-export', 'deletion', 'portability').required(),
  userId: Joi.string().required(),
  reason: Joi.string().optional()
});

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
