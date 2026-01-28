/**
 * API Key utilities
 * Handles encryption, masking, and secure storage
 */

// Simple encryption (for demo - use crypto library in production)
export function encryptAPIKey(key) {
  // TODO: Use actual encryption library (e.g., tweetnacl, libsodium)
  // For now, we'll just return the key with a marker
  // In production, use: import nacl from 'tweetnacl'
  return `encrypted:${btoa(key)}`;
}

export function decryptAPIKey(encrypted) {
  if (!encrypted.startsWith('encrypted:')) {
    return encrypted;
  }
  // TODO: Use actual decryption
  return atob(encrypted.replace('encrypted:', ''));
}

// Mask API key - show only last 8 characters
export function maskAPIKey(key) {
  if (!key || key.length < 8) return '****';
  return `****${key.slice(-8)}`;
}

// Generate a random API key
export function generateAPIKey(prefix = 'appforge') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}${random}${random2}`.toUpperCase();
}

// Validate API key format
export function isValidAPIKey(key) {
  return key && key.length > 20 && /^[a-zA-Z0-9_]+$/.test(key);
}

// Default scopes for API keys
export const DEFAULT_SCOPES = [
  { id: 'read:projects', label: 'Read Projects', checked: true },
  { id: 'read:functions', label: 'Read Functions', checked: true },
  { id: 'write:projects', label: 'Write Projects', checked: false },
  { id: 'write:functions', label: 'Write Functions', checked: false },
  { id: 'delete:projects', label: 'Delete Projects', checked: false },
  { id: 'admin:settings', label: 'Admin Settings', checked: false }
];

// Format date for display
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Calculate key age in days
export function getKeyAge(createdDate) {
  const now = new Date();
  const created = new Date(createdDate);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Check if key is about to expire (older than 90 days)
export function isKeyExpiringSoon(createdDate) {
  return getKeyAge(createdDate) > 90;
}

// Encrypt a value (for environment variables)
export function encryptValue(value) {
  // TODO: Use actual encryption library
  return `encrypted:${btoa(value)}`;
}

// Decrypt a value (for environment variables)
export function decryptValue(encryptedValue) {
  if (!encryptedValue || !encryptedValue.startsWith('encrypted:')) {
    return encryptedValue;
  }
  return atob(encryptedValue.replace('encrypted:', ''));
}
