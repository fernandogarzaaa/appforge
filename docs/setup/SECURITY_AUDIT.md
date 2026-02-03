# Security Audit Guide

## Overview

AppForge includes a comprehensive security audit system that continuously scans for vulnerabilities and security misconfigurations.

## Running Security Audits

### Local Development

```bash
cd backend
npm run security:audit
```

Output includes:
- ✅ Dependency vulnerability scan
- ✅ Environment configuration review
- ✅ Source code secret detection
- ✅ Authentication mechanism verification
- ✅ HTTP security header check
- ✅ Database security audit
- ✅ Overall security score (0-100)

### CI/CD Pipeline

Security audit runs automatically on:
- ✅ Every push to `main` and `develop`
- ✅ Pull requests
- ✅ Daily schedule (2 AM UTC)

View results in GitHub Actions:
```
https://github.com/fernandogarzaaa/appforge/actions/workflows/security-audit.yml
```

## Understanding the Report

### Report Format

Audit generates two reports in `backend/security-audits/`:

1. **JSON Report** (`audit-TIMESTAMP.json`)
   - Machine-readable format
   - Integrates with security tools
   - Contains detailed finding data

2. **Markdown Report** (`audit-TIMESTAMP.md`)
   - Human-readable format
   - Executive summary
   - Remediation guidance
   - Security score

### Example Report

```markdown
# Security Audit Report
Date: 2026-02-03T10:30:00Z
Environment: production

## Executive Summary
✅ Overall Security: GOOD (78/100)
- Critical Issues: 0
- High Issues: 1
- Medium Issues: 3
- Low Issues: 2

## Audit Results

### 1. Dependency Vulnerabilities
Status: ⚠️ MEDIUM

Found 1 high-severity vulnerability:
- Package: express@4.17.1
- Issue: Denial of Service in req.query parsing
- Fix: Upgrade to express@4.18.2

### 2. Environment Configuration
Status: ✅ GOOD

Secret detection in .env.example:
- API keys properly excluded ✅
- Database passwords properly excluded ✅

### 3. Source Code Secrets
Status: ✅ GOOD

No hardcoded secrets found

### 4. Authentication
Status: ⚠️ MEDIUM

Missing implementations:
- Rate limiting on auth endpoints ⚠️
- Password complexity enforcement ❌
- MFA support ❌

### 5. HTTP Security
Status: ✅ GOOD

Security headers configured:
- Content-Security-Policy ✅
- X-Frame-Options ✅
- Strict-Transport-Security ✅

### 6. Database
Status: ⚠️ MEDIUM

Issues found:
- Connection pooling not optimized
- Prepared statements usage: 95% ✅
- SQL injection protection: Active ✅

## Remediation Guide

### Priority 1 (Critical)
No critical issues found ✅

### Priority 2 (High)
1. Upgrade express to 4.18.2
   ```bash
   npm update express
   ```

### Priority 3 (Medium)
1. Enable rate limiting on auth endpoints
   ```javascript
   import rateLimit from 'express-rate-limit';
   const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
   app.post('/auth/login', authLimiter, loginHandler);
   ```

2. Implement password complexity validation
   ```javascript
   const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
   ```

## Security Score Breakdown

| Category | Score | Weight |
|----------|-------|--------|
| Dependencies | 80/100 | 25% |
| Secrets | 95/100 | 25% |
| Source Code | 100/100 | 15% |
| Auth | 60/100 | 20% |
| HTTP | 95/100 | 10% |
| Database | 70/100 | 5% |

**Overall: 78/100** (Grade: B)

## Audit Categories

### 1. Dependency Vulnerabilities

Scans `package.json` and `package-lock.json` using `npm audit`

**Checks**:
- ✅ Version constraints
- ✅ Known CVEs
- ✅ Outdated packages
- ✅ Deprecated libraries

**Fix Common Issues**:
```bash
# Show all vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Force major version upgrades
npm audit fix --force
```

### 2. Environment Configuration

Scans `.env.example` for accidentally exposed secrets

**Detects**:
- API keys (OpenAI, GitHub, AWS)
- Database passwords
- Authentication tokens
- Private encryption keys
- Webhook secrets

**Prevention**:
```bash
# ❌ Bad - Secret in .env.example
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# ✅ Good - Placeholder only
OPENAI_API_KEY=your_openai_key_here
```

### 3. Source Code Secrets

Regex-based scanning of JavaScript/TypeScript files

**Detects**:
- Hardcoded database passwords
- API keys in code
- Private encryption keys
- Authentication tokens
- Slack/Discord webhooks

**Example**:
```bash
# ❌ Bad - Key in source code
const apiKey = "sk-proj-xxxxxxxxxxxxx";

