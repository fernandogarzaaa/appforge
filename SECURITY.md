# Security Policy

## Supported Versions

| Version | Supported          |
|---------|-------------------|
| 3.x     | ✅ Supported       |
| 2.x     | ❌ Not supported   |
| < 2.0   | ❌ Not supported   |

## Reporting a Vulnerability

We take security seriously at AppForge. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **Do NOT** open a public issue
2. Email security@appforge.fun with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

| Phase | Timeline |
|-------|----------|
| Initial Response | Within 48 hours |
| Assessment Update | Within 72 hours |
| Fix Implementation | Based on severity |
| Public Disclosure | After fix is deployed |

### Security Best Practices

When contributing to AppForge:

1. Never commit:
   - API keys or tokens
   - Private keys or certificates
   - Passwords or credentials
   - Environment files (.env)
   - State files (bot_memory.json, swarm_state.json)

2. Use environment variables for sensitive configuration
3. Run `npm audit` before submitting PRs
4. Enable 2FA on your GitHub account

## Security Features

AppForge includes several security measures:

- CodeQL static analysis
- Dependency vulnerability scanning
- Secret detection in CI/CD
- Sentry integration for error tracking
- Automated security updates via Dependabot
