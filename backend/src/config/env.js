const REQUIRED_IN_PROD = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
  'OPENAI_API_KEY'
];

export function validateEnv({ env = process.env, nodeEnv = process.env.NODE_ENV } = {}) {
  if (nodeEnv !== 'production') {
    return;
  }

  const missing = REQUIRED_IN_PROD.filter((key) => !env[key] || String(env[key]).trim().length === 0);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for production: ${missing.join(', ')}`);
  }
}
