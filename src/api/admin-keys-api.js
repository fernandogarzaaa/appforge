/**
 * Admin API Keys Management API
 * Centralized API calls for managing API keys
 */

import { apiClient } from './client';

const BASE_URL = '/api/admin/api-keys';

export const apiKeysAPI = {
  /**
   * List all API keys with pagination and filtering
   */
  listKeys: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.status) params.append('status', options.status);
    if (options.type) params.append('type', options.type);
    if (options.sort) params.append('sort', options.sort);
    
    return apiClient.get(`${BASE_URL}?${params.toString()}`);
  },

  /**
   * Create a new API key
   */
  createKey: async (data) => {
    return apiClient.post(BASE_URL, {
      name: data.name,
      description: data.description || '',
      type: data.type || 'private',
      rateLimit: data.rateLimit || 1000,
      expiresAt: data.expiresAt || null,
      scopes: data.scopes || ['read'],
    });
  },

  /**
   * Get details of a specific API key
   */
  getKeyDetails: async (id) => {
    return apiClient.get(`${BASE_URL}/${id}`);
  },

  /**
   * Rotate an API key (generate new key with grace period)
   */
  rotateKey: async (id, options = {}) => {
    return apiClient.post(`${BASE_URL}/${id}/rotate`, {
      gracePeriodDays: options.gracePeriodDays || 7,
      completeEarly: options.completeEarly || false,
    });
  },

  /**
   * Revoke an API key (immediate disable)
   */
  revokeKey: async (id) => {
    return apiClient.post(`${BASE_URL}/${id}/revoke`, {});
  },

  /**
   * Get usage statistics for a specific key
   */
  getKeyUsage: async (id, options = {}) => {
    const params = new URLSearchParams();
    if (options.period) params.append('period', options.period);
    
    return apiClient.get(`${BASE_URL}/${id}/usage?${params.toString()}`);
  },

  /**
   * Get overall API keys usage chart data
   */
  getUsageChart: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.period) params.append('period', options.period);
    if (options.granularity) params.append('granularity', options.granularity);
    
    return apiClient.get(`${BASE_URL}/usage/chart?${params.toString()}`);
  },

  /**
   * Copy an existing API key
   */
  copyKey: async (id, name) => {
    return apiClient.post(`${BASE_URL}/${id}/copy`, {
      newName: name,
    });
  },

  /**
   * Update API key settings (metadata only, not the key itself)
   */
  updateKey: async (id, data) => {
    return apiClient.put(`${BASE_URL}/${id}`, {
      name: data.name,
      description: data.description,
      rateLimit: data.rateLimit,
      expiresAt: data.expiresAt,
    });
  },
};
