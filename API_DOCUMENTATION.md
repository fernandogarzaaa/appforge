# AppForge API Documentation

Complete reference for AppForge REST API endpoints, including LLM gateway, monitoring, analytics, security, and marketplace services.

---

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [LLM Gateway](#llm-gateway)
- [Monitoring API](#monitoring-api)
- [Analytics API](#analytics-api)
- [Security API](#security-api)
- [Marketplace API](#marketplace-api)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Base URL

### Main Backend API
```
Production:  https://api.appforge.io/api/v1/
Development: http://localhost:5000/api/v1/
```

### LLM Gateway (Quantum Chimera)
```
Production:  https://llm.appforge.io/
Development: http://localhost:8000/
```

---

## Authentication

Most endpoints require authentication via JWT Bearer token.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### Obtaining a Token

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## LLM Gateway

The Quantum Chimera LLM Gateway provides OpenAI-compatible endpoints for chat completions with multi-model routing.

### Chat Completions

**Endpoint:** `POST /v1/chat/completions`

Generate chat completions using various AI models with automatic routing and fallback.

**Request Body:**
```json
{
  "model": "chimera-auto",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Explain quantum computing in simple terms."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 512,
  "stream": false
}
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | No | `chimera-auto` | Model identifier or `chimera-auto` for automatic routing |
| `messages` | array | Yes | - | Array of message objects with `role` and `content` |
| `temperature` | float | No | 0.7 | Sampling temperature (0-2) |
| `max_tokens` | integer | No | 512 | Maximum tokens to generate |
| `stream` | boolean | No | false | Enable streaming response |
| `top_p` | float | No | 1.0 | Nucleus sampling parameter |
| `frequency_penalty` | float | No | 0 | Frequency penalty (-2 to 2) |
| `presence_penalty` | float | No | 0 | Presence penalty (-2 to 2) |

**Response (Non-streaming):**
```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1704067200,
  "model": "kimi-k2.5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing is a type of computing that uses quantum mechanics principles..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

**Response (Streaming):**
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1704067200,"model":"kimi-k2.5","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1704067200,"model":"kimi-k2.5","choices":[{"index":0,"delta":{"content":"Quantum"},"finish_reason":null}]}

data: [DONE]
```

#### Code Examples

**cURL:**
```bash
curl -X POST "https://llm.appforge.io/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "chimera-auto",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }'
```

**Python:**
```python
import requests

response = requests.post(
    "https://llm.appforge.io/v1/chat/completions",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
    },
    json={
        "model": "chimera-auto",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Explain quantum computing."}
        ],
        "temperature": 0.7,
        "max_tokens": 512
    }
)

result = response.json()
print(result["choices"][0]["message"]["content"])
```

**JavaScript:**
```javascript
const response = await fetch('https://llm.appforge.io/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'chimera-auto',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain quantum computing.' }
    ],
    temperature: 0.7,
    max_tokens: 512
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

**Python (OpenAI SDK):**
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://llm.appforge.io/v1",
    api_key="YOUR_API_KEY"
)

response = client.chat.completions.create(
    model="chimera-auto",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing."}
    ],
    temperature=0.7,
    max_tokens=512
)

print(response.choices[0].message.content)
```

---

### Models

**Endpoint:** `GET /v1/models`

List all available models and their capabilities.

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "chimera-auto",
      "object": "model",
      "created": 1704067200,
      "owned_by": "appforge",
      "permission": [],
      "root": "chimera-auto",
      "parent": null
    },
    {
      "id": "kimi-k2.5",
      "object": "model",
      "created": 1704067200,
      "owned_by": "moonshot",
      "permission": [],
      "root": "kimi-k2.5",
      "parent": null
    },
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1704067200,
      "owned_by": "openai",
      "permission": [],
      "root": "gpt-4o",
      "parent": null
    }
  ]
}
```

#### Code Examples

**cURL:**
```bash
curl -X GET "https://llm.appforge.io/v1/models" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Python:**
```python
import requests

response = requests.get(
    "https://llm.appforge.io/v1/models",
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)

models = response.json()
for model in models["data"]:
    print(f"{model['id']} by {model['owned_by']}")
