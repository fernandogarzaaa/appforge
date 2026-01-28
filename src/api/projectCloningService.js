/**
 * Project Cloning Service - Backend Integration
 * Handles project cloning with optional settings copy
 */

export const projectCloningService = {
  /**
   * Clone a project
   */
  async cloneProject(base44Client, sourceProjectId, cloneName, options = {}) {
    try {
      const sourceProject = await base44Client.entities.Project.get(sourceProjectId);

      const {
        copySettings = true,
        copyDeployments = false,
        copyEnvironmentVars = false,
        copyTeamMembers = false
      } = options;

      // Create new project
      const clonedProject = await base44Client.entities.Project.create({
        name: cloneName,
        description: copySettings ? `${sourceProject.description} (Cloned)` : cloneName,
        framework: sourceProject.framework,
        template: sourceProject.template,
        visibility: sourceProject.visibility || 'private',
        cloned_from: sourceProjectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Copy settings if requested
      if (copySettings && sourceProject.settings) {
        await base44Client.entities.ProjectSettings.create({
          project_id: clonedProject.id,
          settings: sourceProject.settings,
          created_at: new Date().toISOString()
        });
      }

      // Copy environment variables if requested
      if (copyEnvironmentVars) {
        const sourceVars = await base44Client.entities.EnvironmentVariable.filter({
          project_id: sourceProjectId
        });

        for (const variable of sourceVars) {
          await base44Client.entities.EnvironmentVariable.create({
            project_id: clonedProject.id,
            name: variable.name,
            value: variable.value,
            type: variable.type,
            environment: variable.environment,
            description: variable.description,
            is_encrypted: variable.is_encrypted,
            created_at: new Date().toISOString()
          });
        }
      }

      // Copy team members if requested
      if (copyTeamMembers) {
        const sourceMembers = await base44Client.entities.ProjectMember.filter({
          project_id: sourceProjectId
        });

        for (const member of sourceMembers) {
          await base44Client.entities.ProjectMember.create({
            project_id: clonedProject.id,
            email: member.email,
            role: member.role,
            joined_at: new Date().toISOString()
          });
        }
      }

      // Deployment history is typically not copied due to environment differences

      return clonedProject;
    } catch (error) {
      console.error('Error cloning project:', error);
      throw error;
    }
  },

  /**
   * Get clone history for a project
   */
  async getCloneHistory(base44Client, projectId) {
    try {
      // Get projects cloned from this one
      const clones = await base44Client.entities.Project.filter({
        cloned_from: projectId
      });

      return clones;
    } catch (error) {
      console.error('Error fetching clone history:', error);
      return [];
    }
  },

  /**
   * Get source project of a clone
   */
  async getSourceProject(base44Client, clonedProjectId) {
    try {
      const project = await base44Client.entities.Project.get(clonedProjectId);
      
      if (project.cloned_from) {
        return await base44Client.entities.Project.get(project.cloned_from);
      }

      return null;
    } catch (error) {
      console.error('Error fetching source project:', error);
      return null;
    }
  }
};

export default projectCloningService;
