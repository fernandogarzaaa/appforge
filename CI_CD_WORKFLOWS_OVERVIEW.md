# 🔄 CI/CD Pipeline - Detailed Workflows Overview

Complete documentation of all GitHub Actions workflows in this repository.

## 📊 Workflow Summary

| Workflow | Purpose | Triggers | Status |
|----------|---------|----------|--------|
| [main.yml](#mainyml) | Primary CI/CD pipeline | Push, PR | ✅ Active |
| [ci-cd.yml](#ci-cdyml) | Build with Rust/WASM | Push, PR | ✅ Active |
| [security-audit.yml](#security-audityml) | Security scanning | Push, PR, Schedule | ✅ Active |
| [performance-tests.yml](#performance-testsyml) | Performance testing | Push, PR, Schedule | ✅ New |
| [code-scanning.yml](#code-scanningyml) | Code quality & security | Push, PR, Schedule | ✅ New |
| [deploy.yml](#deployyml) | Production deployment | Manual/Tag | ✅ Active |
| [node.js.yml](#nodejsyml) | Node.js testing | Push, PR | ✅ Active |

---

## 🎯 main.yml

**Purpose:** Primary CI/CD pipeline for testing, linting, and building Docker images.

### Configuration

- **Node Version:** 22.x (Updated)
- **Triggers:** Push and PR to `main`, `develop`
- **Services:** MongoDB 7, Redis 7
- **Runtime:** ~10-15 minutes

### Jobs

#### 1. Test Job
```yaml
Services:
  - MongoDB 7 (port 27017)
  - Redis 7 (port 6379)

Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Install frontend dependencies
  4. Run frontend tests
  5. Install backend dependencies
  6. Run backend tests with MongoDB & Redis

Environment Variables:
  - NODE_ENV: test
  - MONGODB_URI: mongodb://localhost:27017/appforge-test
  - REDIS_URL: redis://localhost:6379
  - JWT_SECRET: test-secret-key-for-ci-testing-only
  - ENCRYPTION_KEY: 12345678901234567890123456789012
```

#### 2. Lint Job
```yaml
Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Install frontend dependencies
  4. Run frontend linting
  5. Install backend dependencies
  6. Run backend linting
```

#### 3. Build Job
```yaml
Conditions: Runs only on push (not PR)
Requires: test, lint jobs pass

Steps:
  1. Checkout code
  2. Setup Docker Buildx
  3. Login to GitHub Container Registry
  4. Build backend Docker image
  5. Push to ghcr.io/YOUR_ORG/appforge-main-backend:latest

Permissions:
  - contents: read
  - packages: write
```

### Secrets Required

- `GITHUB_TOKEN` (automatically provided)

---

## 🦀 ci-cd.yml

**Purpose:** Complete build pipeline with Rust and WebAssembly support.

### Configuration

- **Node Version:** 22.x (Updated)
- **Rust:** Stable toolchain
- **WASM Target:** wasm32-unknown-unknown
- **Triggers:** Push and PR to `main`, `develop`
- **Runtime:** ~20-30 minutes

### Jobs

#### 1. Test Job with WASM Build
```yaml
Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Setup Rust stable
  4. Add WASM target
  5. Cache Rust dependencies
  6. Install wasm-pack
  7. Install npm dependencies
  8. Run linting
  9. Run unit tests
  10. Build quantum WASM module
  11. Build static analyzer WASM module
  12. Build production application

Cache Locations:
  - quantum-core/
  - static-analyzer-core/
```

### Features

- **Rust Caching:** Speeds up subsequent builds
- **WASM Compilation:** Compiles quantum and analyzer modules
- **Legacy Peer Deps:** Handles React 19 compatibility
- **Continue on Error:** WASM builds won't fail the pipeline

---

## 🔒 security-audit.yml

**Purpose:** Automated security vulnerability scanning and dependency checks.

### Configuration

- **Node Version:** 22.x (Updated)
- **Triggers:** Push, PR, Daily at 2 AM UTC
- **Runtime:** ~5-10 minutes

### Jobs

#### 1. Security Audit
```yaml
Steps:
  1. Checkout code (full history)
  2. Setup Node.js 22.x
  3. Install backend dependencies
  4. Run security audit script
  5. Upload security reports
  6. Comment on PR with results

Artifacts:
  - security-audit-reports/ (30 days retention)

Features:
  - Automated PR comments with security scores
  - Daily scheduled scans
  - Historical audit tracking
```

#### 2. Dependency Check
```yaml
Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Install dependencies
  4. Run npm audit
  5. Check for critical vulnerabilities
```

### Secrets Required

None (uses repository access)

---

## ⚡ performance-tests.yml

**Purpose:** Performance testing including Lighthouse audits, load testing, and bundle analysis.

### Configuration

- **Node Version:** 22.x
- **Triggers:** Push, PR, Weekly on Sunday at 3 AM UTC
- **Runtime:** ~15-25 minutes

### Jobs

#### 1. Lighthouse Performance Audit
```yaml
Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Install dependencies
  4. Build frontend
  5. Run Lighthouse CI
  6. Upload results to temporary public storage

Metrics Tested:
  - Performance score
  - Accessibility
  - Best practices
  - SEO
  - Progressive Web App
```

#### 2. API Load Testing
```yaml
Services:
  - MongoDB 7
  - Redis 7

Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Install backend dependencies
  4. Start backend server
  5. Install k6 load testing tool
  6. Run load tests
  7. Upload results

Load Test Scenarios:
  - Concurrent users: 10, 50, 100
  - Duration: 1 minute ramp-up, 5 minute sustained
  - Endpoints: /api/health, /api/status, /api/auth
```

#### 3. Bundle Size Analysis
```yaml
Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Install dependencies
  4. Build production bundle
  5. Analyze bundle size
  6. Comment on PR with size changes

Tracks:
  - Total bundle size
  - Individual chunk sizes
  - Size limit warnings
```

### Secrets Required

- `GITHUB_TOKEN` (for PR comments)

---

## 🔍 code-scanning.yml

**Purpose:** Advanced code quality and security scanning.

### Configuration

- **Node Version:** 22.x
- **Triggers:** Push, PR, Weekly on Monday at 4 AM UTC
- **Runtime:** ~10-20 minutes

### Jobs

#### 1. CodeQL Security Scanning
```yaml
Language: JavaScript
Queries: security-extended, security-and-quality

Steps:
  1. Checkout code
  2. Initialize CodeQL
  3. Autobuild
  4. Perform analysis
  5. Upload results to GitHub Security

Detects:
  - SQL injection
  - XSS vulnerabilities
  - Path traversal
  - Command injection
  - Hardcoded credentials
```

#### 2. Dependency Review
```yaml
Conditions: Only on pull requests

Steps:
  1. Checkout code
  2. Run dependency review
  3. Fail on moderate+ vulnerabilities
  4. Block GPL-2.0 and GPL-3.0 licenses

Features:
  - License compliance checking
  - Vulnerability severity threshold
  - Automatic PR blocking
```

#### 3. SonarCloud Code Quality
```yaml
Steps:
  1. Checkout code (full history)
  2. Setup Node.js 22.x
  3. Install dependencies
  4. Run tests with coverage
  5. Upload to SonarCloud

Metrics:
  - Code smells
  - Technical debt
  - Code coverage
  - Duplications
  - Security hotspots
```

#### 4. ESLint Analysis
```yaml
Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Install dependencies
  4. Run ESLint
  5. Annotate PR with results

Features:
  - Inline PR comments
  - File-level annotations
  - Rule violation breakdown
```

### Secrets Required

- `GITHUB_TOKEN` (automatically provided)
- `SONAR_TOKEN` (optional, for SonarCloud)

---

## 🚀 deploy.yml

**Purpose:** Production deployment automation.

### Configuration

- **Triggers:** Manual workflow_dispatch, Git tags
- **Environments:** staging, production
- **Runtime:** ~10-15 minutes

### Jobs

#### 1. Deploy to Staging
```yaml
Environment: staging
Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Build Docker images
  4. Push to registry
  5. Deploy to staging server
  6. Run smoke tests
```

#### 2. Deploy to Production
```yaml
Environment: production
Requires: Manual approval

Steps:
  1. Checkout code
  2. Setup Node.js 22.x
  3. Build production images
  4. Push to registry
  5. Deploy to production
  6. Run health checks
  7. Notify team
```

### Secrets Required

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`

---

## 📊 Workflow Execution Matrix

| Workflow | On Push | On PR | Scheduled | Manual |
|----------|---------|-------|-----------|--------|
| main.yml | ✅ | ✅ | ❌ | ❌ |
| ci-cd.yml | ✅ | ✅ | ❌ | ❌ |
| security-audit.yml | ✅ | ✅ | ✅ Daily | ❌ |
| performance-tests.yml | ✅ | ✅ | ✅ Weekly | ❌ |
| code-scanning.yml | ✅ | ✅ | ✅ Weekly | ❌ |
| deploy.yml | ❌ | ❌ | ❌ | ✅ |
| node.js.yml | ✅ | ✅ | ❌ | ❌ |

---

## 🔧 Common Configuration

### Shared Settings

All workflows use:
- **Actions Checkout:** v4
- **Actions Setup Node:** v4
- **Node Version:** 22.x (Updated)
- **npm ci:** For consistent installs

### Caching Strategy

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22.x
    cache: 'npm'
```

This caches `node_modules` between runs, reducing install time by ~70%.

---

## 📈 Performance Optimization

### Current Optimizations

1. **Parallel Jobs:** Independent jobs run simultaneously
2. **Dependency Caching:** npm and Rust dependencies cached
3. **Conditional Execution:** Some jobs only run on specific events
4. **Continue on Error:** Non-critical steps won't fail entire workflow

### Timing Breakdown

Average workflow execution times:

| Workflow | Average Time | Cached Time |
|----------|-------------|-------------|
| main.yml | 12 min | 8 min |
| ci-cd.yml | 25 min | 15 min |
| security-audit.yml | 8 min | 5 min |
| performance-tests.yml | 20 min | 12 min |
| code-scanning.yml | 15 min | 10 min |

---

## 🆘 Troubleshooting

### Common Issues

#### 1. Tests Failing
```bash
# Check MongoDB/Redis services started
# Verify environment variables set correctly
# Ensure test database is clean
```

#### 2. Build Timeouts
```bash
# Increase timeout in workflow
timeout-minutes: 30

# Or split into smaller jobs
```

#### 3. WASM Build Failures
```bash
# Marked as continue-on-error
# Check Rust toolchain version
# Verify wasm-pack installed correctly
```

#### 4. Secret Not Found
```bash
# Verify secret name matches exactly
# Check secret is in correct environment
# Ensure workflow has permission
```

---

## 📚 Next Steps

1. **Setup Secrets:** Follow [DEPLOYMENT_SECRETS_GUIDE.md](./DEPLOYMENT_SECRETS_GUIDE.md)
2. **Enable Workflows:** Push code to trigger workflows
3. **Monitor Results:** Check Actions tab in GitHub
4. **Configure Environments:** Set up staging/production environments
5. **Add Branch Protection:** Require status checks before merge

---

**Last Updated:** February 4, 2026
**Node Version:** 22.x (LTS)
**Total Workflows:** 7
**Status:** ✅ All Active and Updated
