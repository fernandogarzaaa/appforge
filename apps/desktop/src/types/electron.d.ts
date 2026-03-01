// Type definitions for Electron API exposed to renderer process

export interface ElectronAPI {
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  
  // Platform info
  platform: string;
  getHomePath: () => Promise<string>;
  
  // Service management
  startService: (serviceName: string) => Promise<{ success: boolean; pid?: number }>;
  stopService: (serviceName: string) => Promise<{ success: boolean }>;
  getServiceStatus: (serviceName: string) => Promise<{ status: string; pid?: number }>;
  
  // File system
  selectDirectory: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  
  // Updates
  checkForUpdates: () => Promise<{ hasUpdate: boolean; version: string }>;
  
  // Notifications
  showNotification: (title: string, body: string) => Promise<void>;
  
  // Event listeners
  onTrayAction: (callback: (action: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
