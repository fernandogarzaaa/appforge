/**
 * Deployments Backend Service
 * Handles deployment operations with base44 backend
 */

import { base44 } from '../base44Client';

export const deploymentsService = {
  /**
   * Fetch all deployments for a project
   */
  async getAll(projectId, filters = {}) {
    try {
      const deployments = await base44.entities.Deployment.filter({
        project_id: projectId,
        ...filters
      });
      return deployments;
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
      throw error;
    }
  },

  /**
   * Get a specific deployment
   */
  async getById(deploymentId) {
    try {
      const deployment = await base44.entities.Deployment.get(deploymentId);
      return deployment;
    } catch (error) {
      console.error('Failed to fetch deployment:', error);
      throw error;
    }
  },

  /**
   * Get deployment logs
   */
  async getLogs(deploymentId) {
    try {
      const logs = await base44.entities.DeploymentLog.filter({
        deployment_id: deploymentId
      });
      return logs.map(log => log.message);
    } catch (error) {
      console.error('Failed to fetch deployment logs:', error);
      throw error;
    }
  },

  /**
   * Rollback to a previous deployment
   */
  async rollback(deploymentId, previousVersion) {
    try {
      // Create a new deployment with rollback info
      const newDeployment = await base44.entities.Deployment.create({
        version: previousVersion,
        status: 'deploying',
        rollback_from: deploymentId,
        created_at: new Date().toISOString()
      });
      return newDeployment;
    } catch (error) {
      console.error('Failed to rollback deployment:', error);
      throw error;
    }
  },

  /**
   * Cancel a pending/running deployment
   */
  async cancel(deploymentId) {
    try {
      const result = await base44.entities.Deployment.update(deploymentId, {
        status: 'cancelled'
      });
      return result;
    } catch (error) {
      console.error('Failed to cancel deployment:', error);
      throw error;
    }
  },

  /**
   * Trigger a new deployment
   */
  async create(projectId, data) {
    try {
      const deployment = await base44.entities.Deployment.create({
        project_id: projectId,
        ...data,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      return deployment;
    } catch (error) {
      console.error('Failed to create deployment:', error);
      throw error;
    }
  }
};

export default deploymentsService;
