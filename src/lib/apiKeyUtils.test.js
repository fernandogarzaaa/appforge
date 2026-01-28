import { describe, it, expect } from 'vitest';
import {
  encryptAPIKey,
  decryptAPIKey,
  maskAPIKey,
  generateAPIKey,
  isValidAPIKey,
  formatDate,
  getKeyAge,
  isKeyExpiringSoon
} from '@/lib/apiKeyUtils';

describe('API Key Utilities', () => {
  describe('generateAPIKey', () => {
    it('should generate valid API keys', () => {
      const key = generateAPIKey();
      expect(key).toMatch(/^appforge_/i);
      expect(key.length).toBeGreaterThan(20);
    });

    it('should generate unique keys', () => {
      const key1 = generateAPIKey();
      const key2 = generateAPIKey();
      expect(key1).not.toBe(key2);
    });

    it('should use custom prefix', () => {
      const key = generateAPIKey('custom');
      expect(key).toMatch(/^custom_/i);
    });
  });

  describe('isValidAPIKey', () => {
    it('should validate correct API keys', () => {
      const key = generateAPIKey();
      expect(isValidAPIKey(key)).toBe(true);
    });

    it('should reject short keys', () => {
      expect(isValidAPIKey('short')).toBe(false);
    });

    it('should reject keys with invalid characters', () => {
      expect(isValidAPIKey('key@#$%_invalid_key')).toBe(false);
    });

    it('should reject null/undefined keys', () => {
      expect(isValidAPIKey(null)).toBe(false);
      expect(isValidAPIKey(undefined)).toBe(false);
    });
  });

  describe('maskAPIKey', () => {
    it('should mask API keys', () => {
      const key = 'appforge_1234567890abcdef';
      const masked = maskAPIKey(key);
      expect(masked).toMatch(/\*{4}/);
      expect(masked).toContain('cdef');
    });

    it('should show last 8 characters', () => {
      const key = 'appforge_1234567890abcdefghij';
      const masked = maskAPIKey(key);
      expect(masked).toContain('fghij');
    });

    it('should handle short keys', () => {
      const masked = maskAPIKey('short');
      expect(masked).toBe('****');
    });
  });

  describe('encryptAPIKey and decryptAPIKey', () => {
    it('should encrypt and decrypt keys', () => {
      const original = generateAPIKey();
      const encrypted = encryptAPIKey(original);
      const decrypted = decryptAPIKey(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should handle already encrypted values', () => {
      const value = 'test_value';
      const decrypted = decryptAPIKey(value);
      expect(decrypted).toBeDefined();
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2026-01-28');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan 28, 2026|January 28, 2026/);
    });
  });

  describe('getKeyAge', () => {
    it('should calculate key age in days', () => {
      const date = new Date();
      date.setDate(date.getDate() - 5);
      const age = getKeyAge(date);
      expect(age).toBeGreaterThanOrEqual(4);
      expect(age).toBeLessThanOrEqual(6);
    });

    it('should handle today', () => {
      const age = getKeyAge(new Date());
      expect(age).toBe(1); // Rounds up
    });
  });

  describe('isKeyExpiringSoon', () => {
    it('should flag keys older than 90 days', () => {
      const date = new Date();
      date.setDate(date.getDate() - 95);
      expect(isKeyExpiringSoon(date)).toBe(true);
    });

    it('should not flag recent keys', () => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      expect(isKeyExpiringSoon(date)).toBe(false);
    });

    it('should flag keys at 90 day threshold', () => {
      const date = new Date();
      date.setDate(date.getDate() - 90);
      expect(isKeyExpiringSoon(date)).toBe(true);
    });
  });
});
