# Analytics & Insights Integration Guide (Agent 1)

## Overview
These analytics endpoints are mounted at /api/v1/analytics and require JWT auth.

## Required Services
- PostgreSQL tables: app_metrics, app_errors, team_members, analytics_events
- Auth middleware: verifyToken
- Metrics aggregation: metricsAggregator (optional realtime)

## Endpoint Summary
- GET /api/v1/analytics/usage
- GET /api/v1/analytics/team/:teamId
- GET /api/v1/analytics/productivity
- GET /api/v1/analytics/code-quality
- GET /api/v1/analytics/features
- GET /api/v1/analytics/engagement/:userId
- GET /api/v1/analytics/benchmarks
- GET /api/v1/analytics/predictions
- GET /api/v1/analytics/anomalies
- POST /api/v1/analytics/reports (rate-limited 10/hour)
- POST /api/v1/analytics/track

## Auth & Rate Limit
- All endpoints require Authorization: Bearer <token>
- Report generation limited to 10 per hour per user

## Database Notes
The analytics pipeline expects analytics_events to contain:
- id, user_id, team_id, event_type, feature_key, value, duration_ms, metadata, source, session_id, created_at

## Caching
- Read-heavy endpoints cache results for 5 minutes in memory

## Example Track Event
POST /api/v1/analytics/track
{
  "eventType": "feature_used",
  "featureKey": "deploy",
  "value": 1,
  "metadata": { "projectId": "proj_123" }
}
