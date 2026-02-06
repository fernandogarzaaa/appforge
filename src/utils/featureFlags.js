/**
 * Centralized feature flags for gating optional/experimental features.
 * Defaults are conservative for production safety.
 */

const toBool = (value) => String(value).toLowerCase() === 'true';
const isProduction = import.meta.env.MODE === 'production';

export const featureFlags = {
  // Demo mode is allowed only in non-production builds
  demoMode: !isProduction && toBool(import.meta.env.VITE_DEMO_MODE),

  // Optional integrations
  web3: toBool(import.meta.env.VITE_WEB3_ENABLED),
  githubIntegration: toBool(import.meta.env.VITE_GITHUB_INTEGRATION),
  emailIntegration: toBool(import.meta.env.VITE_EMAIL_INTEGRATION),
  vscodeIntegration: toBool(import.meta.env.VITE_VSCODE_INTEGRATION),
  analytics: toBool(import.meta.env.VITE_ANALYTICS_ENABLED),
  collaboration: toBool(import.meta.env.VITE_COLLABORATION_ENABLED),
  security: toBool(import.meta.env.VITE_SECURITY_ENABLED),

  // AI Router / backend optional services
  aiRouter: toBool(import.meta.env.VITE_AI_ROUTER_ENABLED),
  llmSettings: toBool(import.meta.env.VITE_LLM_SETTINGS_ENABLED),
};

export const isFeatureEnabled = (flag) => featureFlags[flag] === true || featureFlags.demoMode;
