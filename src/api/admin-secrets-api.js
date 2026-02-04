/**
 * Admin Secrets Management API
 * Centralized API calls for managing secrets and environment variables
 */

import { apiClient } from './client';

const BASE_URL = '/api/admin/secrets';

export const secretsAPI = {
  /**
   * List secrets for a specific environment
   */
  listSecrets: async (env = 'prod', options = {}) => {
    const params = new URLSearchParams();
    params.append('env', env);
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    
    return apiClient.get(`${BASE_URL}?${params.toString()}`);
  },

  /**
   * Create a new secret
   */
  createSecret: async (data) => {
    return apiClient.post(BASE_URL, {
      name: data.name,
      value: data.value,
      description: data.description || '',
      environment: data.environment || 'prod',
      encrypted: data.encrypted !== false,
      expiresAt: data.expiresAt || null,
    });
  },

  /**
   * Update an existing secret
   */
  updateSecret: async (id, data) => {
    return apiClient.put(`${BASE_URL}/${id}`, {
      name: data.name,
      value: data.value,
      description: data.description,
      expiresAt: data.expiresAt,
      encrypted: data.encrypted !== false,
    });
  },

  /**
   * Delete a secret
   */
  deleteSecret: async (id) => {
    return apiClient.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Get audit trail for secrets
   */
  getAuditTrail: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.secretId) params.append('secretId', options.secretId);
    
    return apiClient.get(`${BASE_URL}/audit?${params.toString()}`);
  },

  /**
   * Import secrets from file (.env or JSON)
   */
  importSecrets: async (data) => {
    return apiClient.post(`${BASE_URL}/import`, {
      secrets: data.secrets,
      environment: data.environment || 'prod',
      conflictResolution: data.conflictResolution || 'skip', // 'skip' | 'overwrite' | 'abort'
    });
  },

  /**
   * Export secrets as encrypted JSON or .env file
   */
  exportSecrets: async (env = 'prod', options = {}) => {
    const params = new URLSearchParams();
    params.append('env', env);
    if (options.format) params.append('format', options.format); // 'json' | 'env'
    
    return apiClient.get(`${BASE_URL}/export?${params.toString()}`);
  },

  /**
   * Rotate all secrets (generate new values)
   */
  rotateAll: async (env = 'prod', options = {}) => {
    return apiClient.post(`${BASE_URL}/rotate-all`, {
      environment: env,
      gracePeriodDays: options.gracePeriodDays || 7,
    });
  },

  /**
   * Set retention policy for deleted secrets
   */
  setRetentionPolicy: async (days) => {
    return apiClient.post(`${BASE_URL}/retention-policy`, {
      retentionDays: days,
    });
  },

  /**
   * Get retention policy
   */
  getRetentionPolicy: async () => {
    return apiClient.get(`${BASE_URL}/retention-policy`);
  },

  /**
   * Validate secret name format
   */
  validateSecretName: async (name) => {
    return apiClient.post(`${BASE_URL}/validate-name`, {
      name,
    });
  },
};
