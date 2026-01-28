/**
 * Environment Variables Utilities
 * Handles environment variable management with encryption and validation
 */

export const ENV_VAR_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  SECRET: 'secret'
};

export const ENVIRONMENT_NAMES = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

/**
 * Mask sensitive environment variable values
 * @param {string} value - Variable value
 * @param {string} type - Variable type
 * @returns {string} Masked value
 */
export const maskValue = (value, type) => {
  if (type === ENV_VAR_TYPES.SECRET || type === ENV_VAR_TYPES.STRING) {
    if (value.length <= 8) return '••••••••';
    return value.substring(0, 2) + '•'.repeat(value.length - 4) + value.substring(value.length - 2);
  }
  return value;
};

/**
 * Unmask value by showing original
 * @param {string} value - Variable value
 * @returns {string} Unmasked value
 */
export const unmaskValue = (value) => {
  return value;
};

/**
 * Validate environment variable name
 * @param {string} name - Variable name
 * @returns {object} { isValid, error }
 */
export const validateVariableName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Variable name cannot be empty' };
  }

  if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
    return { isValid: false, error: 'Variable names must start with A-Z or _, contain only uppercase A-Z, 0-9, and _' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Variable name cannot exceed 50 characters' };
  }

  // Reserved names
  const reserved = ['NODE_ENV', 'PWD', 'USER', 'PATH', 'HOME', 'SHELL'];
  if (reserved.includes(name)) {
    return { isValid: false, error: `"${name}" is a reserved system variable` };
  }

  return { isValid: true, error: null };
};

/**
 * Validate environment variable value
 * @param {string} value - Variable value
 * @param {string} type - Variable type
 * @returns {object} { isValid, error }
 */
export const validateVariableValue = (value, type) => {
  if (!value && type !== ENV_VAR_TYPES.BOOLEAN) {
    return { isValid: false, error: 'Value cannot be empty' };
  }

  if (type === ENV_VAR_TYPES.NUMBER) {
    if (isNaN(value)) {
      return { isValid: false, error: 'Value must be a valid number' };
    }
  }

  if (type === ENV_VAR_TYPES.BOOLEAN) {
    if (!['true', 'false', '0', '1', 'yes', 'no', 'on', 'off'].includes(String(value).toLowerCase())) {
      return { isValid: false, error: 'Value must be a valid boolean (true/false, 0/1, yes/no, on/off)' };
    }
  }

  if (type === ENV_VAR_TYPES.SECRET && value.length < 8) {
    return { isValid: false, error: 'Secret values should be at least 8 characters' };
  }

  return { isValid: true, error: null };
};

/**
 * Parse environment variable for export
 * @param {object} variable - Environment variable object
 * @returns {string} Shell-compatible export string
 */
export const toExportString = (variable) => {
  const escapedValue = variable.value.includes(' ') || variable.value.includes('"')
    ? `"${variable.value.replace(/"/g, '\\"')}"`
    : variable.value;
  return `export ${variable.name}=${escapedValue}`;
};

/**
 * Generate environment file content (.env format)
 * @param {Array} variables - Environment variables
 * @returns {string} .env file content
 */
export const generateEnvFileContent = (variables) => {
  return variables
    .map(v => {
      const escapedValue = v.value.includes('\n') || v.value.includes('"')
        ? `"${v.value.replace(/"/g, '\\"')}"`
        : v.value;
      return `${v.name}=${escapedValue}`;
    })
    .join('\n');
};

/**
 * Parse .env file content
 * @param {string} content - .env file content
 * @returns {Array} Parsed variables
 */
export const parseEnvFileContent = (content) => {
  const variables = [];
  const lines = content.split('\n');

  lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [name, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      
      const validation = validateVariableName(name.trim());
      if (validation.isValid) {
        variables.push({
          id: `env_${Date.now()}_${Math.random()}`,
          name: name.trim(),
          value: value.trim(),
          type: ENV_VAR_TYPES.STRING,
          description: '',
          environment: ENVIRONMENT_NAMES.DEVELOPMENT
        });
      }
    }
  });

  return variables;
};

/**
 * Encrypt environment variable (placeholder)
 * @param {string} value - Value to encrypt
 * @returns {string} Encrypted value
 */
export const encryptValue = (value) => {
  // TODO: Implement real encryption (e.g., tweetnacl)
  return btoa(value);
};

/**
 * Decrypt environment variable (placeholder)
 * @param {string} encrypted - Encrypted value
 * @returns {string} Decrypted value
 */
export const decryptValue = (encrypted) => {
  // TODO: Implement real decryption
  try {
    return atob(encrypted);
  } catch {
    return encrypted;
  }
};

/**
 * Create mock environment variable
 * @param {object} overrides - Override values
 * @returns {object} Mock environment variable
 */
export const createMockEnvVar = (overrides = {}) => {
  return {
    id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: 'EXAMPLE_VAR',
    value: 'example_value',
    type: ENV_VAR_TYPES.STRING,
    description: 'Example environment variable',
    environment: ENVIRONMENT_NAMES.DEVELOPMENT,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Generate mock environment variables for testing
 * @param {number} count - Number of variables to generate
 * @returns {Array} Array of mock variables
 */
export const generateMockEnvVariables = (count = 10) => {
  const examples = [
    { name: 'API_KEY', type: ENV_VAR_TYPES.SECRET, value: 'sk_test_51234567890' },
    { name: 'DATABASE_URL', type: ENV_VAR_TYPES.SECRET, value: 'postgresql://user:pass@localhost:5432/db' },
    { name: 'JWT_SECRET', type: ENV_VAR_TYPES.SECRET, value: 'your_jwt_secret_key_here' },
    { name: 'STRIPE_PUBLIC_KEY', type: ENV_VAR_TYPES.STRING, value: 'pk_test_1234567890' },
    { name: 'SMTP_HOST', type: ENV_VAR_TYPES.STRING, value: 'smtp.example.com' },
    { name: 'SMTP_PORT', type: ENV_VAR_TYPES.NUMBER, value: '587' },
    { name: 'REDIS_URL', type: ENV_VAR_TYPES.STRING, value: 'redis://localhost:6379' },
    { name: 'DEBUG', type: ENV_VAR_TYPES.BOOLEAN, value: 'false' },
    { name: 'LOG_LEVEL', type: ENV_VAR_TYPES.STRING, value: 'info' },
    { name: 'MAX_CONNECTIONS', type: ENV_VAR_TYPES.NUMBER, value: '100' }
  ];

  return Array.from({ length: Math.min(count, examples.length) }, (_, i) => {
    const example = examples[i];
    return createMockEnvVar({
      name: example.name,
      type: example.type,
      value: example.value,
      description: `Example ${example.name} variable`
    });
  });
};
