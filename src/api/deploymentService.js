/**
 * Deployment Service - Backend Integration
 * Handles deployment tracking and management with base44 backend
 */

export const deploymentService = {
  /**
   * Get deployment history for a project
   */
  async getDeployments(base44Client, projectId, limit = 50) {
    try {
      const deployments = await base44Client.entities.Deployment.filter({
        project_id: projectId
      });

      // Sort by creation date descending and limit results
      return deployments
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching deployments:', error);
      return [];
    }
  },

  /**
   * Get a specific deployment
   */
  async getDeployment(base44Client, deploymentId) {
    try {
      return await base44Client.entities.Deployment.get(deploymentId);
    } catch (error) {
      console.error('Error fetching deployment:', error);
      throw error;
    }
  },

  /**
   * Create a new deployment
   */
  async createDeployment(base44Client, projectId, data) {
    try {
      const deployment = await base44Client.entities.Deployment.create({
        project_id: projectId,
        status: 'pending',
        environment: data.environment,
        version: data.version,
        branch: data.branch,
        commit_hash: data.commit_hash,
        commit_message: data.commit_message,
        triggered_by: data.triggered_by || 'manual',
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        duration: null
      });

      return deployment;
    } catch (error) {
      console.error('Error creating deployment:', error);
      throw error;
    }
  },

  /**
   * Update deployment status
   */
  async updateDeploymentStatus(base44Client, deploymentId, status, data = {}) {
    try {
      const updates = {
        status: status,
        started_at: undefined,
        completed_at: undefined,
        ...data
      };

      if (status === 'building' && !data.started_at) {
        updates.started_at = new Date().toISOString();
      }

      if (['success', 'failed', 'cancelled'].includes(status) && !data.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      await base44Client.entities.Deployment.update(deploymentId, updates);
      return true;
    } catch (error) {
      console.error('Error updating deployment status:', error);
      throw error;
    }
  },

  /**
   * Rollback to a previous deployment
   */
  async rollbackDeployment(base44Client, projectId, fromDeploymentId, toDeploymentId) {
    try {
      const newDeployment = await base44Client.entities.Deployment.create({
        project_id: projectId,
        status: 'deploying',
        environment: 'production',
        version: 'rollback',
        rollback_from: fromDeploymentId,
        rollback_to: toDeploymentId,
        triggered_by: 'manual',
        created_at: new Date().toISOString()
      });

      return newDeployment;
    } catch (error) {
      console.error('Error rolling back deployment:', error);
      throw error;
    }
  },

  /**
   * Cancel a deployment
   */
  async cancelDeployment(base44Client, deploymentId) {
    try {
      await base44Client.entities.Deployment.update(deploymentId, {
        status: 'cancelled',
        completed_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error cancelling deployment:', error);
      throw error;
    }
  },

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(base44Client, deploymentId) {
    try {
      const logs = await base44Client.entities.DeploymentLog.filter({
        deployment_id: deploymentId
      });

      return logs
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(l => l.message);
    } catch (error) {
      console.error('Error fetching deployment logs:', error);
      return [];
    }
  },

  /**
   * Add a log entry to a deployment
   */
  async addDeploymentLog(base44Client, deploymentId, message, level = 'info') {
    try {
      await base44Client.entities.DeploymentLog.create({
        deployment_id: deploymentId,
        message: message,
        level: level,
        created_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error adding deployment log:', error);
      // Non-critical, don't throw
      return false;
    }
  }
};

export default deploymentService;
