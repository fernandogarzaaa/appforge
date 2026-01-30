/**
 * Multi-Environment Management System
 * Handles dev/staging/production environments with config management
 */

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

export class EnvironmentManager {
  static environments = [
    ENVIRONMENTS.DEVELOPMENT,
    ENVIRONMENTS.STAGING,
    ENVIRONMENTS.PRODUCTION,
  ];

  static current = import.meta.env.MODE || ENVIRONMENTS.DEVELOPMENT;

  static configs = new Map();

  /**
   * Get configuration for specific environment
   */
  static getConfig(env = this.current) {
    if (this.configs.has(env)) {
      return this.configs.get(env);
    }

    const config = this._generateConfig(env);
    this.configs.set(env, config);
    return config;
  }

  /**
   * Generate environment-specific configuration
   */
  static _generateConfig(env) {
    const baseConfig = {
      environment: env,
      timestamp: new Date().toISOString(),
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    };

    const envConfigs = {
      [ENVIRONMENTS.DEVELOPMENT]: {
        ...baseConfig,
        apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
        wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
        debug: true,
        logging: {
          level: 'debug',
          console: true,
          remote: false,
        },
        features: {
          experimental: true,
          analytics: false,
          errorTracking: false,
        },
        cache: {
          enabled: false,
          ttl: 300,
        },
        rateLimit: {
          enabled: false,
          maxRequests: 1000,
        },
      },
      [ENVIRONMENTS.STAGING]: {
        ...baseConfig,
        apiUrl: import.meta.env.VITE_API_URL || 'https://staging-api.appforge.com',
        wsUrl: import.meta.env.VITE_WS_URL || 'wss://staging-api.appforge.com',
        debug: true,
        logging: {
          level: 'info',
          console: true,
          remote: true,
        },
        features: {
          experimental: true,
          analytics: true,
          errorTracking: true,
        },
        cache: {
          enabled: true,
          ttl: 600,
        },
        rateLimit: {
          enabled: true,
          maxRequests: 500,
        },
      },
      [ENVIRONMENTS.PRODUCTION]: {
        ...baseConfig,
        apiUrl: import.meta.env.VITE_API_URL || 'https://api.appforge.com',
        wsUrl: import.meta.env.VITE_WS_URL || 'wss://api.appforge.com',
        debug: false,
        logging: {
          level: 'error',
          console: false,
          remote: true,
        },
        features: {
          experimental: false,
          analytics: true,
          errorTracking: true,
        },
        cache: {
          enabled: true,
          ttl: 3600,
        },
        rateLimit: {
          enabled: true,
          maxRequests: 100,
        },
      },
    };

    return envConfigs[env] || envConfigs[ENVIRONMENTS.DEVELOPMENT];
  }

  /**
   * Check if feature is enabled in current environment
   */
  static isFeatureEnabled(featureName) {
    const config = this.getConfig();
    return config.features[featureName] ?? false;
  }

  /**
   * Get API URL for current environment
   */
  static getApiUrl() {
    return this.getConfig().apiUrl;
  }

  /**
   * Get WebSocket URL for current environment
   */
  static getWsUrl() {
    return this.getConfig().wsUrl;
  }

  /**
   * Check if in production environment
   */
  static isProduction() {
    return this.current === ENVIRONMENTS.PRODUCTION;
  }

  /**
   * Check if in development environment
   */
  static isDevelopment() {
    return this.current === ENVIRONMENTS.DEVELOPMENT;
  }

  /**
   * Check if in staging environment
   */
  static isStaging() {
    return this.current === ENVIRONMENTS.STAGING;
  }

  /**
   * Promote configuration from one environment to another
   */
  static async promoteConfig(projectId, fromEnv, toEnv) {
    if (!this.environments.includes(fromEnv) || !this.environments.includes(toEnv)) {
      throw new Error('Invalid environment');
    }

    const sourceConfig = await this.getProjectConfig(projectId, fromEnv);
    
    return {
      projectId,
      fromEnvironment: fromEnv,
      toEnvironment: toEnv,
      config: sourceConfig,
      promotedAt: new Date().toISOString(),
      status: 'pending',
    };
  }

  /**
   * Get project-specific configuration
   */
  static async getProjectConfig(projectId, env = this.current) {
    const key = `project:${projectId}:env:${env}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      return JSON.parse(stored);
    }

    // Default project config
    return {
      projectId,
      environment: env,
      settings: {},
      variables: {},
      secrets: {},
      deployedAt: null,
    };
  }

  /**
   * Save project configuration
   */
  static async saveProjectConfig(projectId, env, config) {
    const key = `project:${projectId}:env:${env}`;
    const data = {
      ...config,
      projectId,
      environment: env,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }

  /**
   * Deploy project to environment
   */
  static async deployToEnvironment(projectId, env, config = {}) {
    if (!this.environments.includes(env)) {
      throw new Error(`Invalid environment: ${env}`);
    }

    const deployment = {
      id: `deploy-${Date.now()}`,
      projectId,
      environment: env,
      config,
      status: 'deploying',
      startedAt: new Date().toISOString(),
      completedAt: null,
      logs: [],
    };

    // Simulate deployment steps
    deployment.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Starting deployment to ${env}`,
    });

    deployment.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Building application...',
    });

    deployment.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Running tests...',
    });

    deployment.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Deploying to servers...',
    });

    deployment.status = 'completed';
    deployment.completedAt = new Date().toISOString();
    deployment.logs.push({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `Successfully deployed to ${env}`,
    });

    // Save deployment record
    await this.saveProjectConfig(projectId, env, {
      ...config,
      lastDeployment: deployment,
    });

    return deployment;
  }

  /**
   * Get environment variables
   */
  static getEnvVariables(env = this.current) {
    const config = this.getConfig(env);
    return {
      NODE_ENV: config.environment,
      API_URL: config.apiUrl,
      WS_URL: config.wsUrl,
      DEBUG: String(config.debug),
      LOG_LEVEL: config.logging.level,
      CACHE_ENABLED: String(config.cache.enabled),
      CACHE_TTL: String(config.cache.ttl),
      RATE_LIMIT_ENABLED: String(config.rateLimit.enabled),
      RATE_LIMIT_MAX: String(config.rateLimit.maxRequests),
    };
  }

  /**
   * Compare configurations between environments
   */
  static compareEnvironments(env1, env2) {
    const config1 = this.getConfig(env1);
    const config2 = this.getConfig(env2);

    const differences = [];

    const compare = (obj1, obj2, path = '') => {
      for (const key in obj1) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj1[key] === 'object' && obj1[key] !== null) {
          compare(obj1[key], obj2[key] || {}, currentPath);
        } else if (obj1[key] !== obj2[key]) {
          differences.push({
            path: currentPath,
            [env1]: obj1[key],
            [env2]: obj2[key],
          });
        }
      }
    };

    compare(config1, config2);
    return differences;
  }

  /**
   * Export configuration
   */
  static exportConfig(env = this.current, format = 'json') {
    const config = this.getConfig(env);
    
    if (format === 'env') {
      // Export as .env file format
      const envVars = this.getEnvVariables(env);
      return Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    }

    if (format === 'yaml') {
      // Basic YAML export
      return Object.entries(config)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
    }

    // Default JSON format
    return JSON.stringify(config, null, 2);
  }
}

// Export singleton instance
export default EnvironmentManager;