```

**JavaScript:**
```javascript
const response = await fetch('https://llm.appforge.io/v1/models', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

const data = await response.json();
data.data.forEach(model => {
  console.log(`${model.id} by ${model.owned_by}`);
});
```

---

### Dashboard

**Endpoint:** `GET /dashboard`

Access the monitoring dashboard for the LLM gateway.

**Response:** HTML dashboard with real-time metrics

---

### Health

**Endpoint:** `GET /health`

Check the health status of the LLM gateway.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "3.0.0",
  "services": {
    "database": "connected",
    "cache": "connected",
    "models": ["kimi-k2.5", "gpt-4o"]
  }
}
```

#### Code Examples

**cURL:**
```bash
curl -X GET "https://llm.appforge.io/health"
```

**Python:**
```python
import requests

response = requests.get("https://llm.appforge.io/health")
health = response.json()
print(f"Status: {health['status']}")
```

**JavaScript:**
```javascript
const response = await fetch('https://llm.appforge.io/health');
const health = await response.json();
console.log(`Status: ${health.status}`);
```

---

## Monitoring API

**Base:** `/api/v1/monitoring`

### Report Metric

**Endpoint:** `POST /api/v1/monitoring/metrics`

Report a custom metric for monitoring.

**Request:**
```json
{
  "appId": "app-123",
  "metricType": "error",
  "value": 1,
  "unit": "count",
  "endpoint": "/api/users",
  "statusCode": 500,
  "tags": {
    "environment": "production",
    "region": "us-east"
  }
}
```

**Response:**
```json
{
  "success": true,
  "metricId": "metric-uuid"
}
```

---

### Get Metrics

**Endpoint:** `GET /api/v1/monitoring/metrics`

Retrieve current metrics.

**Query Parameters:**
- `appId` (optional): Filter by application ID

**Response:**
```json
{
  "success": true,
  "metrics": {
    "database": {
      "healthy": true,
      "responseTime": 12
    },
    "requests": {
      "total": 15000,
      "errors": 23,
      "avgResponseTime": 45
    }
  }
}
```

---

### Get Errors

**Endpoint:** `GET /api/v1/monitoring/errors`

Get error list grouped by type.

**Query Parameters:**
- `appId` (optional): Filter by application ID

**Response:**
```json
{
  "success": true,
  "errors": [
    {
      "error_type": "DatabaseConnectionError",
      "count": 5,
      "last_seen": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

### Create Alert Rule

**Endpoint:** `POST /api/v1/monitoring/alerts`

Create a new alert rule.

**Request:**
```json
{
  "appId": "app-123",
  "name": "High Error Rate",
  "metricKey": "error_rate",
  "conditionOperator": "gt",
  "threshold": 5.0,
  "cooldownSeconds": 300,
  "webhookUrl": "https://hooks.slack.com/services/...",
  "webhookSecret": "secret-key",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "alertId": "alert-uuid"
}
```

---

### List Alert Rules

**Endpoint:** `GET /api/v1/monitoring/alerts`

List all alert rules.

**Query Parameters:**
- `appId` (optional): Filter by application ID

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert-uuid",
      "app_id": "app-123",
      "name": "High Error Rate",
      "metric_key": "error_rate",
      "condition_operator": "gt",
      "threshold": 5.0,
      "enabled": true
    }
  ]
}
```

---

### Update Alert Rule

**Endpoint:** `PUT /api/v1/monitoring/alerts/:id`

Update an existing alert rule.

**Request:**
```json
{
  "threshold": 3.0,
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "alertId": "alert-uuid"
}
```

---

### Delete Alert Rule

**Endpoint:** `DELETE /api/v1/monitoring/alerts/:id`

Delete an alert rule.

**Response:**
```json
{
  "success": true,
  "alertId": "alert-uuid"
}
```

---

### Health Dashboard

**Endpoint:** `GET /api/v1/monitoring/health`

Get comprehensive service health status.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "metrics": {
    "database": {
      "healthy": true,
      "responseTime": 12
    },
    "cache": {
      "healthy": true
    }
  }
}
```

---

## Analytics API

**Base:** `/api/v1/analytics`

### Get Usage Metrics

**Endpoint:** `GET /api/v1/analytics/usage`

Get usage metrics by time range.

**Query Parameters:**
- `range` (optional): Time range (`1d`, `7d`, `30d`, `90d`, `1y`, `all-time`) - Default: `7d`
- `appId` (optional): Filter by application ID

**Response:**
```json
{
  "success": true,
  "totals": {
    "requests": 15000,
    "errors": 23,
    "avgLatency": 45
  },
  "series": [
    {
      "bucket": "2024-01-01T00:00:00Z",
      "totalRequests": 1000,
      "errorCount": 2,
      "avgLatencyMs": 42
    }
  ]
}
```

---

### Get Team Analytics

**Endpoint:** `GET /api/v1/analytics/team/:teamId`

Get team productivity analytics.

**Query Parameters:**
- `range` (optional): Time range - Default: `7d`

**Response:**
```json
{
  "success": true,
  "teamId": "team-123",
  "metrics": {
    "commits": 150,
    "pullRequests": 45,
    "codeReviews": 89
  }
}
```

---

### Get Productivity Insights

**Endpoint:** `GET /api/v1/analytics/productivity`

Get AI-generated productivity insights.

**Query Parameters:**
- `range` (optional): Time range - Default: `7d`

**Response:**
```json
{
  "success": true,
  "insights": [
    "Team velocity increased by 15% this week",
    "Code review time decreased by 20%"
  ],
  "recommendations": [
    "Consider pairing junior developers with seniors",
    "Focus on reducing technical debt in auth module"
  ]
}
```

---

### Get Code Quality Trends

**Endpoint:** `GET /api/v1/analytics/code-quality`

Get code quality trends over time.

**Query Parameters:**
- `range` (optional): Time range - Default: `7d`

**Response:**
```json
{
  "success": true,
  "direction": "improving",
  "delta": 5.2,
  "trends": [
    {
      "date": "2024-01-01",
      "score": 85,
      "issues": 12
    }
  ]
}
```

---

### Get Feature Adoption

**Endpoint:** `GET /api/v1/analytics/features`

Get feature adoption tracking.

**Query Parameters:**
- `range` (optional): Time range - Default: `7d`

**Response:**
```json
{
  "success": true,
  "activeUsers": 1200,
  "features": [
    {
      "name": "AI Code Generation",
      "adoptionRate": 45,
      "usageCount": 540
    }
  ]
}
```

---

### Get Engagement Score

**Endpoint:** `GET /api/v1/analytics/engagement/:userId`

Get user engagement score.

**Query Parameters:**
- `range` (optional): Time range - Default: `7d`

**Response:**
```json
{
  "success": true,
  "userId": "user-123",
  "score": 85,
  "breakdown": {
    "loginFrequency": 90,
    "featureUsage": 80,
    "collaboration": 85
  }
}
```

---

### Get Benchmarks

**Endpoint:** `GET /api/v1/analytics/benchmarks`

Get performance vs industry benchmarks.

**Query Parameters:**
- `range` (optional): Time range - Default: `7d`
- `appId` (optional): Filter by application ID

**Response:**
```json
{
  "success": true,
  "benchmarks": {
    "deploymentFrequency": {
      "value": 12,
      "industry": 8,
      "percentile": 75
    },
    "leadTime": {
      "value": 2.5,
      "industry": 5.0,
      "percentile": 80
    }
  }
}
```

---

### Get Predictions

**Endpoint:** `GET /api/v1/analytics/predictions`

Get predictive analytics for the next 7/30 days.

**Query Parameters:**
- `range` (optional): Time range - Default: `7d`
- `appId` (optional): Filter by application ID

**Response:**
```json
{
  "success": true,
  "range": "7d",
  "predictions": {
    "usage": {
      "next7Days": 12500,
      "next30Days": 54000,
      "confidence": 0.85
    },
    "errors": {
      "trend": "decreasing",
      "predictedCount": 15
    }
  }
}
```

---

### Get Anomalies

**Endpoint:** `GET /api/v1/analytics/anomalies`

Detect statistical anomalies in metrics.

**Query Parameters:**
- `range` (optional): Time range - Default: `7d`
- `appId` (optional): Filter by application ID

**Response:**
```json
{
  "success": true,
  "range": "7d",
  "anomalies": [
    {
      "type": "error_spike",
      "timestamp": "2024-01-01T12:00:00Z",
      "severity": "high",
      "description": "Error rate spiked to 15% (normal: 2%)"
    }
  ]
}
```

---

### Generate Report

**Endpoint:** `POST /api/v1/analytics/reports`

Generate custom analytics report (PDF/CSV/JSON).

**Rate Limit:** 10 requests per hour

**Request:**
```json
{
  "format": "pdf",
  "range": "30d",
  "appId": "app-123",
  "includePredictions": true,
  "sections": ["usage", "quality", "features", "engagement"]
}
```

**Response:** Binary file (PDF/CSV) or JSON

---

### Track Event

**Endpoint:** `POST /api/v1/analytics/track`

Track a custom analytics event.

**Request:**
```json
{
  "eventType": "feature_used",
  "teamId": "team-123",
  "featureKey": "ai_generate",
  "value": 1,
  "durationMs": 2500,
  "metadata": {
    "language": "python"
  },
  "source": "web_app",
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "event-uuid"
}
```

---

## Security API

**Base:** `/api/v1/security`

**Rate Limit:** 100 scans per day per user

### Scan Code

**Endpoint:** `POST /api/v1/security/scan/code`

Perform security code scanning.

**Request:**
```json
{
  "projectId": "proj-123",
  "language": "javascript",
  "code": "const password = 'hardcoded123';"
}
```

**Response:**
```json
{
  "success": true,
  "scanId": "scan-uuid",
  "issues": [
    {
      "severity": "high",
      "type": "hardcoded_secret",
      "message": "Hardcoded password detected",
      "line": 1
    }
  ],
  "score": 65
}
```

---

### Scan Dependencies

**Endpoint:** `POST /api/v1/security/scan/dependencies`

Scan project dependencies for vulnerabilities.

**Request:**
```json
{
  "projectId": "proj-123",
  "packageJson": {
    "dependencies": {
      "lodash": "4.17.15"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "scanId": "scan-uuid",
  "vulnerabilities": [
    {
      "package": "lodash",
      "version": "4.17.15",
      "severity": "critical",
      "cve": "CVE-2021-23337",
      "fixedIn": "4.17.21"
    }
  ]
}
```

---

### Scan Secrets

**Endpoint:** `POST /api/v1/security/scan/secrets`

Scan content for exposed secrets.

**Request:**
```json
{
  "projectId": "proj-123",
  "content": "API_KEY=sk-live-1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true,
  "scanId": "scan-uuid",
  "secrets": [
    {
      "type": "api_key",
      "severity": "critical",
      "pattern": "sk-live-",
      "location": "line 1"
    }
  ]
}
```

---

### Scan Compliance

**Endpoint:** `POST /api/v1/security/scan/compliance`

Perform compliance scanning (GDPR, SOC2, etc.).

**Request:**
```json
{
  "projectId": "proj-123",
  "code": "function processUserData(data) { ... }",
  "dependencies": ["express", "helmet"]
}
```

**Response:**
```json
{
  "success": true,
  "scanId": "scan-uuid",
  "compliance": {
    "gdpr": {
      "score": 85,
      "issues": [
        "Missing data retention policy"
      ]
    },
    "soc2": {
      "score": 90,
      "issues": []
    }
  }
}
```

---

### Get Scan

**Endpoint:** `GET /api/v1/security/scans/:id`

Retrieve a specific scan result.

**Response:**
```json
{
  "success": true,
  "scan": {
    "id": "scan-uuid",
    "project_id": "proj-123",
    "type": "code",
    "status": "completed",
    "results": { ... },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### List Scans

**Endpoint:** `GET /api/v1/security/scans`

List all security scans.

**Query Parameters:**
- `projectId` (optional): Filter by project ID

**Response:**
```json
{
  "success": true,
  "scans": [
    {
      "id": "scan-uuid",
      "project_id": "proj-123",
      "type": "code",
      "status": "completed",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Security Rule

**Endpoint:** `POST /api/v1/security/rules`

Create a custom security rule.

**Request:**
```json
{
  "projectId": "proj-123",
  "name": "No console.log in production",
  "description": "Prevent console.log statements in production code",
  "ruleType": "regex",
  "pattern": "console\\.log\\s*\\(",
  "severity": "medium",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "ruleId": "rule-uuid"
}
```

---

### List Security Rules

**Endpoint:** `GET /api/v1/security/rules`

List all security rules.

**Query Parameters:**
- `projectId` (optional): Filter by project ID

**Response:**
```json
{
  "success": true,
  "rules": [
    {
      "id": "rule-uuid",
      "project_id": "proj-123",
      "name": "No console.log in production",
      "rule_type": "regex",
      "pattern": "console\\.log\\s*\\(",
      "severity": "medium",
      "enabled": true
    }
  ]
}
```

---

### Update Security Rule

**Endpoint:** `PUT /api/v1/security/rules/:id`

Update an existing security rule.

**Request:**
```json
{
  "severity": "high",
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "ruleId": "rule-uuid"
}
```

---

### Delete Security Rule

**Endpoint:** `DELETE /api/v1/security/rules/:id`

Delete a security rule.

**Response:**
```json
{
  "success": true,
  "ruleId": "rule-uuid"
}
```

---

### Get Audit Log

**Endpoint:** `GET /api/v1/security/audit-log`

Get security audit logs.

**Response:**
```json
{
  "success": true,
  "auditLog": [
    {
      "id": "log-uuid",
      "user_id": "user-123",
      "action": "security.rule.create",
      "resource_type": "security_rule",
      "resource_id": "rule-uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Marketplace API

**Base:** `/api/v1/marketplace`

### Upload Template

**Endpoint:** `POST /api/v1/marketplace/templates`

Upload a new template to the marketplace.

**Request:**
```json
{
  "title": "React Dashboard Template",
  "description": "A modern React dashboard with Tailwind CSS",
  "category": "react",
  "language": "typescript",
  "tags": ["dashboard", "admin", "ui"],
  "price": 29.99,
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "templateId": "template-uuid",
  "uploadUrl": "https://storage.appforge.io/templates/..."
}
```

---

### Browse Templates

**Endpoint:** `GET /api/v1/marketplace/templates`

Browse templates with search and filters.

**Query Parameters:**
- `search` (optional): Search query
- `category` (optional): Filter by category
- `language` (optional): Filter by language
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `sortBy` (optional): Sort by (`trending`, `recent`, `popular`, `rating`)
- `page` (optional): Page number - Default: 1
- `limit` (optional): Items per page - Default: 20

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "template-uuid",
      "title": "React Dashboard Template",
      "description": "A modern React dashboard...",
      "category": "react",
      "language": "typescript",
      "price": 29.99,
      "rating": 4.5,
      "downloads": 150,
      "author": {
        "id": "user-123",
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

### Get Template Details

**Endpoint:** `GET /api/v1/marketplace/templates/:id`

Get detailed information about a template.

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "template-uuid",
    "title": "React Dashboard Template",
    "description": "A modern React dashboard...",
    "category": "react",
    "language": "typescript",
    "tags": ["dashboard", "admin", "ui"],
    "price": 29.99,
    "rating": 4.5,
    "downloads": 150,
    "versions": [
      {
        "version": "1.0.0",
        "releaseDate": "2024-01-01"
      }
    ],
    "author": {
      "id": "user-123",
      "name": "John Doe"
    }
  }
}
```

---

### Update Template

**Endpoint:** `PUT /api/v1/marketplace/templates/:id`

Update template metadata (owner only).

**Request:**
```json
{
  "title": "Updated Title",
  "price": 39.99,
  "isPublic": false
}
```

**Response:**
```json
{
  "success": true,
  "templateId": "template-uuid"
}
```

---

### Delete Template

**Endpoint:** `DELETE /api/v1/marketplace/templates/:id`

Soft delete a template (owner only).

**Response:**
```json
{
  "success": true,
  "templateId": "template-uuid"
}
```

---

### Download Template

**Endpoint:** `POST /api/v1/marketplace/templates/:id/download`

Track template download and get download URL.

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://storage.appforge.io/templates/...",
  "expiresAt": "2024-01-01T01:00:00Z"
}
```

---

### Rate Template

**Endpoint:** `POST /api/v1/marketplace/templates/:id/rate`

Add or update a template rating.

**Request:**
```json
{
  "rating": 5,
  "review": "Excellent template, saved me hours of work!"
}
```

**Response:**
```json
{
  "success": true,
  "ratingId": "rating-uuid"
}
```

---

### Get Template Versions

**Endpoint:** `GET /api/v1/marketplace/templates/:id/versions`

Get version history of a template.

**Response:**
```json
{
  "success": true,
  "versions": [
    {
      "version": "1.1.0",
      "releaseDate": "2024-02-01",
      "changelog": "Added dark mode support"
    },
    {
      "version": "1.0.0",
      "releaseDate": "2024-01-01",
      "changelog": "Initial release"
    }
  ]
}
```

---

### Purchase Template

**Endpoint:** `POST /api/v1/marketplace/templates/:id/purchase`

Process payment for a premium template.

**Request:**
```json
{
  "stripeToken": "tok_visa",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "purchaseId": "purchase-uuid",
  "downloadUrl": "https://storage.appforge.io/templates/..."
}
```

---

### Get Earnings

**Endpoint:** `GET /api/v1/marketplace/earnings`

Get creator earnings and sales statistics.

**Query Parameters:**
- `period` (optional): Period (`day`, `week`, `month`, `year`, `all`)

**Response:**
```json
{
  "success": true,
  "earnings": {
    "total": 2999.50,
    "currency": "USD",
    "sales": 150,
    "period": "month"
  },
  "byTemplate": [
    {
      "templateId": "template-uuid",
      "title": "React Dashboard",
      "earnings": 1500.00,
      "sales": 75
    }
  ]
}
```

---

### Get Categories

**Endpoint:** `GET /api/v1/marketplace/categories`

List all template categories with counts.

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "name": "react",
      "displayName": "React",
      "count": 45
    },
    {
      "name": "vue",
      "displayName": "Vue",
      "count": 30
    }
  ]
}
```

---

### Report Template

**Endpoint:** `POST /api/v1/marketplace/templates/:id/report`

Report a template for abuse or inappropriate content.

**Request:**
```json
{
  "reason": "copyright",
  "description": "This template uses copyrighted assets without permission"
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "report-uuid"
}
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    "key": "value"
  }
}
```

### Error Response
```json
{
  "error": "Human-readable error message",
  "details": "Optional technical details",
  "code": "ERROR_CODE"
}
```

### Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Not admin/no permission |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

---

## Error Handling

### Common Errors

**Missing Authentication:**
```json
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}
```
*Fix: Include valid JWT token in Authorization header*

**Invalid Request:**
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "code": "VALIDATION_ERROR"
}
```
*Fix: Check request body against API schema*

**Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```
*Fix: Wait before retrying or reduce request frequency*

**Resource Not Found:**
```json
{
  "error": "Template not found",
  "code": "TEMPLATE_NOT_FOUND"
}
```
*Fix: Verify resource ID is correct*

---

## Rate Limiting

Current limits per user:

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| General API | 100 | 15 minutes |
| Security Scans | 100 | 24 hours |
| Report Generation | 10 | 1 hour |
| Webhook Endpoints | Unlimited | - |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1706432460
```

---

## WebSocket API

Real-time collaboration via WebSocket.

**Connection URL:**
```
wss://api.appforge.io/socket.io
```

### Events

**Join Project:**
```javascript
socket.emit('join', { projectId: 'proj-123' });
```

**Code Change:**
```javascript
socket.emit('code:change', {
  projectId: 'proj-123',
  file: 'src/app.js',
  changes: [{ from: 10, to: 15, text: 'new code' }]
});
```

**Cursor Position:**
```javascript
socket.emit('cursor:move', {
  projectId: 'proj-123',
  position: { line: 10, column: 5 }
});
```

---

## SDK Examples

### Python SDK

```python
from appforge import Client

client = Client(api_key="YOUR_API_KEY")

# Chat completion
response = client.llm.chat.completions.create(
    model="chimera-auto",
    messages=[{"role": "user", "content": "Hello!"}]
)

# Security scan
scan = client.security.scan.code(
    project_id="proj-123",
    language="python",
    code="print('hello')"
)
```

### JavaScript SDK

```javascript
import { AppForgeClient } from '@appforge/sdk';

const client = new AppForgeClient({ apiKey: 'YOUR_API_KEY' });

// Chat completion
const response = await client.llm.chat.completions.create({
  model: 'chimera-auto',
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Get analytics
const analytics = await client.analytics.usage({ range: '7d' });
```

---

**Last Updated:** March 2026
