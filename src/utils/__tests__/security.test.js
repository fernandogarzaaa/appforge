import { describe, it, expect, beforeEach } from 'vitest';
import {
  CSPManager,
  SecurityHeaders,
  ThreatDetection,
  VulnerabilityScanner,
  SecurityAuditLog
} from '../security';

describe('Security System', () => {
  describe('CSPManager', () => {
    it('should generate CSP header', () => {
      const header = CSPManager.generateHeader();
      expect(header).toContain('default-src');
      expect(header).toContain("'self'");
    });

    it('should validate CSP policy', () => {
      const result = CSPManager.validatePolicy({
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-eval'"]
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect missing default-src', () => {
      const result = CSPManager.validatePolicy({
        'script-src': ["'self'"]
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing default-src directive');
    });

    it('should warn about unsafe directives', () => {
      const result = CSPManager.validatePolicy({
        'default-src': ["'self'"],
        'script-src': ["'unsafe-inline'"]
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should error on wildcard sources', () => {
      const result = CSPManager.validatePolicy({
        'default-src': ['*']
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('*'))).toBe(true);
    });

    it('should provide production policy', () => {
      const policy = CSPManager.getProductionPolicy();
      expect(policy['default-src']).toEqual(["'self'"]);
      expect(policy['upgrade-insecure-requests']).toBeDefined();
    });
  });

  describe('SecurityHeaders', () => {
    it('should get recommended headers', () => {
      const headers = SecurityHeaders.getRecommendedHeaders();
      expect(headers['Strict-Transport-Security']).toBeDefined();
      expect(headers['X-Frame-Options']).toBeDefined();
      expect(headers['Content-Security-Policy']).toBeDefined();
    });

    it('should validate headers', () => {
      const headers = {
        'Strict-Transport-Security': 'max-age=31536000',
        'X-Frame-Options': 'DENY'
      };

      const result = SecurityHeaders.validateHeaders(headers);
      expect(result.score).toBeGreaterThan(0);
      expect(result.present.length).toBe(2);
    });

    it('should provide recommendations', () => {
      const headers = {};
      const result = SecurityHeaders.validateHeaders(headers);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate correct score', () => {
      const allHeaders = SecurityHeaders.getRecommendedHeaders();
      const result = SecurityHeaders.validateHeaders(allHeaders);

      expect(result.score).toBe(100);
    });
  });

  describe('ThreatDetection', () => {
    beforeEach(() => {
      ThreatDetection.clearThreats();
    });

    it('should detect SQL injection', () => {
      const threats = ThreatDetection.scan({
        input: "SELECT * FROM users WHERE id=1 OR 1=1"
      });

      expect(threats.length).toBeGreaterThan(0);
      expect(threats[0].ruleId).toBe('sql-injection');
    });

    it('should detect XSS patterns', () => {
      const threats = ThreatDetection.scan({
        input: "<script>alert('xss')</script>"
      });

      expect(threats.length).toBeGreaterThan(0);
      expect(threats[0].ruleId).toBe('xss-pattern');
    });

    it('should detect path traversal', () => {
      const threats = ThreatDetection.scan({
        path: "../../../etc/passwd"
      });

      expect(threats.length).toBeGreaterThan(0);
      expect(threats[0].ruleId).toBe('path-traversal');
    });

    it('should detect brute force', () => {
      const threats = ThreatDetection.scan({
        failedAttempts: 5
      });

      expect(threats.length).toBeGreaterThan(0);
      expect(threats[0].ruleId).toBe('brute-force');
    });

    it('should add custom rules', () => {
      ThreatDetection.addRule({
        id: 'custom-rule',
        name: 'Custom Rule',
        severity: 'low',
        description: 'Custom threat',
        check: (ctx) => ctx.test === 'threat'
      });

      const threats = ThreatDetection.scan({ test: 'threat' });
      expect(threats.some(t => t.ruleId === 'custom-rule')).toBe(true);
    });

    it('should get threat history', () => {
      ThreatDetection.scan({ input: "DROP TABLE users" });
      ThreatDetection.scan({ input: "<script>evil()</script>" });

      const threats = ThreatDetection.getThreats();
      expect(threats.length).toBe(2);
    });

    it('should filter threats by severity', () => {
      ThreatDetection.scan({ input: "DROP TABLE users" });

      const critical = ThreatDetection.getThreats({ severity: 'critical' });
      expect(critical.length).toBeGreaterThan(0);
    });
  });

  describe('VulnerabilityScanner', () => {
    beforeEach(() => {
      VulnerabilityScanner.clearVulnerabilities();
    });

    it('should detect weak passwords', () => {
      const vulns = VulnerabilityScanner.scan({
        password: 'weak'
      });

      expect(vulns.some(v => v.id === 'weak-password')).toBe(true);
    });

    it('should detect exposed secrets', () => {
      const vulns = VulnerabilityScanner.scan({
        code: 'const API_KEY = "sk-1234567890abcdefghij"'
      });

      expect(vulns.some(v => v.id === 'exposed-secrets')).toBe(true);
    });

    it('should detect missing encryption', () => {
      const vulns = VulnerabilityScanner.scan({
        data: { sensitive: true },
        encrypted: false
      });

      expect(vulns.some(v => v.id === 'missing-encryption')).toBe(true);
    });

    it('should provide remediation steps', () => {
      const vulns = VulnerabilityScanner.scan({
        password: '123'
      });

      expect(vulns[0].remediation).toBeDefined();
    });

    it('should get vulnerability statistics', () => {
      VulnerabilityScanner.scan({ password: 'weak' });
      VulnerabilityScanner.scan({ code: 'API_KEY = "secret"' });

      const stats = VulnerabilityScanner.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.bySeverity).toBeDefined();
    });

    it('should accept strong passwords', () => {
      const vulns = VulnerabilityScanner.scan({
        password: 'Strong!Pass123'
      });

      expect(vulns.some(v => v.id === 'weak-password')).toBe(false);
    });
  });

  describe('SecurityAuditLog', () => {
    beforeEach(() => {
      SecurityAuditLog.clearLogs();
    });

    it('should log security event', () => {
      const log = SecurityAuditLog.log({
        type: 'auth',
        severity: 'info',
        userId: 'user1',
        action: 'login',
        resource: '/auth/login',
        result: 'success',
        ip: '192.168.1.1'
      });

      expect(log.id).toBeDefined();
      expect(log.type).toBe('auth');
    });

    it('should get logs', () => {
      SecurityAuditLog.log({
        type: 'access',
        userId: 'user1',
        action: 'view',
        resource: '/data',
        result: 'success'
      });

      const logs = SecurityAuditLog.getLogs();
      expect(logs.length).toBe(1);
    });

    it('should filter logs by type', () => {
      SecurityAuditLog.log({
        type: 'auth',
        userId: 'user1',
        action: 'login',
        resource: '/auth',
        result: 'success'
      });
      SecurityAuditLog.log({
        type: 'access',
        userId: 'user1',
        action: 'view',
        resource: '/data',
        result: 'success'
      });

      const authLogs = SecurityAuditLog.getLogs({ type: 'auth' });
      expect(authLogs.length).toBe(1);
      expect(authLogs[0].type).toBe('auth');
    });

    it('should filter logs by user', () => {
      SecurityAuditLog.log({
        type: 'access',
        userId: 'user1',
        action: 'view',
        resource: '/data',
        result: 'success'
      });
      SecurityAuditLog.log({
        type: 'access',
        userId: 'user2',
        action: 'view',
        resource: '/data',
        result: 'success'
      });

      const user1Logs = SecurityAuditLog.getLogs({ userId: 'user1' });
      expect(user1Logs.length).toBe(1);
      expect(user1Logs[0].userId).toBe('user1');
    });

    it('should filter logs by severity', () => {
      SecurityAuditLog.log({
        type: 'alert',
        severity: 'error',
        userId: 'user1',
        action: 'failed login',
        resource: '/auth',
        result: 'failure'
      });
      SecurityAuditLog.log({
        type: 'access',
        severity: 'info',
        userId: 'user1',
        action: 'view',
        resource: '/data',
        result: 'success'
      });

      const errorLogs = SecurityAuditLog.getLogs({ severity: 'error' });
      expect(errorLogs.length).toBe(1);
    });

    it('should limit log storage', () => {
      for (let i = 0; i < 11000; i++) {
        SecurityAuditLog.log({
          type: 'access',
          userId: 'user1',
          action: `action-${i}`,
          resource: '/test',
          result: 'success'
        });
      }

      const logs = SecurityAuditLog.getLogs({ limit: 20000 });
      expect(logs.length).toBeLessThanOrEqual(10000);
    });

    it('should export logs', () => {
      SecurityAuditLog.log({
        type: 'auth',
        userId: 'user1',
        action: 'login',
        resource: '/auth',
        result: 'success'
      });

      const exported = SecurityAuditLog.exportLogs();
      expect(exported).toContain('logs');
      expect(exported).toContain('exportedAt');
    });
  });
});
