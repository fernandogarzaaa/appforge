import { describe, it, expect } from 'vitest';
import {
  EncryptionManager,
  AnonymizationEngine,
  GDPRCompliance,
} from '@/utils/dataSecurity';

describe('Data Security Utilities', () => {
  describe('EncryptionManager', () => {
    it('encrypts and decrypts data correctly', () => {
      const key = EncryptionManager.generateKey(16);
      const payload = { email: 'user@appforge.io', role: 'admin' };

      const encrypted = EncryptionManager.encrypt(payload, key);
      expect(encrypted).toBeTruthy();
      expect(encrypted.encryptedValue).toBeDefined();

      const decrypted = EncryptionManager.decrypt(encrypted, key);
      expect(decrypted).toEqual(payload);
    });

    it('hashes data deterministically', () => {
      const hash1 = EncryptionManager.hash('appforge', 5);
      const hash2 = EncryptionManager.hash('appforge', 5);
      expect(hash1).toBe(hash2);
    });
  });

  describe('AnonymizationEngine', () => {
    it('masks values with custom rule', () => {
      const data = { email: 'user@appforge.io' };
      const anonymized = AnonymizationEngine.anonymize(data, [
        { field: 'email', method: 'mask', options: { visibleChars: 4, maskChar: '#' } },
      ]);

      expect(anonymized.email.startsWith('user')).toBe(true);
      expect(anonymized.email.includes('#')).toBe(true);
    });

    it('generalizes age values', () => {
      const data = { age: 34 };
      const anonymized = AnonymizationEngine.anonymize(data, [
        { field: 'age', method: 'generalize', options: { type: 'age', range: 10 } },
      ]);

      expect(anonymized.age).toBe('30-39');
    });

    it('pseudonymizes values consistently', () => {
      const data = { userId: 'user_123' };
      const anonymized = AnonymizationEngine.anonymize(data, [
        { field: 'userId', method: 'pseudonymize', options: { prefix: 'USER' } },
      ]);

      expect(anonymized.userId.startsWith('USER_')).toBe(true);
      expect(anonymized.userId.length).toBeGreaterThan(6);
    });
  });

  describe('GDPRCompliance', () => {
    it('records and checks consent', () => {
      const gdpr = new GDPRCompliance();
      gdpr.recordConsent('user_1', 'analytics', true, '1.0');
      gdpr.recordConsent('user_1', 'marketing', false, '1.0');

      expect(gdpr.hasConsent('user_1', 'analytics')).toBe(true);
      expect(gdpr.hasConsent('user_1', 'marketing')).toBe(false);
    });

    it('generates compliance report', () => {
      const gdpr = new GDPRCompliance();
      gdpr.recordConsent('user_2', 'analytics', true, '1.0');
      gdpr.setRetentionPolicy('logs', 90);

      const report = gdpr.generateComplianceReport();
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('complianceStatus', 'COMPLIANT');
      expect(report.retentionPolicies.length).toBeGreaterThan(0);
    });
  });
});
