const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const schemas = {
  generateCode: Joi.object({
    description: Joi.string().required().min(10).max(1000),
    language: Joi.string().valid('javascript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'typescript').required(),
    complexity: Joi.string().valid('simple', 'moderate', 'complex').optional(),
  }),

  explainCode: Joi.object({
    code: Joi.string().required().min(5).max(10000),
    language: Joi.string().required(),
    depth: Joi.string().valid('basic', 'intermediate', 'advanced').optional(),
  }),

  analyzeCode: Joi.object({
    code: Joi.string().required().min(5).max(10000),
    language: Joi.string().required(),
    analysisType: Joi.string().valid('performance', 'security', 'quality', 'all').optional(),
  }),

  generateTests: Joi.object({
    code: Joi.string().required().min(5).max(10000),
    language: Joi.string().required(),
    testFramework: Joi.string().optional().max(50),
    coverage: Joi.string().valid('basic', 'comprehensive').optional(),
  }),

  refactorCode: Joi.object({
    code: Joi.string().required().min(5).max(10000),
    language: Joi.string().required(),
    targetVersion: Joi.string().optional().max(50),
    goals: Joi.array().items(Joi.string()).optional(),
  }),

  validateCode: Joi.object({
    code: Joi.string().required().min(5).max(10000),
    language: Joi.string().required(),
    rules: Joi.array().items(Joi.string()).optional(),
  }),
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      logger.error('Validation schema not found', { schemaName });
      return res.status(500).json({
        error: 'Internal validation configuration error',
        code: 'VALIDATION_CONFIG_ERROR',
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      logger.warn('Request validation failed', { schemaName, details });
      
      return res.status(400).json({
        error: 'Request validation failed',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    req.validatedBody = value;
    next();
  };
};

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .substring(0, 10000)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

module.exports = {
  validate,
  sanitizeInput,
  schemas,
};
