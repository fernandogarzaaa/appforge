# Backend API Implementation Requirements

This document specifies the exact API endpoints and response formats required for the updated admin pages.

## Base URL
`/api/v1/admin`

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

## Response Format
Standard JSON response:
```json
{
  "data": { /* actual data */ },
  "error": null,
  "statusCode": 200
}
```

Error response:
```json
{
  "data": null,
  "error": { "message": "Error description" },
  "statusCode": 400 | 500
}
```

---

## Admin API Keys Endpoints

### GET /admin/keys
List all API keys with pagination support

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)
- `user` (optional) - filter by user
- `status` (optional) - filter by status (active, inactive, expired)

**Response:**
```json
{
  "data": [
    {
      "id": "key_123",
      "name": "Production API",
      "key": "sk_live_abc123...", // Only return if specifically requested
      "maskedKey": "sk_live_•••••••••89",
      "created": "2026-02-01T10:00:00Z",
      "lastUsed": "2026-02-04T08:30:00Z",
      "usageCount": 15847,
      "rateLimit": 1000,
      "rateLimitUnit": "hour",
      "expiresAt": "2027-01-15T10:00:00Z",
      "scopes": ["read", "write"],
      "status": "active",
      "user": "fernando@appforge.dev",
      "application": "Production App"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 4,
    "pages": 1
  }
}
```

### GET /admin/keys/stats
Get aggregated usage statistics

**Response:**
```json
{
  "data": {
    "last30Days": [
      {
        "date": "Jan 01",
        "requests": 450,
        "errors": 12
      }
    ],
    "topEndpoints": [
      {
        "endpoint": "/api/projects",
        "calls": 4521,
        "avgTime": "145ms"
      }
    ],
    "statusCodes": {
      "200": 14850,
      "400": 200,
      "500": 45
    }
  }
}
```

### POST /admin/keys
Create a new API key

**Request Body:**
```json
{
  "name": "New Key Name",
  "rateLimit": 1000,
  "rateLimitUnit": "hour",
  "expiresAt": "2027-02-01T00:00:00Z",
  "scopes": ["read", "write"]
}
```

**Response:**
```json
{
  "data": {
    "id": "key_456",
    "name": "New Key Name",
    "key": "sk_live_newkey123...",
    "maskedKey": "sk_live_•••••••••••....",
    "created": "2026-02-04T12:00:00Z",
    "lastUsed": null,
    "usageCount": 0,
    "rateLimit": 1000,
    "rateLimitUnit": "hour",
    "expiresAt": "2027-02-01T00:00:00Z",
    "scopes": ["read", "write"],
    "status": "active",
    "user": "admin@appforge.dev",
    "application": null
  }
}
```

### PUT /admin/keys/:id
Update an API key

**Request Body:**
```json
{
  "name": "Updated Name",
  "rateLimit": 2000,
  "expiresAt": "2027-03-01T00:00:00Z"
}
```

**Response:** Same as POST response with updated data

### PUT /admin/keys/:id/rotate
Rotate an API key (generate new one, keep scopes)

**Response:** Same as POST response with new key generated

### DELETE /admin/keys/:id
Delete an API key

**Response:**
```json
{
  "data": { "success": true },
  "error": null
}
```

---

## Admin Secrets Endpoints

### GET /admin/secrets
List all secrets

