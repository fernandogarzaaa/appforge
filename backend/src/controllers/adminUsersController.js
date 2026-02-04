/**
 * Admin Users Controller
 */

import jwt from 'jsonwebtoken';
import { successResponse, createError } from '../utils/helpers.js';
import { getJWTConfig } from '../config/index.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const offset = (page - 1) * limit;

    const { search, role, status } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
    ]);

    res.json(successResponse({
      page,
      limit,
      total,
      users
    }, 'Users retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    user.isActive = false;
    user.updatedAt = new Date();

    await user.save();

    res.json(successResponse({
      id: user.id,
      isActive: user.isActive
    }, 'User banned successfully'));
  } catch (err) {
    next(err);
  }
};

export const unbanUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    user.isActive = true;
    user.updatedAt = new Date();

    await user.save();

    res.json(successResponse({
      id: user.id,
      isActive: user.isActive
    }, 'User unbanned successfully'));
  } catch (err) {
    next(err);
  }
};

export const getImpersonationToken = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    const jwtConfig = getJWTConfig();
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        impersonatedBy: req.user?.id,
        isImpersonation: true
      },
      jwtConfig.secret,
      { expiresIn: '15m' }
    );

    res.json(successResponse({
      token,
      expiresIn: '15m',
      userId: user.id
    }, 'Impersonation token created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const logs = await AuditLog.getUserActivity(id, limit);

    res.json(successResponse(logs, 'User activity retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export default {
  listUsers,
  banUser,
  unbanUser,
  getImpersonationToken,
  getUserActivity
};
