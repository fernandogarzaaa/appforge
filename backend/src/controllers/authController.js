/**
 * Authentication Controller
 * Handles user login, registration, token refresh
 * Uses MongoDB User model for persistent storage
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { successResponse, errorResponse, createError, validateEmail, sanitizeUser } from '../utils/helpers.js';
import { getJWTConfig } from '../config/index.js';

/**
 * Sanitize user object for API response (remove sensitive fields)
 */
const sanitizeUserForResponse = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  const { password, __v, ...safeUser } = userObj;
  return {
    id: safeUser._id?.toString() || safeUser.id,
    email: safeUser.email,
    username: safeUser.username,
    firstName: safeUser.firstName,
    lastName: safeUser.lastName,
    role: safeUser.role,
    isActive: safeUser.isActive,
    lastLogin: safeUser.lastLogin,
    createdAt: safeUser.createdAt,
    updatedAt: safeUser.updatedAt
  };
};

export const register = async (req, res, next) => {
  try {
    const { email, password, name, username, organizationName } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      throw createError(400, 'Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw createError(400, 'Password must be at least 8 characters');
    }

    // Check if user exists by email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      throw createError(409, 'Email already registered');
    }

    // Check if username exists
    const usernameToUse = username || name || email.split('@')[0];
    const existingUsername = await User.findOne({ username: usernameToUse });
    if (existingUsername) {
      throw createError(409, 'Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in MongoDB
    const user = new User({
      email: email.toLowerCase(),
      username: usernameToUse,
      password: hashedPassword,
      firstName: name?.split(' ')[0] || '',
      lastName: name?.split(' ').slice(1).join(' ') || '',
      role: 'user',
      isActive: true
    });

    await user.save();

    // Generate JWT
    const jwtConfig = getJWTConfig();
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.status(201).json(successResponse({
      user: sanitizeUserForResponse(user),
      token,
      expiresIn: jwtConfig.expiresIn
    }, 'User registered successfully'));
  } catch (err) {
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return next(createError(409, `${field} already exists`));
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user in MongoDB
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw createError(401, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw createError(403, 'Account is disabled. Please contact support.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError(401, 'Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const jwtConfig = getJWTConfig();
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json(successResponse({
      user: sanitizeUserForResponse(user),
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

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      throw createError(404, 'User not found');
    }

    if (!user.isActive) {
      throw createError(403, 'Account is disabled');
    }

    res.json(successResponse({
      user: sanitizeUserForResponse(user)
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
