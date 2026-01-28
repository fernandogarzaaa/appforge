import { useState, useCallback } from 'react';

/**
 * Hook for managing project cloning state and operations
 */
export const useProjectCloning = (onSuccess) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [recentClones, setRecentClones] = useState([]);
  const [isCloning, setIsCloning] = useState(false);

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
      ...prev.slice(0, 9) // Keep last 10 clones
    ]);

    if (onSuccess) {
      onSuccess(clonedProject);
    }

    closeCloneDialog();
  }, [onSuccess, closeCloneDialog]);

  const getRecentClones = useCallback(() => {
    return recentClones;
  }, [recentClones]);

  const clearRecentClones = useCallback(() => {
    setRecentClones([]);
  }, []);

  return {
    isOpen,
    selectedProject,
    recentClones,
    isCloning,
    openCloneDialog,
    closeCloneDialog,
    handleCloneSuccess,
    getRecentClones,
    clearRecentClones
  };
};

export default useProjectCloning;
