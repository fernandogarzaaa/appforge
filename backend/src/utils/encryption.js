/**
 * Field-level encryption utility for sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment or generate one
 * @returns {Buffer}
 */
function getEncryptionKey() {
  const keyString = process.env.ENCRYPTION_KEY;
  
  if (!keyString) {
    console.warn('⚠️  ENCRYPTION_KEY not set in environment. Using default key (NOT SECURE FOR PRODUCTION)');
    return crypto.scryptSync('default-insecure-key', 'salt', 32);
  }

  // Derive key from environment string
  return crypto.scryptSync(keyString, 'appforge-salt', 32);
}

/**
 * Encrypt a string value
 * @param {string} plaintext - Value to encrypt
 * @returns {string} Encrypted value with IV and auth tag (hex format)
 */
export function encrypt(plaintext) {
  if (!plaintext) return plaintext;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedData - Encrypted value (hex format with IV and auth tag)
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return encryptedData;

  // Check if data is already in encrypted format
  if (!encryptedData.includes(':')) {
    // Not encrypted, return as-is (for backward compatibility)
    return encryptedData;
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a value is encrypted
 * @param {string} value - Value to check
 * @returns {boolean}
 */
export function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}

/**
 * Hash a value for comparison (one-way)
 * @param {string} value - Value to hash
 * @returns {string} Hash (hex format)
 */
export function hash(value) {
  if (!value) return value;
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} Random token (hex format)
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate encryption key and output to console (for initial setup)
 */
export function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  console.log('Generated encryption key (add to .env as ENCRYPTION_KEY):');
  console.log(key);
  return key;
}

export default {
  encrypt,
  decrypt,
  isEncrypted,
  hash,
  generateToken,
  generateEncryptionKey
};