**Query Parameters:**
- `category` (optional) - filter by category
- `page` (optional)
- `limit` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "secret_1",
      "category": "environment",
      "key": "NODE_ENV",
      "label": "Node Environment",
      "value": "production",
      "type": "string",
      "encrypted": false,
      "modified": "2026-02-01T10:00:00Z",
      "modifiedBy": "admin@appforge.dev",
      "status": "active",
      "description": "Application runtime environment",
      "previousValue": "development",
      "critical": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15
  }
}
```

### GET /admin/secrets/audit
Get audit log for secrets

**Query Parameters:**
- `page` (optional)
- `limit` (optional, default: 20)
- `action` (optional) - filter by action (CREATE, UPDATE, DELETE, ROLLBACK)

**Response:**
```json
{
  "data": [
    {
      "id": "audit_1",
      "action": "UPDATE",
      "secretKey": "STRIPE_SECRET_KEY",
      "user": "admin@appforge.dev",
      "timestamp": "2026-02-03T16:20:00Z",
      "oldValue": "sk_live_old***",
      "newValue": "sk_live_new***",
      "reason": "Key rotation"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 43
  }
}
```

### POST /admin/secrets
Create a new secret

**Request Body:**
```json
{
  "category": "custom",
  "key": "API_KEY",
  "label": "API Key",
  "value": "secret_value_here",
  "type": "string",
  "description": "Description of the secret"
}
```

**Response:** Secret object as in GET response

### PUT /admin/secrets/:id
Update a secret value

**Request Body:**
```json
{
  "value": "new_secret_value"
}
```

**Response:** Updated secret object

### PUT /admin/secrets/:id/rollback
Rollback secret to previous value

**Response:** Secret object with rolled back value

### DELETE /admin/secrets/:id
Delete a secret

**Response:**
```json
{
  "data": { "success": true }
}
```

### POST /admin/secrets/export
Export all secrets (encrypted)

**Response:**
```json
{
  "data": {
    "version": "1.0",
    "exported": "2026-02-04T12:00:00Z",
    "exportedBy": "admin@appforge.dev",
    "secrets": [
      {
        "key": "API_KEY",
        "value": "encrypted_value_here",
        "category": "custom",
        "type": "string",
        "encrypted": true,
        "description": "..."
      }
    ]
  }
}
```

### POST /admin/secrets/import
Import secrets from backup

**Request Body:**
```json
{
  "version": "1.0",
  "secrets": [
    {
      "key": "API_KEY",
      "value": "secret_value",
      "category": "custom",
      "type": "string",
      "description": "..."
    }
  ]
}
```

**Response:** Array of imported secret objects

---

## Admin System Config Endpoints

### GET /admin/config
Get full system configuration

**Response:**
```json
{
  "data": {
    "database": {
      "mongoUri": "mongodb+srv://...",
      "redis": {
        "host": "redis.internal",
        "port": 6379,
        "password": "",
        "tls": false
      },
      "pool": {
        "min": 5,
        "max": 50,
        "idleTimeoutMs": 30000
      },
      "sslEnabled": true,
      "sslMode": "require",
      "migrations": {
        "status": "up-to-date",
        "lastRun": "2026-02-01T13:24:00Z",
        "pending": 0,
        "history": [
          {
            "id": "2026_01_28_add_usage_index",
            "status": "applied"
          }
        ]
      }
    },
    "email": {
      "provider": "sendgrid",
      "host": "smtp.sendgrid.net",
      "port": 587,
      "from": "ops@appforge.dev",
      "tls": true,
      "deliveryLogs": [
        {
          "id": "log-1",
          "recipient": "team@appforge.dev",
          "status": "delivered",
          "time": "2026-02-04T08:20:00Z"
        }
      ]
    },
    "deployment": {
      "regions": ["us-east-1", "eu-west-1"],
      "autoscaling": {
        "min": 2,
        "max": 12,
        "cpuThreshold": 70,
        "memoryThreshold": 75
      },
      "cdn": {
        "enabled": true,
        "provider": "cloudflare",
        "cacheTtlSeconds": 3600
      }
    }
  }
}
```

### PUT /admin/config
Update configuration (supports partial updates)

**Request Body:** Any subset of config object
```json
{
  "database.mongoUri": "new_uri_here",
  "deployment.autoscaling.max": 20
}
```

**Response:** Full updated config object

### POST /admin/config/test
Test service connection

**Request Body:**
```json
{
  "service": "mongodb" | "redis" | "email"
}
```

**Response:**
```json
{
  "data": {
    "service": "mongodb",
    "status": "connected" | "error",
    "message": "Connection successful",
    "latency": 45
  }
}
```

### POST /admin/config/reset
Reset to default configuration

**Response:** Full config object with defaults

---

## Admin Monitoring Endpoints

### GET /admin/monitoring/metrics
Get current system metrics

**Response:**
```json
{
  "data": {
    "latency_history": [
      { "timestamp": "12:00", "value": 145 }
    ],
    "error_rate_history": [
      { "timestamp": "12:00", "value": 2.5 }
    ],
    "rps_history": [
      { "timestamp": "12:00", "value": 450 }
    ],
    "status_codes": {
      "200": 14850,
      "400": 200,
      "500": 45
    }
  }
}
```

### GET /admin/monitoring/health
Get system health status

**Response:**
```json
{
  "data": {
    "status": "healthy" | "warning" | "critical",
    "cpu_usage": 45.5,
    "memory_usage": 62.3,
    "uptime": 99.95,
    "active_users": 234
  }
}
```

### GET /admin/monitoring/errors
Get recent errors

**Query Parameters:**
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "error_1",
      "message": "Connection timeout",
      "stack": "...",
      "service": "api",
      "timestamp": "2026-02-04T12:00:00Z",
      "count": 5
    }
  ]
}
```

### GET /admin/monitoring/logs
Get application logs with pagination

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `severity` (optional) - debug, info, warn, error, fatal

**Response:**
```json
{
  "data": [
    {
      "id": "log_1",
      "severity": "info" | "warn" | "error",
      "message": "Request processed",
      "service": "api",
      "timestamp": "2026-02-04T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5000,
    "pages": 500
  }
}
```

### GET /admin/monitoring/sessions
Get active user sessions

**Response:**
```json
{
  "data": [
    {
      "id": "session_1",
      "userId": "user_123",
      "email": "user@example.com",
      "lastActive": "2026-02-04T12:05:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

### GET /admin/monitoring/alerts
Get all alerts

**Query Parameters:**
- `status` (optional) - active, resolved

**Response:**
```json
{
  "data": [
    {
      "id": "alert_1",
      "name": "High CPU Usage",
      "severity": "warning" | "critical",
      "message": "CPU usage exceeded 80%",
      "triggered_at": "2026-02-04T12:00:00Z",
      "metric": "cpu_usage",
      "threshold": 80,
      "current_value": 85
    }
  ]
}
```

### PUT /admin/monitoring/alerts/config
Update alert configuration

**Request Body:**
```json
{
  "cpu": 80,
  "memory": 85,
  "errorRate": 5,
  "responseTime": 2000
}
```

**Response:** Updated config object

### POST /admin/monitoring/alerts
Create a new alert

**Request Body:**
```json
{
  "name": "Alert Name",
  "metric": "cpu_usage",
  "threshold": 80,
  "severity": "warning",
  "webhookUrl": "https://...",
  "webhookSecret": "secret..."
}
```

**Response:** Created alert object

---

## Error Handling

All endpoints should return appropriate HTTP status codes:

- **200**: Success
- **201**: Created
- **204**: No Content (DELETE)
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate key, etc.)
- **500**: Internal Server Error

Error response format:
```json
{
  "data": null,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": { /* optional additional details */ }
  },
  "statusCode": 400
}
```

---

## Rate Limiting

Consider implementing rate limits for:
- Create/update operations: 10 requests per minute per user
- Delete operations: 5 requests per minute per user
- List operations: 60 requests per minute per user
- Search operations: 20 requests per minute per user

---

## Caching Recommendations

- Cache metrics for 5-10 seconds
- Cache health status for 5 seconds
- Cache logs for 1-2 seconds
- No caching for secrets/credentials
- Cache config for 30 seconds

---

## Pagination Best Practices

- Default limit: 50
- Max limit: 500
- Include `total` count in response
- Include `pages` count in response
- Support cursor-based pagination for large datasets

---

## Security Considerations

1. **Authentication**: Verify JWT token on all endpoints
2. **Authorization**: Check user permissions before returning data
3. **Encryption**: Encrypt sensitive data at rest
4. **Masking**: Always mask or exclude full secret values except on creation
5. **Audit Logging**: Log all create/update/delete operations
6. **Rate Limiting**: Implement per-user rate limits
7. **Input Validation**: Validate all incoming data
8. **CORS**: Properly configure CORS for frontend origin

---

## Testing Checklist

- [ ] All endpoints return correct status codes
- [ ] Pagination works correctly
- [ ] Filtering works on all list endpoints
- [ ] Search functionality returns relevant results
- [ ] Error messages are clear and actionable
- [ ] Rate limits are enforced
- [ ] Authentication is required on all endpoints
- [ ] Audit logs are created for all mutations
- [ ] Secrets are properly encrypted/masked
- [ ] Large dataset handling works correctly

---

Generated: February 4, 2026
