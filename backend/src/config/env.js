const REQUIRED_IN_PROD = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'ENCRYPTION_KEY'
];

const PROVIDER_KEYS = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
  grok: 'GROK_API_KEY'
};

const parseProviderList = (raw) => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);
};

export function validateEnv({ env = process.env, nodeEnv = process.env.NODE_ENV } = {}) {
  if (nodeEnv !== 'production') {
    return;
  }

  const missing = REQUIRED_IN_PROD.filter((key) => !env[key] || String(env[key]).trim().length === 0);

  const requestedProviders = parseProviderList(env.LLM_PROVIDERS || env.LLM_PROVIDER_ORDER);
  const effectiveProviders = requestedProviders.length > 0
    ? requestedProviders
    : ['openai'];

  const invalidProviders = effectiveProviders.filter((provider) => !PROVIDER_KEYS[provider]);
  if (invalidProviders.length > 0) {
    throw new Error(`Unknown LLM providers in configuration: ${invalidProviders.join(', ')}`);
  }

  const requiredProviderKeys = new Set(
    effectiveProviders.map((provider) => PROVIDER_KEYS[provider])
  );

  if (env.QUANTUM_DEFAULT_MODE === 'quantum') {
    requiredProviderKeys.add('OPENAI_API_KEY');
  }

  for (const key of requiredProviderKeys) {
    if (!env[key] || String(env[key]).trim().length === 0) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for production: ${missing.join(', ')}`);
  }
}
