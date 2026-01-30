<!-- markdownlint-disable MD013 -->
# 🔌 Complete REST API Endpoints

**AppForge API Reference**  
**Base URL:** `https://appforge.fun/api`  
**Last Updated:** January 28, 2026

---

## Authentication

All endpoints require authentication via Authorization header:

```bash
Authorization: Bearer {USER_API_TOKEN}
```

Or use Base44 SDK built-in auth via `createClientFromRequest(req)`.

---

## Table of Contents

- [Project Management](#project-management)
- [Marketplace](#marketplace)
- [Monitoring & Analytics](#monitoring--analytics)
- [Team & Collaboration](#team--collaboration)
- [Integrations](#integrations)
- [Deployment](#deployment)
- [Security](#security)

---

## Project Management

### GET `/projects`
List all user projects.

**Query Parameters:**
- `page` (int) - Default: 1
- `limit` (int) - Default: 20
- `sort` (string) - 'created', 'updated', 'name'
- `search` (string) - Filter by name

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "proj_xxxxx",
      "name": "My Project",
      "description": "Project description",
      "isFavorite": false,
      "createdAt": "2026-01-28T00:00:00Z",
      "updatedAt": "2026-01-28T00:00:00Z"
    }
  ],
  "total": 42,
  "page": 1
}
```

---

### POST `/projects/{projectId}/clone`
Clone a project.

**Body:**
```json
{
  "sourceProjectId": "proj_xxxxx",
  "newProjectName": "My Project Copy"
}
```

**Response:**
```json
{
  "success": true,
  "newProjectId": "proj_yyyyy",
  "newProjectName": "My Project Copy"
}
```

---

### POST `/projects/{projectId}/favorite`
Toggle project favorite status.

**Body:**
```json
{
  "projectId": "proj_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "projectId": "proj_xxxxx",
  "isFavorite": true
}
```

---

### GET `/search`
Global search across projects and functions.

**Query Parameters:**
- `q` (string, required) - Search query
- `type` (string) - Filter: 'project', 'function', 'page', 'component'
- `limit` (int) - Default: 10

**Response:**
```json
{
  "success": true,
  "query": "user authentication",
  "results": [
    {
      "id": "func_xxxxx",
      "type": "function",
      "name": "authenticateUser",
      "relevance": 0.95
    }
  ],
  "total": 42
}
```

---

## Marketplace

### GET `/marketplace/templates`
List marketplace templates.

**Query Parameters:**
- `category` (string) - Filter by category
- `tags` (string) - Comma-separated tags
- `sort` (string) - 'popular', 'rating', 'newest', 'price'
- `minPrice`, `maxPrice` (int) - Price range in cents
- `page` (int) - Default: 1
- `limit` (int) - Default: 20

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "tpl_xxxxx",
      "name": "User Authentication System",
      "creator": {
        "id": "user_xxxxx",
        "name": "John Doe"
      },
      "price": 2999,
      "rating": 4.8,
      "reviewCount": 156,
      "downloads": 1243,
      "category": "authentication",
      "tags": ["auth", "login", "security"],
      "preview": "https://..."
    }
  ],
  "total": 487
}
```

---

### POST `/marketplace/templates`
Publish a template.

**Body:**
```json
{
  "templateName": "User Authentication",
  "description": "Complete user auth with 2FA",
  "price": 2999,
  "category": "authentication",
  "tags": ["auth", "security", "login"],
  "sourceProjectId": "proj_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "templateId": "tpl_xxxxx",
  "marketplaceUrl": "https://appforge.fun/marketplace/templates/tpl_xxxxx"
}
```

---

### POST `/marketplace/templates/{templateId}/purchase`
Purchase a template.

**Body:**
```json
{
  "templateId": "tpl_xxxxx",
  "paymentMethodId": "pm_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "projectId": "proj_yyyyy",
  "message": "Template installed to your workspace"
}
```

---

### GET `/marketplace/templates/{templateId}/reviews`
Get template reviews.

**Response:**
```json
{
  "success": true,
  "templateId": "tpl_xxxxx",
  "reviews": [
    {
      "id": "rev_xxxxx",
      "user": { "id": "user_xxxxx", "name": "Jane Smith" },
      "rating": 5,
      "review": "Excellent template!",
      "helpfulCount": 23,
      "createdAt": "2026-01-20T00:00:00Z"
    }
  ],
  "totalReviews": 156,
  "avgRating": 4.8
}
```

---

### POST `/marketplace/templates/{templateId}/reviews`
Leave a review.

**Body:**
```json
{
  "rating": 5,
  "review": "Great product!"
}
```

**Response:**
```json
{
  "success": true,
  "reviewId": "rev_xxxxx"
}
```

---

## Monitoring & Analytics

### POST `/monitoring/metrics`
Submit application metric.

**Body:**
```json
{
  "appId": "app_xxxxx",
  "metricType": "latency",
  "value": 245.32,
  "unit": "ms",
  "endpoint": "POST /api/users",
  "statusCode": 200,
  "tags": {
    "region": "us-east-1",
    "version": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "metricId": "metric_xxxxx"
}
```

---

### POST `/monitoring/errors`
Report application error.

**Body:**
```json
{
  "appId": "app_xxxxx",
  "errorType": "TypeError",
  "message": "Cannot read property 'name' of undefined",
  "stackTrace": "...",
  "context": {
    "endpoint": "POST /api/users",
    "userId": "user_xxxxx",
    "requestId": "req_xxxxx"
  }
}
```

**Response:**
```json
{
  "success": true,
  "errorId": "err_xxxxx",
  "alertSent": true
}
```

---

### GET `/monitoring/apps/{appId}/dashboard`
Get monitoring dashboard data.

**Query Parameters:**
- `period` (string) - '1h', '24h', '7d', '30d'

**Response:**
```json
{
  "success": true,
  "appId": "app_xxxxx",
  "period": "24h",
  "metrics": {
    "avgLatency": 245.32,
    "p95Latency": 1245.32,
    "errorRate": 0.15,
    "throughput": 2456.32,
    "uptime": 99.95
  },
  "topErrors": [
    {
      "id": "err_xxxxx",
      "message": "...",
      "frequency": 245,
      "severity": "high"
    }
  ],
  "alerts": [
    {
      "id": "alert_xxxxx",
      "message": "High error rate detected",
      "severity": "critical"
    }
  ]
}
```

---

### GET `/monitoring/apps/{appId}/errors`
List application errors.

**Query Parameters:**
- `status` (string) - 'new', 'acknowledged', 'resolved'
- `severity` (string) - 'low', 'medium', 'high', 'critical'
- `limit` (int) - Default: 20

**Response:**
```json
{
  "success": true,
  "errors": [
    {
      "id": "err_xxxxx",
      "type": "TypeError",
      "message": "Cannot read property 'name' of undefined",
      "frequency": 245,
      "firstOccurrence": "2026-01-20T00:00:00Z",
      "lastOccurrence": "2026-01-28T14:30:00Z",
      "severity": "high",
      "status": "new"
    }
  ],
  "total": 42
}
```

---

### GET `/monitoring/apps/{appId}/performance-report`
Get performance report.

**Query Parameters:**
- `startDate` (ISO 8601) - Required
- `endDate` (ISO 8601) - Required

**Response:**
```json
{
  "success": true,
  "period": {
    "start": "2026-01-21T00:00:00Z",
    "end": "2026-01-28T00:00:00Z"
  },
  "metrics": {
    "avgLatency": 245.32,
    "p95Latency": 1245.32,
    "p99Latency": 2345.32,
    "errorRate": 0.15,
    "throughput": 2456.32,
    "uptime": 99.95
  },
  "trends": {
    "latency": "up",
    "errorRate": "down"
  }
}
```

---

## Team & Collaboration

### GET `/team/members`
List team members.

**Response:**
```json
{
  "success": true,
  "members": [
    {
      "id": "member_xxxxx",
      "user": { "id": "user_xxxxx", "name": "John Doe", "email": "john@example.com" },
      "role": "owner",
      "joinedAt": "2025-12-01T00:00:00Z"
    }
  ],
  "total": 5
}
```

---

### POST `/team/members/invite`
Invite team member.

**Body:**
```json
{
  "email": "jane@example.com",
  "role": "editor"
}
```

**Response:**
```json
{
  "success": true,
  "inviteId": "inv_xxxxx",
  "message": "Invitation sent to jane@example.com"
}
```

---

### POST `/projects/{projectId}/comments`
Add comment to project/function.

**Body:**
```json
{
  "resourceType": "function",
  "resourceId": "func_xxxxx",
  "content": "This function needs better error handling"
}
```

**Response:**
```json
{
  "success": true,
  "commentId": "comment_xxxxx"
}
```

---

### POST `/projects/{projectId}/code-reviews`
Create code review.

**Body:**
```json
{
  "functionId": "func_xxxxx",
  "reviewerId": "user_xxxxx",
  "suggestions": "Add input validation"
}
```

**Response:**
```json
{
  "success": true,
  "reviewId": "review_xxxxx",
  "status": "pending"
}
```

---

### GET `/projects/{projectId}/activity`
Get project activity timeline.

**Query Parameters:**
- `limit` (int) - Default: 50
- `offset` (int) - Default: 0

**Response:**
```json
{
  "success": true,
  "activities": [
    {
      "id": "activity_xxxxx",
      "user": { "name": "John Doe" },
      "action": "updated",
      "resourceType": "function",
      "resourceName": "authenticateUser",
      "timestamp": "2026-01-28T14:30:00Z"
    }
  ],
  "total": 247
}
```

---

## Integrations

### GET `/integrations/available`
List available integrations.

**Response:**
```json
{
  "success": true,
  "integrations": [
    {
      "id": "stripe",
      "name": "Stripe",
      "category": "payment",
      "description": "Payment processing",
      "configured": false,
      "icon": "https://..."
    }
  ],
  "total": 20
}
```

---

### POST `/integrations/{projectId}/configure`
Configure integration.

**Body:**
```json
{
  "integrationType": "stripe",
  "config": {
    "secretKey": "sk_live_...",
    "publicKey": "pk_live_..."
  },
  "testMode": false
}
```

**Response:**
```json
{
  "success": true,
  "integrationId": "integ_xxxxx",
  "message": "Stripe integration configured"
}
```

---

### GET `/integrations/{projectId}/logs`
Get integration webhook logs.

**Query Parameters:**
- `integrationType` (string)
- `limit` (int) - Default: 50

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_xxxxx",
      "event": "payment.successful",
      "status": 200,
      "timestamp": "2026-01-28T14:30:00Z",
      "payload": { ... }
    }
  ],
  "total": 247
}
```

---

## Deployment

### GET `/deployments/{projectId}`
List project deployments.

**Response:**
```json
{
  "success": true,
  "deployments": [
    {
      "id": "deploy_xxxxx",
      "version": "v1.0.2",
      "environment": "production",
      "status": "success",
      "deployedBy": { "name": "John Doe" },
      "createdAt": "2026-01-28T14:30:00Z"
    }
  ],
  "total": 42
}
```

---

### POST `/deployments/{projectId}`
Create new deployment.

**Body:**
```json
{
  "environment": "production",
  "version": "v1.0.2"
}
```

**Response:**
```json
{
  "success": true,
  "deploymentId": "deploy_xxxxx",
  "status": "in_progress"
}
```

---

### POST `/deployments/{deploymentId}/rollback`
Rollback to previous deployment.

**Response:**
```json
{
  "success": true,
  "message": "Rolled back to v1.0.1",
  "newDeploymentId": "deploy_yyyyy"
}
```

---

## Security

### GET `/security/audit/{projectId}`
Get security audit results.

**Response:**
```json
{
  "success": true,
  "audit": {
    "id": "audit_xxxxx",
    "type": "vulnerability_scan",
    "findings": [
      {
        "title": "SQL Injection vulnerability",
        "severity": "critical",
        "description": "...",
        "remediation": "..."
      }
    ],
    "completedAt": "2026-01-28T00:00:00Z"
  }
}
```

---

### POST `/security/audit/{projectId}/run`
Run security audit.

**Body:**
```json
{
  "auditType": "penetration_test"
}
```

**Response:**
```json
{
  "success": true,
  "auditId": "audit_xxxxx",
  "status": "in_progress"
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Invalid request",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **409** - Conflict
- **429** - Rate Limited
- **500** - Internal Server Error

---

## Rate Limiting

All endpoints have rate limiting:
- **Free tier:** 100 requests/minute
- **Pro tier:** 1,000 requests/minute
- **Enterprise:** Custom limits

Rate limit info in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1643385600
```

---

**Last Updated:** January 28, 2026  
**Next Review:** February 28, 2026
