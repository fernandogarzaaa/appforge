/**
 * Environment Configuration & Validation
 * Centralizes environment variable access with validation
 */

// Required environment variables
const REQUIRED_ENV_VARS = ['VITE_BASE44_APP_ID'];

// Validate environment configuration
export function validateEnv() {
  const missing = [];
  const errors = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = import.meta.env[varName];
    if (!value) {
      missing.push(varName);
    }
  }

  // Validate URL formats
  const urlVars = ['VITE_BASE44_API_URL', 'VITE_APP_URL', 'VITE_API_URL'];
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
    appId: import.meta.env.VITE_BASE44_APP_ID || '',
    apiUrl: import.meta.env.VITE_BASE44_API_URL || 'https://appforge.fun',
  },

  // Backend API - Vercel deployment
  backend: {
    apiUrl: import.meta.env.VITE_API_URL || '',  // Empty = use relative /api
    wsUrl: import.meta.env.VITE_WS_URL || '',    // Empty = WebSocket disabled
  },

  // CHIMERA Quantum LLM
  chimera: {
    url: import.meta.env.VITE_CHIMERA_URL || 'http://localhost:7861/v1',
    apiKey: import.meta.env.VITE_CHIMERA_API_KEY || 'chimera-local',
  },

  // Application Settings
  app: {
    env: import.meta.env.VITE_APP_ENV || 'production',
    name: import.meta.env.VITE_APP_NAME || 'AppForge',

    // Feature Flags
    features: {
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      errorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
      voiceInput: import.meta.env.VITE_FEATURE_VOICE_INPUT !== 'false',
      codeReview: import.meta.env.VITE_FEATURE_CODE_REVIEW !== 'false',
      mobileBuilder: import.meta.env.VITE_FEATURE_MOBILE_BUILDER !== 'false',
      web3: true,
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
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
      },
      github: {
        pat: import.meta.env.VITE_GITHUB_PAT || '',
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
      debug: false, // FORCE PRODUCTION MODE
      mockApi: false, // Deployment ready: No mocks
      showPerfMetrics: import.meta.env.VITE_SHOW_PERF_METRICS === 'true',
    },
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
