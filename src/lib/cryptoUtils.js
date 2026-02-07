/**
 * Crypto Utils - Browser Compatible
 * Uses Web Crypto API for AES-GCM encryption
 * Maintains binary compatibility with Node.js crypto (IV + AuthTag + Ciphertext)
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM tag
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

const getCryptoKey = async (secret) => {
  const enc = new TextEncoder();
  // We use SHA-256 hash of the secret as the raw key material for AES-GCM
  const hash = await window.crypto.subtle.digest('SHA-256', enc.encode(secret));

  return window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptString = async (value, secretOverride) => {
  if (value === undefined || value === null) return '';
  try {
    const secret = resolveSecret(secretOverride);
    const key = await getCryptoKey(secret);
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const enc = new TextEncoder();

    // Web Crypto returns Ciphertext + Tag appended
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      enc.encode(String(value))
    );

    // Extract Ciphertext and Tag
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const tagLength = AUTH_TAG_LENGTH;
    const ciphertextLength = encryptedBytes.length - tagLength;

    const ciphertext = encryptedBytes.slice(0, ciphertextLength);
    const tag = encryptedBytes.slice(ciphertextLength); // Last 16 bytes

    // Construct Node.js compatible format: IV + Tag + Ciphertext
    const combined = new Uint8Array(iv.length + tag.length + ciphertext.length);
    combined.set(iv, 0);
    combined.set(tag, iv.length);
    combined.set(ciphertext, iv.length + tag.length);

    // Convert to Base64
    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    const base64 = btoa(binary);

    return `${PREFIX}${base64}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
};

export const decryptString = async (encrypted, secretOverride) => {
  if (!encrypted || typeof encrypted !== 'string') return '';
  if (!encrypted.startsWith(PREFIX)) return encrypted;

  try {
    const secret = resolveSecret(secretOverride);
    const key = await getCryptoKey(secret);

    const base64 = encrypted.slice(PREFIX.length);
    const binary = atob(base64);
    const len = binary.length;
    const data = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      data[i] = binary.charCodeAt(i);
    }

    // Parse Node.js compatible format: IV + Tag + Ciphertext
    const iv = data.slice(0, IV_LENGTH);
    const tag = data.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = data.slice(IV_LENGTH + AUTH_TAG_LENGTH);

    // Web Crypto expects Ciphertext + Tag
    const webCryptoData = new Uint8Array(ciphertext.length + tag.length);
    webCryptoData.set(ciphertext, 0);
    webCryptoData.set(tag, ciphertext.length);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      webCryptoData
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.warn('Failed to decrypt value:', error);
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
