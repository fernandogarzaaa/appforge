/**
 * AppForge Chimera - Preload Script
 * ==================================
 * Secure bridge between main and renderer processes.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Service management
  getServicesStatus: () => ipcRenderer.invoke('get-services-status'),
  startService: (service) => ipcRenderer.invoke('start-service', service),
  stopService: (service) => ipcRenderer.invoke('stop-service', service),
  
  // Dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Event listeners
  onBackendLog: (callback) => ipcRenderer.on('backend-log', (_, data) => callback(data)),
  onAILog: (callback) => ipcRenderer.on('ai-log', (_, data) => callback(data)),
  onAutonomousLog: (callback) => ipcRenderer.on('autonomous-log', (_, data) => callback(data)),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
