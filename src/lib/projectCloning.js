/**
 * Project Cloning Utilities
 * Handles project duplication with optional settings copy
 */

/**
 * Generate a unique project name based on original
 * @param {string} originalName - Original project name
 * @param {Array} existingProjects - List of existing projects
 * @returns {string} New unique project name
 */
export const generateCloneName = (originalName, existingProjects = []) => {
  const existingNames = existingProjects.map(p => p.name);
  let counter = 1;
  let newName = `${originalName} (Copy)`;
  
  while (existingNames.includes(newName)) {
    counter++;
    newName = `${originalName} (Copy ${counter})`;
  }
  
  return newName;
};

/**
 * Validate project name
 * @param {string} name - Project name to validate
 * @returns {object} { isValid, error }
 */
export const validateProjectName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Project name cannot be empty' };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Project name cannot exceed 100 characters' };
  }
  
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return { isValid: false, error: 'Project name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Clone a project with optional settings copy
 * @param {object} sourceProject - Project to clone
 * @param {string} newName - Name for cloned project
 * @param {object} options - Cloning options
 * @returns {Promise<object>} Cloned project
 */
export const cloneProject = async (sourceProject, newName, options = {}) => {
  const {
    copySettings = true,
    copyDeployments = false,
    copyEnvironmentVars = false,
    copyTeamMembers = false
  } = options;

  // Validate inputs
  const validation = validateProjectName(newName);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  if (!sourceProject || !sourceProject.id) {
    throw new Error('Invalid source project');
  }

  // Build cloned project data
  const clonedProject = {
    name: newName,
    description: sourceProject.description ? `${sourceProject.description} (Cloned)` : 'Cloned project',
    framework: sourceProject.framework || 'react',
    template: sourceProject.template || null,
    visibility: sourceProject.visibility || 'private',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cloned_from: sourceProject.id,
    settings: copySettings ? { ...sourceProject.settings } : {},
    environment_variables: copyEnvironmentVars ? [...(sourceProject.environment_variables || [])] : [],
    team_members: copyTeamMembers ? [...(sourceProject.team_members || [])] : [],
    deployments: copyDeployments ? [...(sourceProject.deployments || [])] : []
  };

  return clonedProject;
};

/**
 * Get project clone summary
 * @param {object} sourceProject - Project being cloned
 * @param {object} options - Cloning options
 * @returns {object} Summary of what will be cloned
 */
export const getCloneSummary = (sourceProject, options = {}) => {
  const {
    copySettings = true,
    copyDeployments = false,
    copyEnvironmentVars = false,
    copyTeamMembers = false
  } = options;

  const items = [];
  
  if (copySettings) items.push('Project settings');
  if (copyEnvironmentVars) items.push(`${(sourceProject.environment_variables || []).length} environment variables`);
  if (copyTeamMembers) items.push(`${(sourceProject.team_members || []).length} team members`);
  if (copyDeployments) items.push('Deployment history');

  return {
    projectName: sourceProject.name,
    itemsToClone: items.length > 0 ? items : ['Nothing (empty clone)'],
    totalItems: items.length,
    size: calculateCloneSize(sourceProject, options)
  };
};

/**
 * Calculate estimated size of cloned project
 * @param {object} sourceProject - Project being cloned
 * @param {object} options - Cloning options
 * @returns {string} Human-readable size estimate
 */
export const calculateCloneSize = (sourceProject, options = {}) => {
  const {
    copySettings = true,
    copyDeployments = false,
    copyEnvironmentVars = false,
    copyTeamMembers = false
  } = options;

  let sizeInBytes = 5000; // Base project data

  if (copySettings) sizeInBytes += 10000;
  if (copyEnvironmentVars) sizeInBytes += (sourceProject.environment_variables || []).length * 500;
  if (copyTeamMembers) sizeInBytes += (sourceProject.team_members || []).length * 1000;
  if (copyDeployments) sizeInBytes += (sourceProject.deployments || []).length * 5000;

  if (sizeInBytes < 1024) return `${Math.round(sizeInBytes)} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
};
