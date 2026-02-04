import axios from 'axios';
import { appParams } from '@/lib/app-params';

/**
 * Admin API Endpoints
 * All calls include authentication token and are subject to rate limiting
 * 
 * Security:
 * - All requests include auth token
 * - All requests use HTTPS
 * - All requests are logged to audit trail
 * - CORS configured for admin endpoints
 */

// Create axios instance for admin API calls
const adminClient = axios.create({
  baseURL: '/api/admin',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Id': appParams.appId,
  }
});

// Add auth token to every request
adminClient.interceptors.request.use((config) => {
  if (appParams.token) {
    config.headers.Authorization = `Bearer ${appParams.token}`;
  }
  return config;
});

// Handle response errors
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  /**
   * Check if current user is admin
   * GET /api/user/admin-status
   * Response: { isAdmin: boolean, role: string }
   */
  checkAdminStatus: async () => {
    return adminClient.get('/user/admin-status');
  },

  /**
   * Get user permissions
   * GET /api/user/permissions
   * Response: { permissions: object }
   */
  getPermissions: async () => {
    return adminClient.get('/user/permissions');
  },

  /**
   * Validate admin token
   * POST /api/auth/validate-admin
   * Body: { token: string }
   * Response: { valid: boolean, role: string }
   */
  validateAdminToken: async (token) => {
    return adminClient.post('/auth/validate-admin', { token });
  },

  /**
   * Log an admin action to audit trail
   * POST /api/audit/admin-action
   * Body: { action: string, resource: string, details: object }
   */
  logAdminAction: async (action, resource, details = {}) => {
    return adminClient.post('/audit/admin-action', {
      action,
      resource,
      details,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Get audit log entries
   * GET /api/audit/logs?limit=50&offset=0
   */
  getAuditLogs: async (limit = 50, offset = 0) => {
    return adminClient.get('/audit/logs', {
      params: { limit, offset }
    });
  },

  /**
   * Export audit logs
   * GET /api/audit/export?format=csv
   * Query params: { format: 'csv' | 'json', startDate?: string, endDate?: string }
   */
  exportAuditLogs: async (format = 'csv', startDate = null, endDate = null) => {
    return adminClient.get('/audit/export', {
      params: { format, startDate, endDate }
    });
  },

  /**
   * List all users
   * GET /api/users?limit=50&offset=0
   */
  listUsers: async (limit = 50, offset = 0, filter = {}) => {
    return adminClient.get('/users', {
      params: { limit, offset, ...filter }
    });
  },

  /**
   * Get user details
   * GET /api/users/:userId
   */
  getUser: async (userId) => {
    return adminClient.get(`/users/${userId}`);
  },

  /**
   * Update user role
   * PUT /api/users/:userId/role
   * Body: { role: string }
   */
  updateUserRole: async (userId, role) => {
    return adminClient.put(`/users/${userId}/role`, { role });
  },

  /**
   * Remove user
   * DELETE /api/users/:userId
   */
  removeUser: async (userId) => {
    return adminClient.delete(`/users/${userId}`);
  },

  /**
   * Manage API keys
   * GET /api/keys
   */
  listAPIKeys: async (limit = 50, offset = 0) => {
    return adminClient.get('/keys', {
      params: { limit, offset }
    });
  },

  /**
   * Rotate API key
   * POST /api/keys/:keyId/rotate
   */
  rotateAPIKey: async (keyId) => {
    return adminClient.post(`/keys/${keyId}/rotate`);
  },

  /**
   * Revoke API key
   * DELETE /api/keys/:keyId
   */
  revokeAPIKey: async (keyId) => {
    return adminClient.delete(`/keys/${keyId}`);
  },

  /**
   * Manage secrets
   * GET /api/secrets
   */
  listSecrets: async (limit = 50, offset = 0) => {
    return adminClient.get('/secrets', {
      params: { limit, offset }
    });
  },

  /**
   * Rotate secret
   * POST /api/secrets/:secretId/rotate
   */
  rotateSecret: async (secretId) => {
    return adminClient.post(`/secrets/${secretId}/rotate`);
  },

  /**
   * Get system health status
   * GET /api/system/health
   */
  getSystemHealth: async () => {
    return adminClient.get('/system/health');
  },

  /**
   * Get system analytics
   * GET /api/system/analytics?timeRange=24h
   */
  getSystemAnalytics: async (timeRange = '24h') => {
    return adminClient.get('/system/analytics', {
      params: { timeRange }
    });
  },

  /**
   * Get system logs
   * GET /api/system/logs?level=error
   */
  getSystemLogs: async (level = null, limit = 100) => {
    return adminClient.get('/system/logs', {
      params: { level, limit }
    });
  },

  /**
   * Update system settings
   * PUT /api/system/settings
   * Body: { settings: object }
   */
  updateSystemSettings: async (settings) => {
    return adminClient.put('/system/settings', { settings });
  },

  /**
   * Get billing information
   * GET /api/billing
   */
  getBillingInfo: async () => {
    return adminClient.get('/billing');
  },

  /**
   * Update billing plan
   * PUT /api/billing/plan
   * Body: { planId: string, billingPeriod: string }
   */
  updateBillingPlan: async (planId, billingPeriod = 'monthly') => {
    return adminClient.put('/billing/plan', { planId, billingPeriod });
  },

  /**
   * Get failed login attempts
   * GET /api/security/failed-logins?limit=50
   */
  getFailedLogins: async (limit = 50) => {
    return adminClient.get('/security/failed-logins', {
      params: { limit }
    });
  },

  /**
   * Block/unblock user
   * POST /api/security/block-user
   * Body: { userId: string, blocked: boolean }
   */
  toggleUserBlock: async (userId, blocked) => {
    return adminClient.post('/security/block-user', { userId, blocked });
  },

  /**
   * Force password reset for user
   * POST /api/users/:userId/force-password-reset
   */
  forcePasswordReset: async (userId) => {
    return adminClient.post(`/users/${userId}/force-password-reset`);
  },

  /**
   * Get session information
   * GET /api/sessions/:userId
   */
  getUserSessions: async (userId) => {
    return adminClient.get(`/sessions/${userId}`);
  },

  /**
   * Revoke user session
   * DELETE /api/sessions/:sessionId
   */
  revokeSession: async (sessionId) => {
    return adminClient.delete(`/sessions/${sessionId}`);
  }
};

export default adminAPI;
