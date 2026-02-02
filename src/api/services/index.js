/**
 * API Services Index
 * Central export for all backend API services
 */

// New AppForge Backend Services
export { default as authService } from './authService';
export { default as projectService } from './projectService';
export { default as entityService } from './entityService';
export { default as teamService } from './teamService';
export { default as persistenceService } from './persistenceService';

// Legacy services (to be migrated)
export { default as apiKeysService } from './apiKeys';
export { default as deploymentsService } from './deployments';
export { default as environmentVariablesService } from './environmentVariables';
export { default as projectsService } from './projects';

// Re-export client utilities
export { default as appforgeClient, getAuthToken, setAuthToken, clearAuthToken } from '../appforgeClient';

// Local bindings for initialization logic
import { getAuthToken } from '../appforgeClient';

/**
 * Initialize API services
 * Call this on app startup
 */
export function initializeAPI(config = {}) {
  const {
    apiUrl = import.meta.env.VITE_API_URL,
    wsUrl = import.meta.env.VITE_WS_URL,
    autoConnect = false
  } = config;

  console.log('[API] Initializing services...', {
    apiUrl: apiUrl || 'http://localhost:5000/api',
    wsUrl: wsUrl || 'http://localhost:5001',
    autoConnect
  });

  // Auto-connect WebSocket if enabled and user is authenticated
  // Lazy load websocketService to avoid circular dependency
  if (autoConnect && getAuthToken()) {
    import('./websocketService').then(({ default: websocketService }) => {
      websocketService.connect();
    });
  }

  return {
    apiUrl,
    wsUrl,
    initialized: true
  };
}

// Export websocketService separately to avoid circular dependency issues
export { default as websocketService } from './websocketService';

/**
 * Health check for API services
 */
export async function checkAPIHealth() {
  try {
    const response = await appforgeClient.get('/health');
    
    return {
      healthy: true,
      status: response.data.status,
      services: response.data.services,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
