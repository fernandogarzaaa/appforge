/**
 * Security Hardening System
 * CSP management, security headers, threat detection, and vulnerability scanning
 */

/**
 * Content Security Policy (CSP) Manager
 */
export class CSPManager {
  static defaultPolicy = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  };

  /**
   * Generate CSP header string
   * @param {Object} policy - CSP policy object
   * @returns {string} CSP header value
   */
  static generateHeader(policy = this.defaultPolicy) {
    return Object.entries(policy)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  /**
   * Validate CSP policy
   * @param {Object} policy - Policy to validate
   * @returns {Object} Validation result
   */
  static validatePolicy(policy) {
    const errors = [];
    const warnings = [];

    // Check for unsafe directives
    Object.entries(policy).forEach(([directive, sources]) => {
      if (sources.includes("'unsafe-inline'")) {
        warnings.push(`${directive} allows unsafe-inline`);
      }
      if (sources.includes("'unsafe-eval'")) {
        warnings.push(`${directive} allows unsafe-eval`);
      }
      if (sources.includes('*')) {
        errors.push(`${directive} allows all sources (*)`);
      }
    });

    // Check required directives
    if (!policy['default-src']) {
      errors.push('Missing default-src directive');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get recommended policy for production
   * @returns {Object} Secure CSP policy
   */
  static getProductionPolicy() {
    return {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'", 'https://api.base44.com'],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': []
    };
  }
}

/**
 * Security Headers Manager
 */
export class SecurityHeaders {
  /**
   * Get recommended security headers
   * @returns {Object} Security headers
   */
  static getRecommendedHeaders() {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': CSPManager.generateHeader()
    };
  }

  /**
   * Validate current headers
   * @param {Object} headers - Current headers
   * @returns {Object} Validation result
   */
  static validateHeaders(headers) {
    const required = [
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Content-Security-Policy'
    ];

    const missing = required.filter(h => !headers[h]);
    const present = required.filter(h => headers[h]);

    return {
      score: (present.length / required.length) * 100,
      missing,
      present,
      recommendations: this._getRecommendations(headers)
    };
  }

  static _getRecommendations(headers) {
    const recs = [];

    if (!headers['Strict-Transport-Security']) {
      recs.push('Add HSTS header to enforce HTTPS');
    }
    if (!headers['X-Frame-Options']) {
      recs.push('Add X-Frame-Options to prevent clickjacking');
    }
    if (!headers['Content-Security-Policy']) {
      recs.push('Add CSP header to prevent XSS attacks');
    }

    return recs;
  }
}

/**
 * Threat Detection System
 */
export class ThreatDetection {
  static threats = [];
  static rules = new Map();

  /**
   * Add threat detection rule
   * @param {Object} rule - Detection rule
   */
  static addRule(rule) {
    this.rules.set(rule.id, {
      id: rule.id,
      name: rule.name,
      severity: rule.severity, // 'low', 'medium', 'high', 'critical'
      check: rule.check, // Function that returns true if threat detected
      description: rule.description
    });
  }

  /**
   * Scan for threats
   * @param {Object} context - Context to scan
   * @returns {Array} Detected threats
   */
  static scan(context = {}) {
    const detected = [];

    this.rules.forEach(rule => {
      try {
        if (rule.check(context)) {
          const threat = {
            id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            name: rule.name,
            severity: rule.severity,
            description: rule.description,
            timestamp: new Date().toISOString(),
            context
          };
          detected.push(threat);
          this.threats.push(threat);
        }
      } catch (error) {
        console.error(`Error running rule ${rule.id}:`, error);
      }
    });

    return detected;
  }

  /**
   * Get threat history
   * @param {Object} options - Filter options
   * @returns {Array} Threats
   */
  static getThreats(options = {}) {
    let threats = [...this.threats];

    if (options.severity) {
      threats = threats.filter(t => t.severity === options.severity);
    }

    if (options.since) {
      const sinceDate = new Date(options.since);
      threats = threats.filter(t => new Date(t.timestamp) >= sinceDate);
    }

    return threats.slice(0, options.limit || 100);
  }

  /**
   * Clear threats
   */
  static clearThreats() {
    this.threats = [];
  }

  /**
   * Initialize default rules
   */
  static initializeDefaultRules() {
    // SQL Injection detection
    this.addRule({
      id: 'sql-injection',
      name: 'SQL Injection Pattern',
      severity: 'critical',
      description: 'Potential SQL injection attempt detected',
      check: (ctx) => {
        const patterns = /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i;
        return patterns.test(ctx.input || '');
      }
    });

    // XSS detection
    this.addRule({
      id: 'xss-pattern',
      name: 'XSS Pattern',
      severity: 'high',
      description: 'Potential XSS attempt detected',
      check: (ctx) => {
        const patterns = /<script|javascript:|onerror=|onload=/i;
        return patterns.test(ctx.input || '');
      }
    });

    // Path traversal
    this.addRule({
      id: 'path-traversal',
      name: 'Path Traversal',
      severity: 'high',
      description: 'Path traversal attempt detected',
      check: (ctx) => {
        return (ctx.path || '').includes('../');
      }
    });

    // Brute force detection
    this.addRule({
      id: 'brute-force',
      name: 'Brute Force Attack',
      severity: 'medium',
      description: 'Multiple failed login attempts',
      check: (ctx) => {
        return ctx.failedAttempts >= 5;
      }
    });
  }
}

/**
 * Vulnerability Scanner
 */
export class VulnerabilityScanner {
  static vulnerabilities = [];

  /**
   * Scan for common vulnerabilities
   * @param {Object} target - Target to scan
   * @returns {Array} Vulnerabilities found
   */
  static scan(target = {}) {
    const found = [];

    // Check for weak passwords
    if (target.password && this._isWeakPassword(target.password)) {
      found.push({
        id: 'weak-password',
        severity: 'medium',
        description: 'Weak password detected',
        remediation: 'Use at least 12 characters with mixed case, numbers, and symbols'
      });
    }

    // Check for exposed secrets
    if (target.code && this._hasExposedSecrets(target.code)) {
      found.push({
        id: 'exposed-secrets',
        severity: 'critical',
        description: 'Potential API keys or secrets in code',
        remediation: 'Move secrets to environment variables'
      });
    }

    // Check for insecure dependencies
    if (target.dependencies && this._hasInsecureDependencies(target.dependencies)) {
      found.push({
        id: 'insecure-dependencies',
        severity: 'high',
        description: 'Outdated or vulnerable dependencies detected',
        remediation: 'Update dependencies to latest secure versions'
      });
    }

    // Check for missing encryption
    if (target.data && !target.encrypted) {
      found.push({
        id: 'missing-encryption',
        severity: 'high',
        description: 'Sensitive data not encrypted',
        remediation: 'Enable encryption for sensitive data'
      });
    }

    this.vulnerabilities.push(...found);
    return found;
  }

  /**
   * Get vulnerability statistics
   * @returns {Object} Statistics
   */
  static getStats() {
    const stats = {
      total: this.vulnerabilities.length,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };

    this.vulnerabilities.forEach(vuln => {
      stats.bySeverity[vuln.severity]++;
    });

    return stats;
  }

  static _isWeakPassword(password) {
    return password.length < 8 ||
           !/[A-Z]/.test(password) ||
           !/[a-z]/.test(password) ||
           !/[0-9]/.test(password);
  }

  static _hasExposedSecrets(code) {
    const patterns = [
      /api[_-]?key\s*[=:]\s*["'][\w-]{10,}/i,
      /secret[_-]?key\s*[=:]\s*["'][\w-]{10,}/i,
      /password\s*[=:]\s*["'][^"']{4,}/i,
      /token\s*[=:]\s*["'][\w-]{10,}/i,
      /API_KEY\s*=\s*["'][\w-]{10,}/,
      /SECRET_KEY\s*=\s*["'][\w-]{10,}/
    ];
    return patterns.some(p => p.test(code));
  }

  static _hasInsecureDependencies(deps) {
    // Simplified check - in production, would check against vulnerability database
    const knownVulnerable = ['express@3.x', 'lodash@4.17.15'];
    return Object.keys(deps).some(dep => 
      knownVulnerable.some(v => v.startsWith(dep))
    );
  }

  /**
   * Clear vulnerabilities
   */
  static clearVulnerabilities() {
    this.vulnerabilities = [];
  }
}

/**
 * Security Audit Logger
 */
export class SecurityAuditLog {
  static logs = [];

  /**
   * Log security event
   * @param {Object} event - Event to log
   */
  static log(event) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: event.type, // 'auth', 'access', 'change', 'alert'
      severity: event.severity || 'info',
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      result: event.result, // 'success', 'failure', 'blocked'
      ip: event.ip,
      metadata: event.metadata || {}
    };

    this.logs.push(entry);

    // Keep only last 10000 logs
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    return entry;
  }

  /**
   * Get audit logs
   * @param {Object} options - Filter options
   * @returns {Array} Audit logs
   */
  static getLogs(options = {}) {
    let logs = [...this.logs];

    if (options.type) {
      logs = logs.filter(l => l.type === options.type);
    }

    if (options.userId) {
      logs = logs.filter(l => l.userId === options.userId);
    }

    if (options.severity) {
      logs = logs.filter(l => l.severity === options.severity);
    }

    if (options.since) {
      const sinceDate = new Date(options.since);
      logs = logs.filter(l => new Date(l.timestamp) >= sinceDate);
    }

    return logs.slice(0, options.limit || 100);
  }

  /**
   * Export logs
   * @returns {string} Logs as JSON
   */
  static exportLogs() {
    return JSON.stringify({
      logs: this.logs,
      exportedAt: new Date().toISOString(),
      total: this.logs.length
    }, null, 2);
  }

  /**
   * Clear logs
   */
  static clearLogs() {
    this.logs = [];
  }
}

// Initialize default threat detection rules
ThreatDetection.initializeDefaultRules();

export default {
  CSPManager,
  SecurityHeaders,
  ThreatDetection,
  VulnerabilityScanner,
  SecurityAuditLog
};
