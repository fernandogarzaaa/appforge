/**
 * Environment Configuration & Validation
 * Centralizes environment variable access with validation
 */

// Required environment variables
const REQUIRED_ENV_VARS = [
  'VITE_BASE44_USERNAME',
  'VITE_BASE44_PASSWORD',
  'VITE_BASE44_API_URL',
];

// Validate environment configuration
export function validateEnv() {
  const missing = [];
  const errors = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = import.meta.env[varName];
    if (!value || value === 'your_username_here' || value === 'your_password_here') {
      missing.push(varName);
    }
  }

  // Validate URL formats
  const urlVars = ['VITE_BASE44_API_URL', 'VITE_APP_URL'];
  for (const varName of urlVars) {
    const value = import.meta.env[varName];
    if (value && !isValidUrl(value)) {
      errors.push(`${varName} must be a valid URL`);
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

// Helper to validate URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// Environment getters with defaults
export const env = {
  // Base44 Configuration
  base44: {
    username: import.meta.env.VITE_BASE44_USERNAME || '',
    password: import.meta.env.VITE_BASE44_PASSWORD || '',
    apiUrl: import.meta.env.VITE_BASE44_API_URL || 'https://appforge.fun',
  },

  // Application Settings
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
    name: import.meta.env.VITE_APP_NAME || 'AppForge',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },

  // Feature Flags
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    errorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
    voiceInput: import.meta.env.VITE_FEATURE_VOICE_INPUT !== 'false',
    codeReview: import.meta.env.VITE_FEATURE_CODE_REVIEW !== 'false',
    mobileBuilder: import.meta.env.VITE_FEATURE_MOBILE_BUILDER !== 'false',
    web3: import.meta.env.VITE_FEATURE_WEB3 === 'true',
    collaboration: import.meta.env.VITE_FEATURE_COLLABORATION !== 'false',
  },

  // AI Model API Keys
  ai: {
    openai: import.meta.env.VITE_OPENAI_API_KEY || '',
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    google: import.meta.env.VITE_GOOGLE_API_KEY || '',
    xai: import.meta.env.VITE_XAI_API_KEY || '',
  },

  // External Services
  services: {
    sentry: {
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    },
    github: {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GITHUB_CLIENT_SECRET || '',
    },
    stripe: {
      publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
    },
  },

  // Performance & Security
  performance: {
    cacheTtl: parseInt(import.meta.env.VITE_CACHE_TTL || '300', 10),
    enableServiceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',
  },

  security: {
    enableCsp: import.meta.env.VITE_ENABLE_CSP !== 'false',
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '60', 10),
  },

  // Development
  dev: {
    debug: import.meta.env.VITE_DEBUG === 'true',
    mockApi: import.meta.env.VITE_MOCK_API === 'true',
    showPerfMetrics: import.meta.env.VITE_SHOW_PERF_METRICS === 'true',
  },
};

// Log environment info in development
if (env.app.isDevelopment && env.dev.debug) {
  console.group('🔧 Environment Configuration');
  console.log('Environment:', env.app.env);
  console.log('Base44 API:', env.base44.apiUrl);
  console.log('Features:', env.features);
  console.groupEnd();
}

// Validate on load
const validation = validateEnv();
if (!validation.valid) {
  console.error('❌ Environment Configuration Error');
  if (validation.missing.length > 0) {
    console.error('Missing required variables:', validation.missing);
    console.error('Please create .env.local from .env.example and fill in your credentials');
  }
  if (validation.errors.length > 0) {
    console.error('Configuration errors:', validation.errors);
  }
}

export default env;
