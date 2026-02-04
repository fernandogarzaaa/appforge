const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// Verify JWT token from Authorization header
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Missing authorization header',
        code: 'AUTH_MISSING',
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
    };
    
    logger.debug('Token verified successfully', { userId: req.user.id });
    next();
  } catch (err) {
    logger.warn('Token verification failed', { error: err.message });
    
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        code: 'AUTH_TOKEN_EXPIRED',
      });
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'AUTH_INVALID_TOKEN',
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
};

// Generate JWT token for user
const generateToken = (userId, email) => {
  return jwt.sign(
    {
      userId,
      email,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Optional auth - doesn't fail if no token, but verifies if present
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };
      logger.debug('Optional token verified', { userId: req.user.id });
    }
    next();
  } catch (err) {
    logger.debug('Optional auth skipped - continuing without authentication', { error: err.message });
    next();
  }
};

module.exports = {
  verifyToken,
  generateToken,
  optionalAuth,
};
