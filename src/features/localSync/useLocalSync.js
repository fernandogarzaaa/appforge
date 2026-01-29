import { useState, useCallback, useEffect } from 'react';

/**
 * Local Development Sync Hook
 * Sync local projects with AppForge, hot-reload on changes
 */
export function useLocalSync() {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, watching, error
  const [syncedProjects, setSyncedProjects] = useState(() => {
    const saved = localStorage.getItem('appforge_synced_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [watchedPaths, setWatchedPaths] = useState(() => {
    const saved = localStorage.getItem('appforge_watched_paths');
    return saved ? JSON.parse(saved) : {};
  });
  const [syncHistory, setSyncHistory] = useState(() => {
    const saved = localStorage.getItem('appforge_sync_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [errors, setErrors] = useState([]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('appforge_synced_projects', JSON.stringify(syncedProjects));
  }, [syncedProjects]);

  useEffect(() => {
    localStorage.setItem('appforge_watched_paths', JSON.stringify(watchedPaths));
  }, [watchedPaths]);

  useEffect(() => {
    localStorage.setItem('appforge_sync_history', JSON.stringify(syncHistory.slice(-50)));
  }, [syncHistory]);

  /**
   * Initiate sync for a local project
   */
  const syncProject = useCallback(async (projectPath, projectId) => {
    setSyncStatus('syncing');
    setErrors([]);

    try {
      const response = await fetch('/api/sync/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          projectId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setSyncedProjects(prev => {
        const updated = prev.filter(p => p.projectId !== projectId);
        return [...updated, { projectPath, projectId, lastSync: Date.now(), status: 'synced' }];
      });

      setSyncHistory(prev => [...prev, {
        projectId,
        action: 'sync_complete',
        timestamp: Date.now(),
        filesChanged: result.filesChanged || 0
      }]);

      setSyncStatus('idle');
      return result;
    } catch (error) {
      setErrors(prev => [...prev, { projectId, message: error.message, timestamp: Date.now() }]);
      setSyncStatus('error');
      throw error;
    }
  }, []);

  /**
   * Start watching local directory for changes
   */
  const startWatching = useCallback(async (projectPath, projectId) => {
    try {
      const response = await fetch('/api/sync/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          projectId,
          enableHotReload: true,
          enableAutoTest: true
        })
      });

      if (!response.ok) {
        throw new Error(`Watch start failed: ${response.statusText}`);
      }

      setWatchedPaths(prev => ({
        ...prev,
        [projectId]: {
          path: projectPath,
          watching: true,
          startTime: Date.now(),
          changeCount: 0
        }
      }));

      setSyncHistory(prev => [...prev, {
        projectId,
        action: 'watch_started',
        timestamp: Date.now()
      }]);

      setSyncStatus('watching');
      return true;
    } catch (error) {
      setErrors(prev => [...prev, { projectId, message: error.message, timestamp: Date.now() }]);
      return false;
    }
  }, []);

  /**
   * Stop watching directory
   */
  const stopWatching = useCallback((projectId) => {
    setWatchedPaths(prev => {
      const updated = { ...prev };
      delete updated[projectId];
      return updated;
    });

    setSyncHistory(prev => [...prev, {
      projectId,
      action: 'watch_stopped',
      timestamp: Date.now()
    }]);

    setSyncStatus('idle');
  }, []);

  /**
   * Enable auto-test on file changes
   */
  const enableAutoTest = useCallback(async (projectId, testCommand = 'npm test') => {
    try {
      const response = await fetch('/api/sync/auto-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          testCommand,
          runOnChange: true
        })
      });

      if (!response.ok) {
        throw new Error('Auto-test enablement failed');
      }

      setWatchedPaths(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          autoTestEnabled: true,
          testCommand
        }
      }));

      return true;
    } catch (error) {
      setErrors(prev => [...prev, { projectId, message: error.message, timestamp: Date.now() }]);
      return false;
    }
  }, []);

  /**
   * Get sync status for a project
   */
  const getSyncStatus = useCallback((projectId) => {
    return syncedProjects.find(p => p.projectId === projectId) || null;
  }, [syncedProjects]);

  /**
   * Clear sync history and errors
   */
  const clearHistory = useCallback(() => {
    setSyncHistory([]);
    setErrors([]);
  }, []);

  /**
   * Get recent sync activity
   */
  const getRecentActivity = useCallback((limit = 20) => {
    return syncHistory.slice(-limit).reverse();
  }, [syncHistory]);

  return {
    syncStatus,
    syncedProjects,
    watchedPaths,
    syncHistory,
    errors,
    syncProject,
    startWatching,
    stopWatching,
    enableAutoTest,
    getSyncStatus,
    clearHistory,
    getRecentActivity,
    isWatching: Object.keys(watchedPaths).length > 0,
    syncedCount: syncedProjects.length
  };
}
