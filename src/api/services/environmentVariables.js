/**
 * Environment Variables Backend Service
 * Handles environment variable operations with base44 backend
 */

import { base44 } from '../base44Client';

export const environmentVariablesService = {
  /**
   * Fetch all environment variables for a project
   */
  async getAll(projectId, environment = 'development') {
    try {
      const variables = await base44.entities.EnvironmentVariable.filter({
        project_id: projectId,
        environment: environment
      });
      return variables;
    } catch (error) {
      console.error('Failed to fetch environment variables:', error);
      throw error;
    }
  },

  /**
   * Create a new environment variable
   */
  async create(projectId, data) {
    try {
      const variable = await base44.entities.EnvironmentVariable.create({
        project_id: projectId,
        ...data,
        created_at: new Date().toISOString()
      });
      return variable;
    } catch (error) {
      console.error('Failed to create environment variable:', error);
      throw error;
    }
  },

  /**
   * Update an environment variable
   */
  async update(variableId, data) {
    try {
      const variable = await base44.entities.EnvironmentVariable.update(variableId, data);
      return variable;
    } catch (error) {
      console.error('Failed to update environment variable:', error);
      throw error;
    }
  },

  /**
   * Delete an environment variable
   */
  async delete(variableId) {
    try {
      await base44.entities.EnvironmentVariable.delete(variableId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete environment variable:', error);
      throw error;
    }
  },

  /**
   * Bulk import environment variables from .env file
   */
  async bulkImport(projectId, variables, environment) {
    try {
      // Create multiple variables
      const promises = variables.map(variable => 
        base44.entities.EnvironmentVariable.create({
          project_id: projectId,
          environment,
          ...variable,
          created_at: new Date().toISOString()
        })
      );
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Failed to import environment variables:', error);
      throw error;
    }
  }
};

export default environmentVariablesService;
