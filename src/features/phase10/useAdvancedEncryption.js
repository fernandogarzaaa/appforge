import { useState, useCallback } from 'react';

/**
 * Hook for advanced encryption operations
 * @returns {Object} Encryption utilities
 */
export const useAdvancedEncryption = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deriveAesKey = async (password) => {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const salt = enc.encode('appforge-aes-salt');
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const toBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const fromBase64 = (value) =>
    Uint8Array.from(atob(value), (c) => c.charCodeAt(0)).buffer;

  /**
   * AES-256 encryption (WebCrypto)
   */
  const encryptAES256 = useCallback(async (data, key) => {
    setLoading(true);
    setError(null);

    try {
      const aesKey = await deriveAesKey(key);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data));
      const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);
      return JSON.stringify({
        iv: toBase64(iv),
        cipher: toBase64(cipherBuffer),
        algorithm: 'AES-GCM'
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * AES-256 decryption (WebCrypto)
   */
  const decryptAES256 = useCallback(async (encrypted, key) => {
    setLoading(true);
    setError(null);

    try {
      const payload = typeof encrypted === 'string' ? JSON.parse(encrypted) : encrypted;
      const iv = new Uint8Array(fromBase64(payload.iv));
      const cipherBuffer = fromBase64(payload.cipher);
      const aesKey = await deriveAesKey(key);
      const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, cipherBuffer);
      const decoded = new TextDecoder().decode(plainBuffer);
      try {
        return JSON.parse(decoded);
      } catch {
        return decoded;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportKey = async (key, format) => {
    const raw = await crypto.subtle.exportKey(format, key);
    return toBase64(raw);
  };

  /**
   * Generate RSA key pair (WebCrypto)
   */
  const generateRSAKeyPair = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['encrypt', 'decrypt']
      );

      const publicKey = await exportKey(keyPair.publicKey, 'spki');
      const privateKey = await exportKey(keyPair.privateKey, 'pkcs8');

      return {
        publicKey,
        privateKey,
        algorithm: 'RSA-OAEP',
        keySize: 4096
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importPublicKey = async (publicKey) => {
    const raw = fromBase64(publicKey);
    return crypto.subtle.importKey(
      'spki',
      raw,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
  };

  /**
   * End-to-end encryption helper (RSA-OAEP)
   */
  const encryptE2E = useCallback(async (message, recipientPublicKey) => {
    setLoading(true);
    setError(null);

    try {
      const publicKey = await importPublicKey(recipientPublicKey);
      const encoded = new TextEncoder().encode(message);
      const cipherBuffer = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, encoded);
      return {
        ciphertext: toBase64(cipherBuffer),
        recipientKey: recipientPublicKey,
        timestamp: new Date().toISOString(),
        algorithm: 'RSA-OAEP'
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Hash data with SHA-256
   */
  const hashSHA256 = useCallback(async (data) => {
    try {
      const msgBuffer = new TextEncoder().encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    encryptAES256,
    decryptAES256,
    generateRSAKeyPair,
    encryptE2E,
    hashSHA256,
  };
};