# ✅ Good - From environment
const apiKey = process.env.OPENAI_API_KEY;
```

### 4. Authentication Mechanisms

Checks for security best practices

**Verifies**:
- JWT implementation
- Password hashing (bcrypt/argon2)
- Rate limiting on auth endpoints
- HTTPS enforcement
- CSRF protection

### 5. HTTP Security Headers

Validates security headers are configured

**Required Headers**:
- `Content-Security-Policy` - Prevent XSS
- `X-Content-Type-Options` - Prevent MIME sniffing
- `X-Frame-Options` - Prevent clickjacking
- `Strict-Transport-Security` - Force HTTPS
- `X-XSS-Protection` - Legacy XSS protection

**Helmet Configuration**:
```javascript
import helmet from 'helmet';
app.use(helmet());  // Sets all headers automatically
```

### 6. Database Security

Checks database configuration

**Verifies**:
- Connection encryption (SSL/TLS)
- Prepared statements usage
- SQL injection prevention
- Password hashing
- Access control

## GitHub Actions Integration

### Workflow Status

View security audit status:
```
GitHub → Actions → Security Audit → Latest Run
```

### PR Comments

Security audit automatically comments on PRs:

```markdown
## 🔒 Security Audit Report

**Security Score**: 78/100

[View full report](link)

For details, download the security audit artifacts.
```

### Failed Audits

If critical issues found, CI/CD fails:

```
❌ Security audit failed - critical issues detected

Please review and fix the issues above before proceeding.
```

## Fixing Common Issues

### 1. Dependency Vulnerabilities

```bash
# Check current vulnerabilities
npm audit

# View detailed info
npm audit --json

# Fix automatically
npm audit fix

# Update specific package
npm update express

# Upgrade major version
npm install express@latest
```

### 2. Environment Secrets

Review `.env.example`:
```bash
# ❌ Contains secret
STRIPE_SECRET_KEY=sk_live_xxxxx

# ✅ Placeholder only
STRIPE_SECRET_KEY=your_stripe_secret_here
```

### 3. Hardcoded Secrets in Code

Search for secrets:
```bash
# Find potential secrets
grep -r "sk_live_\|sk_test_\|api_key\|password" src/ --include="*.js"

# Use external tool
npm install -g detect-secrets
detect-secrets scan
```

### 4. Missing Authentication

```javascript
// Add rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.post('/api/auth/login', limiter, loginHandler);
```

### 5. Missing Security Headers

```javascript
import helmet from 'helmet';

// Use helmet to set all security headers
app.use(helmet());

// Or configure individually
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "trusted.cdn.com"],
  },
}));
```

## Continuous Improvement

### Regular Checks

1. **Weekly**: Run local `npm audit`
2. **Daily**: CI/CD automatic audit
3. **Monthly**: Manual security review
4. **Quarterly**: Third-party penetration test

### Baseline Improvement

Target Security Score: 90+/100

```
Current: 78/100
Target: 90+/100
Gap: 12 points

Priority Improvements:
1. Fix dependency vulnerabilities (-3 points → +5 points)
2. Implement auth rate limiting (-2 points → +3 points)
3. Enable password complexity (+2 points)
4. Optimize database pooling (+2 points)
```

## Best Practices

1. **Fix Critical Issues Immediately**
   - Deploy hotfix to production
   - Notify security team
   - Document root cause

2. **Plan High-Risk Fixes**
   - Schedule maintenance window
   - Test thoroughly in staging
   - Have rollback plan

3. **Keep Dependencies Updated**
   - Review `npm outdated` monthly
   - Update minor versions automatically
   - Test major version upgrades

4. **Document Security Decisions**
   - Why certain checks are ignored
   - Approved exceptions
   - Remediation timeline

## Support

- **Documentation**: https://docs.appforge.dev/security
- **GitHub Issues**: https://github.com/fernandogarzaaa/appforge/issues
- **Security Email**: security@appforge.dev
- **Bug Bounty**: https://appforge.dev/security/bounty

---

**Last Updated**: February 3, 2026
