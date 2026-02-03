# Rollback Strategy (Scaffold)

## Goals
- **RTO**: < 15 minutes
- **RPO**: < 5 minutes (for critical data)

## Rollback Steps
1. Switch traffic back to previous (blue) deployment.
2. Verify health endpoints: `/health` and `/api/status`.
3. Restore database backups if schema migrations were applied.
4. Re-run smoke tests.

## Pre-Deployment Safeguards
- Tag every release (e.g., `v1.2.3`)
- Maintain at least 2 previous images in registry
- Use feature flags for risky changes

## Database Rollback
- Prefer backward-compatible migrations
- Use `mongoose` schema versioning
- Keep daily snapshots with point-in-time recovery
