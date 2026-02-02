import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const PREFIX = 'enc.v1.';
const FALLBACK_SECRET = 'appforge-fallback-secret';

const getMetaEnv = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env;
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

const readEnv = (name, fallback) => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name];
  const metaEnv = getMetaEnv();
  if (metaEnv && metaEnv[name]) return metaEnv[name];
  return fallback;
};

const resolveSecret = (override) => {
  return override || readEnv('APPFORGE_SECRET', readEnv('VITE_APPFORGE_SECRET', FALLBACK_SECRET));
};

const deriveKey = (secret) => {
  return crypto.createHash('sha256').update(secret).digest();
};

const bufferFrom = (input, encoding) => {
  if (Buffer.isBuffer(input)) return input;
  return Buffer.from(input, encoding);
};

export const encryptString = (value, secretOverride) => {
  if (value === undefined || value === null) return '';
  const secret = resolveSecret(secretOverride);
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  return `${PREFIX}${payload}`;
};

export const decryptString = (encrypted, secretOverride) => {
  if (!encrypted || typeof encrypted !== 'string') return '';
  if (!encrypted.startsWith(PREFIX)) return encrypted;

  try {
    const secret = resolveSecret(secretOverride);
    const key = deriveKey(secret);
    const data = bufferFrom(encrypted.slice(PREFIX.length), 'base64');
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.warn('Failed to decrypt value, returning raw string', error);
    return encrypted;
  }
};

export const maskSecret = (value, visible = 4) => {
  if (!value) return '••••';
  const normalized = String(value);
  if (normalized.length <= visible * 2) return '••••';
  return `${normalized.slice(0, visible)}${'•'.repeat(normalized.length - visible * 2)}${normalized.slice(-visible)}`;
};

export default {
  encryptString,
  decryptString,
  maskSecret,
};
