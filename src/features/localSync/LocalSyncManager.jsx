import React, { useState } from 'react';
import { Cloud, Play, Square, Trash2, RefreshCw } from 'lucide-react';
import { useLocalSync } from './useLocalSync';
import { cn } from '@/lib/utils';

/**
 * Local Sync Manager Component
 * UI for managing local project synchronization
 */
export function LocalSyncManager() {
  const {
    syncStatus,
    syncedProjects,
    watchedPaths,
    errors,
    syncProject,
    startWatching,
    stopWatching,
    enableAutoTest,
    getRecentActivity,
    clearHistory
  } = useLocalSync();

  const [projectPath, setProjectPath] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const handleSync = async () => {
    if (!projectPath || !selectedProject) return;
    try {
      await syncProject(projectPath, selectedProject);
      setProjectPath('');
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const handleToggleWatch = async (projectId) => {
    const isWatching = watchedPaths[projectId];
    if (isWatching) {
      stopWatching(projectId);
    } else {
      const project = syncedProjects.find(p => p.projectId === projectId);
      if (project) {
        await startWatching(project.projectPath, projectId);
      }
    }
  };

  const recentActivity = getRecentActivity(10);

  return (
    <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cloud className="w-6 h-6 text-blue-500" />
          Local Development Sync
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Keep your local projects synchronized with AppForge
        </p>
      </div>

      {/* Sync Form */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">New Sync</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="/path/to/project"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            <option value="">Select Project</option>
            {syncedProjects.map(p => (
              <option key={p.projectId} value={p.projectId}>
                {p.projectId}
              </option>
            ))}
          </select>
          <button
            onClick={handleSync}
            disabled={!projectPath || !selectedProject || syncStatus === 'syncing'}
            className={cn(
              "px-4 py-2 rounded font-medium flex items-center justify-center gap-2",
              syncStatus === 'syncing'
                ? "bg-slate-300 dark:bg-slate-600 text-slate-500"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            <RefreshCw className="w-4 h-4" />
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">Sync Errors</h3>
          <div className="space-y-1">
            {errors.slice(-5).map((error, i) => (
              <p key={i} className="text-sm text-red-800 dark:text-red-300">
                • {error.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Synced Projects */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">Synced Projects</h3>
        {syncedProjects.length === 0 ? (
          <p className="text-sm text-slate-500">No synced projects yet</p>
        ) : (
          <div className="space-y-2">
            {syncedProjects.map((project) => {
              const isWatching = watchedPaths[project.projectId];
              return (
                <div
                  key={project.projectId}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{project.projectId}</p>
                    <p className="text-xs text-slate-500 mt-1">{project.projectPath}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Last sync: {new Date(project.lastSync).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleWatch(project.projectId)}
                      className={cn(
                        "p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700",
                        isWatching ? "text-green-600" : "text-slate-400"
                      )}
                      title={isWatching ? "Stop watching" : "Start watching"}
                    >
                      {isWatching ? <Play className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => clearHistory()}
                      className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                      title="Clear history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Log Toggle */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <button
          onClick={() => setShowActivityLog(!showActivityLog)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {showActivityLog ? 'Hide' : 'Show'} Activity Log ({recentActivity.length})
        </button>

        {showActivityLog && recentActivity.length > 0 && (
          <div className="mt-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 max-h-64 overflow-y-auto">
            <div className="space-y-2 text-xs">
              {recentActivity.map((activity, i) => (
                <p key={i} className="text-slate-600 dark:text-slate-400">
                  <span className="font-mono">{activity.action}</span>
                  {' '} - {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
