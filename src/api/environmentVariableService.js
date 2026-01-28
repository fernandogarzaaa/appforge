/**
 * Environment Variables Service - Backend Integration
 * Handles environment variable management with base44 backend
 */

import { encryptValue, decryptValue } from '@/lib/environmentVariables';

export const environmentVariableService = {
  /**
   * Get all environment variables for a project
   */
  async getEnvironmentVariables(base44Client, projectId, environment) {
    try {
      const vars = await base44Client.entities.EnvironmentVariable.filter({
        project_id: projectId,
        environment: environment
      });

      return vars.map(v => ({
        ...v,
        // Decrypt if needed
        value: v.type === 'secret' ? decryptValue(v.value) : v.value
      }));
    } catch (error) {
      console.error('Error fetching environment variables:', error);
      return [];
    }
  },

  /**
   * Create a new environment variable
   */
  async createEnvironmentVariable(base44Client, projectId, data) {
    try {
      const value = data.type === 'secret' ? encryptValue(data.value) : data.value;

      const newVar = await base44Client.entities.EnvironmentVariable.create({
        project_id: projectId,
        name: data.name,
        value: value,
        type: data.type,
        environment: data.environment,
        description: data.description,
        is_encrypted: data.type === 'secret',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return newVar;
    } catch (error) {
      console.error('Error creating environment variable:', error);
      throw error;
    }
  },

  /**
   * Update an environment variable
   */
  async updateEnvironmentVariable(base44Client, varId, data) {
    try {
      const value = data.type === 'secret' ? encryptValue(data.value) : data.value;

      await base44Client.entities.EnvironmentVariable.update(varId, {
        name: data.name,
        value: value,
        type: data.type,
        description: data.description,
        is_encrypted: data.type === 'secret',
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating environment variable:', error);
      throw error;
    }
  },

  /**
   * Delete an environment variable
   */
  async deleteEnvironmentVariable(base44Client, varId) {
    try {
      await base44Client.entities.EnvironmentVariable.delete(varId);
      return true;
    } catch (error) {
      console.error('Error deleting environment variable:', error);
      throw error;
    }
  },

  /**
   * Export environment variables as .env format
   */
  async exportEnvironmentVariables(base44Client, projectId, environment) {
    try {
      const vars = await this.getEnvironmentVariables(base44Client, projectId, environment);
      
      return vars
        .map(v => {
          const value = v.value.includes('\n') || v.value.includes('"')
            ? `"${v.value.replace(/"/g, '\\"')}"`
            : v.value;
          return `${v.name}=${value}`;
        })
        .join('\n');
    } catch (error) {
      console.error('Error exporting environment variables:', error);
      throw error;
    }
  }
};

export default environmentVariableService;
