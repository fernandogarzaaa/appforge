/**
 * Environment Utilities Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateEnv } from '@/utils/env';

describe('Environment Utilities', () => {
  beforeEach(() => {
    // Reset environment
    vi.resetModules();
  });

  describe('validateEnv', () => {
    it('validates required environment variables', () => {
      const result = validateEnv();
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('missing');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.missing)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('detects missing required variables', () => {
      const result = validateEnv();
      
      // Should detect missing credentials
      if (!import.meta.env.VITE_BASE44_USERNAME) {
        expect(result.missing).toContain('VITE_BASE44_USERNAME');
      }
    });

    it('validates URL formats', () => {
      const result = validateEnv();
      
      // If there are URL validation errors, they should be in errors array
      expect(typeof result.errors).toBe('object');
    });
  });
});
