
// ===============================================
// ENHANCED VALIDATION (Phase 1 Security)
// ===============================================

import { body, param, query, validationResult } from 'express-validator';
import createError from 'http-errors';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Validate request using express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    
    return next(createError(400, 'Validation failed', { errors: errorMessages }));
  }
  
  next();
};

/**
 * Sanitize HTML to prevent XSS attacks
 */
export const sanitizeHtml = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
};

/**
 * Sanitize user input in request body
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
        
        // Sanitize HTML fields
        if (key.includes('html') || key.includes('content') || key.includes('description')) {
          req.body[key] = sanitizeHtml(req.body[key]);
        }
      }
    });
  }
  next();
};

/**
 * Sanitize AI model responses before quantum processing
 */
export const sanitizeAIResponse = (response) => {
  if (typeof response !== 'string') {
    return response;
  }
  
  // Remove potentially malicious content
  let sanitized = response
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
  
  // Limit length to prevent DoS
  if (sanitized.length > 500000) {
    sanitized = sanitized.substring(0, 500000);
  }
  
  return sanitized;
};

// Common validation rules
export const emailValidation = () => [
  body('email').trim().isEmail().normalizeEmail().isLength({ max: 255 })
];

export const passwordValidation = () => [
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
];

export const quantumAnalysisValidation = () => [
  body('code').trim().notEmpty().isLength({ max: 100000 }),
  body('language').optional().isIn(['javascript', 'typescript', 'python', 'java', 'go', 'rust'])
];

export const webhookValidation = () => [
  body('url').trim().isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('events').isArray({ min: 1 })
];
import { AppError } from './errorHandler.js';

/**
 * Middleware to validate request data against Joi schema
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Include all errors
      allowUnknown: true, // Ignore unknown props
      stripUnknown: true // Remove unknown props
    };

    const { error, value } = schema.validate(req.body, validationOptions);

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(new AppError(errorMessage, 400));
    }

    // Replace request body with validated value
    req.body = value;
    next();
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(new AppError(errorMessage, 400));
    }

    req.query = value;
    next();
  };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(new AppError(errorMessage, 400));
    }

    req.params = value;
    next();
  };
};
