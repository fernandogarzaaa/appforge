/**
 * Authentication Routes
 */

import express from 'express';
import { register, login, refreshToken, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../validators/schemas.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', (req, res, next) => {
  try {
    validate(registerSchema, req.body);
    register(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', (req, res, next) => {
  try {
    validate(loginSchema, req.body);
    login(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', refreshToken);

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * POST /api/auth/logout
 * Logout user (requires authentication)
 */
router.post('/logout', authenticate, logout);

export default router;
