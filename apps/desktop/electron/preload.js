const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Window controls
  minimize: () => ipcRenderer.invoke('minimize-window'),
  maximize: () => ipcRenderer.invoke('maximize-window'),
  close: () => ipcRenderer.invoke('close-window'),
  
  // Platform info
  platform: process.platform,
  getHomePath: () => ipcRenderer.invoke('get-home-path'),
  
  // Service management
  startService: (serviceName) => ipcRenderer.invoke('start-service', serviceName),
  stopService: (serviceName) => ipcRenderer.invoke('stop-service', serviceName),
  getServiceStatus: (serviceName) => ipcRenderer.invoke('get-service-status', serviceName),
  
  // File system
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Event listeners
  onTrayAction: (callback) => {
    ipcRenderer.on('tray-action', (event, action) => callback(action));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type definitions for TypeScript (will be used by the renderer)
/**
 * @typedef {Object} ElectronAPI
 * @property {() => Promise<void>} minimize
 * @property {() => Promise<void>} maximize
 * @property {() => Promise<void>} close
 * @property {string} platform
 * @property {() => Promise<string>} getHomePath
 * @property {(serviceName: string) => Promise<{success: boolean, pid?: number}>} startService
 * @property {(serviceName: string) => Promise<{success: boolean}>} stopService
 * @property {(serviceName: string) => Promise<{status: string, pid?: number}>} getServiceStatus
 * @property {() => Promise<string|null>} selectDirectory
 * @property {(filePath: string) => Promise<{success: boolean, content?: string, error?: string}>} readFile
 * @property {(filePath: string, content: string) => Promise<{success: boolean, error?: string}>} writeFile
 * @property {() => Promise<{hasUpdate: boolean, version: string}>} checkForUpdates
 * @property {(title: string, body: string) => Promise<void>} showNotification
 * @property {(callback: (action: string) => void) => void} onTrayAction
 * @property {(channel: string) => void} removeAllListeners
 */
