/**
 * Authentication Controller
 * Handles user login, registration, token refresh
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, createError, validateEmail, sanitizeUser } from '../utils/helpers.js';
import { getJWTConfig } from '../config/index.js';

// Mock user database (replace with actual DB)
const users = new Map();

export const register = async (req, res, next) => {
  try {
    const { email, password, name, organizationName } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      throw createError(400, 'Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw createError(400, 'Password must be at least 8 characters');
    }

    // Check if user exists
    if (users.has(email)) {
      throw createError(409, 'Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      organizationName: organizationName || '',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      apiKeys: [],
      subscriptionTier: 'free'
    };

    users.set(email, user);

    // Generate JWT
    const jwtConfig = getJWTConfig();
    const token = jwt.sign(
      { id: userId, email, role: 'user' },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.status(201).json(successResponse({
      user: sanitizeUser(user),
      token,
      expiresIn: jwtConfig.expiresIn
    }, 'User registered successfully'));
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.get(email);
    if (!user) {
      throw createError(401, 'Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError(401, 'Invalid email or password');
    }

    // Update last login
    user.updatedAt = new Date();

    // Generate JWT
    const jwtConfig = getJWTConfig();
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json(successResponse({
      user: sanitizeUser(user),
      token,
      expiresIn: jwtConfig.expiresIn
    }, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

export const refreshToken = (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw createError(400, 'Token is required');
    }

    const jwtConfig = getJWTConfig();
    const decoded = jwt.verify(token, jwtConfig.secret, { ignoreExpiration: true });

    // Generate new token
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json(successResponse({
      token: newToken,
      expiresIn: jwtConfig.expiresIn
    }, 'Token refreshed successfully'));
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = (req, res, next) => {
  try {
    const user = users.get(req.user.email);

    if (!user) {
      throw createError(404, 'User not found');
    }

    res.json(successResponse({
      user: sanitizeUser(user)
    }, 'User retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  // Token is invalidated on client side
  // In production with blacklist, would add token to blacklist here
  res.json(successResponse(null, 'Logout successful'));
};
