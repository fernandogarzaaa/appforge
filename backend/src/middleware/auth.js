/**
 * JWT Authentication Middleware
 * Verifies JWT tokens in Authorization header or cookies
 */

import jwt from 'jsonwebtoken';
import { getJWTConfig } from '../config/index.js';

export const authenticate = (req, res, next) => {
  try {
    // Try to get token from Authorization header first
    let token = req.headers.authorization?.split(' ')[1];
    
    // If not in header, try to parse from cookies manually
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') {
          token = decodeURIComponent(value);
          break;
        }
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }

    const jwtConfig = getJWTConfig();
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch (err) {
    // Handle specific JWT errors
    let message = 'Invalid or expired token';
    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }
    
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Optional authentication
 * Does not fail if token is invalid, just sets req.user to null
 */
export const optionalAuth = (req, res, next) => {
  try {
    // Try to get token from Authorization header first
    let token = req.headers.authorization?.split(' ')[1];
    
    // If not in header, try to parse from cookies manually
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') {
          token = decodeURIComponent(value);
          break;
        }
      }
    }
    
    if (token) {
      const jwtConfig = getJWTConfig();
      const decoded = jwt.verify(token, jwtConfig.secret);
      req.user = decoded;
    }
  } catch (err) {
    // Silently fail - user not authenticated but request continues
    req.user = null;
  }
  next();
};

/**
 * Role-based access control
 * Checks if user has required role
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `User role '${req.user.role}' is not authorized for this action`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

export default authenticate;
