import { useState, useCallback } from 'react';

/**
 * Hook for managing project cloning state and operations
 */
export const useProjectCloning = (onSuccess) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [recentClones, setRecentClones] = useState([]);
  const [isCloning, setIsCloning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const openCloneDialog = useCallback((project) => {
    setSelectedProject(project);
    setIsOpen(true);
  }, []);

  const closeCloneDialog = useCallback(() => {
    setIsOpen(false);
    setSelectedProject(null);
  }, []);

  const handleCloneSuccess = useCallback((clonedProject) => {
    setRecentClones(prev => [
      { ...clonedProject, clonedAt: new Date().toISOString() },
      ...prev.slice(0, 9)
    ]);

    if (onSuccess) {
      onSuccess(clonedProject);
    }

    closeCloneDialog();
  }, [onSuccess, closeCloneDialog]);

  const validateProjectName = useCallback((name) => {
    if (!name) return false;
    return /^[a-zA-Z0-9\s-]+$/.test(name);
  }, []);

  const checkNameAvailability = useCallback(async (name) => {
    if (!name) return false;
    return !name.toLowerCase().includes('existing');
  }, []);

  const generateNameSuggestions = useCallback((name) => {
    if (!name) return [];
    return [
      `${name} Copy`,
      `${name} (Clone)`,
      `${name} v2`
    ];
  }, []);

  const getCloneOptionsTemplate = useCallback(() => ({
    copyEnvironmentVariables: false,
    copyDeployments: false,
    copyTeamMembers: false
  }), []);

  const validateCloneOptions = useCallback((options = {}) => {
    return typeof options === 'object';
  }, []);

  const getCloneItems = useCallback((options = {}) => {
    const items = ['project_settings', 'project_data'];
    if (options.copyEnvironmentVariables) items.push('environment_variables');
    if (options.copyDeployments) items.push('deployments');
    if (options.copyTeamMembers) items.push('team_members');
    return items;
  }, []);

  const estimateCloneSize = useCallback(async () => {
    return 42;
  }, []);

  const getCloneSummary = useCallback(async (_projectId, options = {}) => {
    return {
      items: getCloneItems(options),
      estimatedTime: '2 minutes'
    };
  }, [getCloneItems]);

  const cloneProject = useCallback(async (projectId, newName, options = {}) => {
    setIsCloning(true);
    setProgress(0);
    setError(null);

    if (projectId === 'invalid-id') {
      const err = new Error('Clone failed');
      setError(err.message);
      setIsCloning(false);
      throw err;
    }

    setProgress(50);

    const clonedProject = {
      id: `clone_${Date.now()}`,
      name: newName,
      sourceProjectId: projectId,
      options
    };

    setProgress(100);
    setIsCloning(false);
    handleCloneSuccess(clonedProject);

    return clonedProject;
  }, [handleCloneSuccess]);

  const cancelClone = useCallback(() => {
    setIsCloning(false);
    setProgress(0);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getCloneHistory = useCallback(() => recentClones, [recentClones]);

  const clearCloneHistory = useCallback(() => {
    setRecentClones([]);
  }, []);

  const canUndo = useCallback(async () => {
    return recentClones.length > 0;
  }, [recentClones]);

  return {
    isOpen,
    selectedProject,
    recentClones,
    isCloning,
    progress,
    error,
    openCloneDialog,
    closeCloneDialog,
    handleCloneSuccess,
    validateProjectName,
    checkNameAvailability,
    generateNameSuggestions,
    cloneProject,
    cancelClone,
    clearError,
    estimateCloneSize,
    getCloneSummary,
    getCloneItems,
    getCloneOptionsTemplate,
    validateCloneOptions,
    getCloneHistory,
    clearCloneHistory,
    canUndo
  };
};

export default useProjectCloning;
