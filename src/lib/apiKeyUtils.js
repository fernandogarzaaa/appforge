/**
 * API Key utilities
 * Handles encryption, masking, and secure storage
 */

import { encryptString, decryptString } from './cryptoUtils';

// Encrypt API key with AES-256-GCM and versioned prefix
export async function encryptAPIKey(key, secretOverride) {
  if (!key) return '';
  return await encryptString(key, secretOverride);
}

export async function decryptAPIKey(encrypted, secretOverride) {
  if (!encrypted || typeof encrypted !== 'string') return '';
  return await decryptString(encrypted, secretOverride);
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
  return Boolean(key && key.length > 20 && /^[a-zA-Z0-9_]+$/.test(key));
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
  return Math.max(1, diffDays);
}

// Check if key is about to expire (older than 90 days)
export function isKeyExpiringSoon(createdDate) {
  return getKeyAge(createdDate) >= 90;
}

// Encrypt a value (for environment variables)
export async function encryptValue(value, secretOverride) {
  return await encryptString(value, secretOverride);
}

// Decrypt a value (for environment variables)
export async function decryptValue(encryptedValue, secretOverride) {
  return await decryptString(encryptedValue, secretOverride);
}
