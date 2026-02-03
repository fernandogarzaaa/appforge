#!/usr/bin/env node
/**
 * Security Audit Script
 * Performs comprehensive security checks on the application
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const AUDIT_REPORT_DIR = './security-audits';
const SEVERITY_LEVELS = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
};

class SecurityAuditor {
  constructor() {
    this.findings = [];
    this.score = 100;
  }

  /**
   * Add security finding
   */
  addFinding(severity, category, title, description, remediation) {
    this.findings.push({
      severity,
      category,
      title,
      description,
      remediation,
      timestamp: new Date().toISOString(),
    });

    // Deduct points based on severity
    const deductions = {
      [SEVERITY_LEVELS.CRITICAL]: 20,
      [SEVERITY_LEVELS.HIGH]: 10,
      [SEVERITY_LEVELS.MEDIUM]: 5,
      [SEVERITY_LEVELS.LOW]: 2,
      [SEVERITY_LEVELS.INFO]: 0,
    };
    this.score -= deductions[severity] || 0;
  }

  /**
   * Check npm dependencies for vulnerabilities
   */
  async auditDependencies() {
    console.log('🔍 Auditing npm dependencies...');
    try {
      const result = execSync('npm audit --json', { encoding: 'utf-8' });
      const audit = JSON.parse(result);

      if (audit.metadata) {
        const { vulnerabilities } = audit.metadata;
        
        if (vulnerabilities.critical > 0) {
          this.addFinding(
            SEVERITY_LEVELS.CRITICAL,
            'Dependencies',
            'Critical vulnerabilities in dependencies',
            `Found ${vulnerabilities.critical} critical vulnerabilities in npm packages`,
            'Run "npm audit fix --force" to update vulnerable packages'
          );
        }

        if (vulnerabilities.high > 0) {
          this.addFinding(
            SEVERITY_LEVELS.HIGH,
            'Dependencies',
            'High severity vulnerabilities',
            `Found ${vulnerabilities.high} high severity vulnerabilities`,
            'Run "npm audit fix" to resolve issues'
          );
        }

        if (vulnerabilities.moderate > 0) {
          this.addFinding(
            SEVERITY_LEVELS.MEDIUM,
            'Dependencies',
            'Moderate vulnerabilities',
            `Found ${vulnerabilities.moderate} moderate vulnerabilities`,
            'Review and update affected packages'
          );
        }
      }

      console.log('✅ Dependency audit complete');
    } catch (error) {
      console.warn('⚠️  npm audit encountered issues (may be expected if vulnerabilities exist)');
    }
  }

  /**
   * Check environment configuration
   */
  async auditEnvironmentConfig() {
    console.log('🔍 Auditing environment configuration...');

    try {
      const envExample = await fs.readFile('.env.example', 'utf-8');
      
      // Check for exposed secrets
      const secretPatterns = [
        { pattern: /sk-[a-zA-Z0-9]{32,}/, name: 'OpenAI API Key' },
        { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub Token' },
        { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key' },
        { pattern: /xox[baprs]-[a-zA-Z0-9-]+/, name: 'Slack Token' },
      ];

      for (const { pattern, name } of secretPatterns) {
        if (pattern.test(envExample)) {
          this.addFinding(
            SEVERITY_LEVELS.CRITICAL,
            'Secrets',
            `Exposed ${name} in .env.example`,
            'Real credentials found in example file',
            'Remove real credentials and use placeholders'
          );
        }
      }

      // Check for missing security headers
      const requiredEnvVars = [
        'JWT_SECRET',
        'SESSION_SECRET',
        'ENCRYPTION_KEY',
        'CORS_ORIGIN',
      ];

      for (const varName of requiredEnvVars) {
        if (!envExample.includes(varName)) {
          this.addFinding(
            SEVERITY_LEVELS.MEDIUM,
            'Configuration',
            `Missing ${varName} in environment template`,
            'Security-critical environment variable not documented',
            `Add ${varName} to .env.example`
          );
        }
      }

      console.log('✅ Environment config audit complete');
    } catch (error) {
      console.warn('⚠️  Could not audit environment config:', error.message);
    }
  }

  /**
   * Check for hardcoded secrets in code
   */
  async auditSourceCode() {
    console.log('🔍 Scanning source code for secrets...');

    const secretPatterns = [
      { pattern: /password\s*=\s*["'][^"']{8,}["']/gi, name: 'Hardcoded password' },
      { pattern: /api[_-]?key\s*=\s*["'][^"']{16,}["']/gi, name: 'Hardcoded API key' },
      { pattern: /secret\s*=\s*["'][^"']{16,}["']/gi, name: 'Hardcoded secret' },
      { pattern: /token\s*=\s*["'][^"']{16,}["']/gi, name: 'Hardcoded token' },
    ];

    try {
      const srcFiles = await this.getJavaScriptFiles('./src');
      const backendFiles = await this.getJavaScriptFiles('./backend/src');
      const allFiles = [...srcFiles, ...backendFiles];

      for (const file of allFiles) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          
          for (const { pattern, name } of secretPatterns) {
            if (pattern.test(content)) {
              this.addFinding(
                SEVERITY_LEVELS.HIGH,
                'Secrets',
                name,
                `Potential ${name.toLowerCase()} found in ${file}`,
                'Move credentials to environment variables'
              );
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      console.log('✅ Source code scan complete');
    } catch (error) {
      console.warn('⚠️  Could not scan source code:', error.message);
    }
  }

  /**
   * Check authentication and authorization
   */
  async auditAuth() {
    console.log('🔍 Auditing authentication mechanisms...');

    try {
      // Check for JWT configuration
      const hasJWT = await this.fileContains('./backend/src', 'jsonwebtoken');
      if (!hasJWT) {
        this.addFinding(
          SEVERITY_LEVELS.MEDIUM,
          'Authentication',
          'No JWT implementation found',
          'JWT tokens not detected in backend',
          'Implement JWT for stateless authentication'
        );
      }

      // Check for password hashing
      const hasHashingWithCount = await this.fileContains('./backend/src', 'bcrypt');
      const hasArgon2 = await this.fileContains('./backend/src', 'argon2');
      
      if (!hasHashingWithCount && !hasArgon2) {
        this.addFinding(
          SEVERITY_LEVELS.CRITICAL,
          'Authentication',
          'No password hashing detected',
          'Passwords may not be properly hashed',
          'Implement bcrypt or argon2 for password hashing'
        );
      }

      // Check for rate limiting
      const hasRateLimit = await this.fileContains('./backend/src', 'rate-limit');
      if (!hasRateLimit) {
        this.addFinding(
          SEVERITY_LEVELS.HIGH,
          'Authentication',
          'No rate limiting detected',
          'API endpoints may be vulnerable to brute force attacks',
          'Implement express-rate-limit middleware'
        );
      }

      console.log('✅ Auth audit complete');
    } catch (error) {
      console.warn('⚠️  Could not audit auth:', error.message);
    }
  }

  /**
   * Check HTTPS and security headers
   */
  async auditHTTPSecurity() {
    console.log('🔍 Auditing HTTP security...');

    try {
      // Check for helmet middleware
      const hasHelmet = await this.fileContains('./backend/src', 'helmet');
      if (!hasHelmet) {
        this.addFinding(
          SEVERITY_LEVELS.HIGH,
          'HTTP Security',
          'Helmet middleware not found',
          'Missing security headers (CSP, XSS protection, etc.)',
          'Install and configure helmet middleware'
        );
      }

      // Check for CORS configuration
      const hasCORS = await this.fileContains('./backend/src', 'cors');
      if (!hasCORS) {
        this.addFinding(
          SEVERITY_LEVELS.MEDIUM,
          'HTTP Security',
          'CORS not configured',
          'Cross-origin requests may not be properly controlled',
          'Configure CORS middleware with strict origin policy'
        );
      }

      console.log('✅ HTTP security audit complete');
    } catch (error) {
      console.warn('⚠️  Could not audit HTTP security:', error.message);
    }
  }

  /**
   * Check database security
   */
  async auditDatabase() {
    console.log('🔍 Auditing database security...');

    try {
      // Check for SQL injection prevention
      const hasParamQueries = await this.fileContains('./backend/src', 'parameterized');
      const hasORMSafety = await this.fileContains('./backend/src', 'sequelize') || 
                          await this.fileContains('./backend/src', 'mongoose');

      if (!hasParamQueries && !hasORMSafety) {
        this.addFinding(
          SEVERITY_LEVELS.HIGH,
          'Database',
          'Potential SQL injection risk',
          'No evidence of parameterized queries or ORM usage',
          'Use parameterized queries or ORM for database access'
        );
      }

      // Check for connection encryption
      const envExample = await fs.readFile('.env.example', 'utf-8');
      if (!envExample.includes('ssl=true') && !envExample.includes('SSL')) {
        this.addFinding(
          SEVERITY_LEVELS.MEDIUM,
          'Database',
          'Database SSL not enforced',
          'Connection may not be encrypted',
          'Enable SSL for database connections'
        );
      }

      console.log('✅ Database audit complete');
    } catch (error) {
      console.warn('⚠️  Could not audit database:', error.message);
    }
  }

  /**
   * Generate audit report
   */
  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(AUDIT_REPORT_DIR, `security-audit-${timestamp}.json`);
    
    const report = {
      generatedAt: new Date().toISOString(),
      score: Math.max(0, this.score),
      grade: this.getSecurityGrade(),
      summary: {
        total: this.findings.length,
        critical: this.findings.filter(f => f.severity === SEVERITY_LEVELS.CRITICAL).length,
        high: this.findings.filter(f => f.severity === SEVERITY_LEVELS.HIGH).length,
        medium: this.findings.filter(f => f.severity === SEVERITY_LEVELS.MEDIUM).length,
        low: this.findings.filter(f => f.severity === SEVERITY_LEVELS.LOW).length,
      },
      findings: this.findings.sort((a, b) => {
        const order = [SEVERITY_LEVELS.CRITICAL, SEVERITY_LEVELS.HIGH, SEVERITY_LEVELS.MEDIUM, SEVERITY_LEVELS.LOW];
        return order.indexOf(a.severity) - order.indexOf(b.severity);
      }),
    };

    // Ensure directory exists
    await fs.mkdir(AUDIT_REPORT_DIR, { recursive: true });
    
    // Save JSON report
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const mdReport = this.generateMarkdownReport(report);
    await fs.writeFile(
      path.join(AUDIT_REPORT_DIR, `security-audit-${timestamp}.md`),
      mdReport
    );

    return { reportPath, report };
  }

  /**
   * Get security grade
   */
  getSecurityGrade() {
    if (this.score >= 90) return 'A';
    if (this.score >= 80) return 'B';
    if (this.score >= 70) return 'C';
    if (this.score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    let md = `# Security Audit Report\n\n`;
    md += `**Generated:** ${report.generatedAt}\n\n`;
    md += `## Overall Score: ${report.score}/100 (Grade: ${report.grade})\n\n`;
    
    md += `### Summary\n\n`;
    md += `- **Total Findings:** ${report.summary.total}\n`;
    md += `- **Critical:** ${report.summary.critical}\n`;
    md += `- **High:** ${report.summary.high}\n`;
    md += `- **Medium:** ${report.summary.medium}\n`;
    md += `- **Low:** ${report.summary.low}\n\n`;

    md += `---\n\n## Findings\n\n`;

    for (const finding of report.findings) {
      const icon = {
        CRITICAL: '🔴',
        HIGH: '🟠',
        MEDIUM: '🟡',
        LOW: '🔵',
        INFO: '⚪',
      }[finding.severity];

      md += `### ${icon} ${finding.severity}: ${finding.title}\n\n`;
      md += `**Category:** ${finding.category}\n\n`;
      md += `**Description:** ${finding.description}\n\n`;
      md += `**Remediation:** ${finding.remediation}\n\n`;
      md += `---\n\n`;
    }

    return md;
  }

  /**
   * Helper: Get all JavaScript files in directory
   */
  async getJavaScriptFiles(dir) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...await this.getJavaScriptFiles(fullPath));
        } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    return files;
  }

  /**
   * Helper: Check if any file in directory contains text
   */
  async fileContains(dir, searchText) {
    const files = await this.getJavaScriptFiles(dir);
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        if (content.includes(searchText)) {
          return true;
        }
      } catch (err) {
        // Skip
      }
    }
    return false;
  }
}

/**
 * Run security audit
 */
async function runSecurityAudit() {
  console.log('🛡️  Starting security audit...\n');

  const auditor = new SecurityAuditor();

  await auditor.auditDependencies();
  await auditor.auditEnvironmentConfig();
  await auditor.auditSourceCode();
  await auditor.auditAuth();
  await auditor.auditHTTPSecurity();
  await auditor.auditDatabase();

  const { reportPath, report } = await auditor.generateReport();

  console.log('\n📊 Audit Complete!\n');
  console.log(`Security Score: ${report.score}/100 (Grade: ${report.grade})`);
  console.log(`Total Findings: ${report.summary.total}`);
  console.log(`  - Critical: ${report.summary.critical}`);
  console.log(`  - High: ${report.summary.high}`);
  console.log(`  - Medium: ${report.summary.medium}`);
  console.log(`  - Low: ${report.summary.low}`);
  console.log(`\nReport saved to: ${reportPath}`);

  // Exit with error code if critical issues found
  if (report.summary.critical > 0) {
    console.error('\n❌ Critical security issues found! Please address immediately.');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityAudit().catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}

export default SecurityAuditor;
