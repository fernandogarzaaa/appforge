# Admin Controllers - Code Examples & Best Practices

## Table of Contents
1. [API Key Examples](#api-key-examples)
2. [Secret Examples](#secret-examples)
3. [User Examples](#user-examples)
4. [Monitoring Examples](#monitoring-examples)
5. [Configuration Examples](#configuration-examples)
6. [Common Patterns](#common-patterns)

---

## API Key Examples

### Creating an API Key

```javascript
// Request
POST /admin/keys
Content-Type: application/json

{
  "name": "Production Database Integration",
  "description": "Used for database synchronization",
  "scope": ["read", "write"],
  "rateLimit": 1000,
  "rateLimitUnit": "hour",
  "expiresAt": "2025-12-31T23:59:59Z",
  "ipWhitelist": ["192.168.1.100", "10.0.0.0/8"],
  "metadata": {
    "team": "backend",
    "service": "sync-engine"
  }
}

// Response (201 Created)
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Production Database Integration",
    "status": "active",
    "scope": ["read", "write"],
    "rateLimit": 1000,
    "rateLimitUnit": "hour",
    "description": "Used for database synchronization",
    "keyPreview": "appf...9011",
    "key": "appforge_abc123def456ghi789jkl012mno", // Only returned at creation
    "createdAt": "2024-02-04T10:00:00Z",
    "createdBy": "507f1f77bcf86cd799439012",
    "lastUsed": null,
    "usageCount": 0,
    "expiresAt": "2025-12-31T23:59:59Z",
    "ipWhitelist": ["192.168.1.100", "10.0.0.0/8"],
    "metadata": { "team": "backend", "service": "sync-engine" }
  }
}
```

### Listing API Keys with Filters

```javascript
// Request with filters
GET /admin/keys?page=1&limit=25&status=active&scope=read&sort=-createdAt

// Response
{
  "status": "success",
  "data": {
    "page": 1,
    "limit": 25,
    "total": 47,
    "pages": 2,
    "keys": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Production Database Integration",
        "status": "active",
        "scope": ["read", "write"],
        "keyPreview": "appf...9011",
        "rateLimit": 1000,
        "rateLimitUnit": "hour",
        "createdAt": "2024-02-04T10:00:00Z",
        "lastUsed": "2024-02-04T15:30:00Z",
        "usageCount": 1523
      },
      // ... more keys
    ]
  }
}
```

### Rotating an API Key

```javascript
// Request
POST /admin/keys/507f1f77bcf86cd799439011/rotate

// Response
{
  "status": "success",
  "data": {
    "oldKey": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Production Database Integration",
      "status": "active",
      "keyPreview": "appf...9011"
    },
    "newKey": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Production Database Integration",
      "status": "active",
      "keyPreview": "appf...9013",
      "key": "appforge_xyz789uvw456rst123opq" // New plaintext key
    }
  },
  "message": "API key rotated successfully"
}
```

### Revoking an API Key

```javascript
// Request
POST /admin/keys/507f1f77bcf86cd799439011/revoke
Content-Type: application/json

{
  "reason": "Compromised during development. Replacing with new key."
}

// Response
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "revoked",
    "revokedAt": "2024-02-04T16:00:00Z",
    "revokedBy": "507f1f77bcf86cd799439012",
    "revokedReason": "Compromised during development. Replacing with new key."
  }
}
```

### Getting Key Usage Statistics

```javascript
// Request
GET /admin/keys/507f1f77bcf86cd799439011/usage

// Response
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Production Database Integration",
    "rateLimit": 1000,
    "rateLimitUnit": "hour",
    "usageCount": 15234,
    "lastUsed": "2024-02-04T16:45:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-02-04T16:45:00Z",
    "expiresAt": "2025-12-31T23:59:59Z"
  }
}
```

---

## Secret Examples

### Creating a Secret

```javascript
// Request
POST /admin/secrets
Content-Type: application/json

{
  "key": "DATABASE_PASSWORD",
  "value": "SuperSecretPassword123!@#",
  "category": "database",
  "environment": "production",
  "description": "Production database root password",
  "metadata": {
    "host": "db.prod.internal",
    "port": 5432,
    "database": "main_db"
  },
  "tags": ["production", "critical", "database"],
  "owner": "507f1f77bcf86cd799439012"
}

// Response (201 Created)
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "key": "DATABASE_PASSWORD",
    "category": "database",
    "environment": "production",
    "description": "Production database root password",
    "value": "SuperSecretPassword123!@#", // Decrypted only at creation
    "metadata": { "host": "db.prod.internal", "port": 5432, "database": "main_db" },
    "tags": ["production", "critical", "database"],
    "createdAt": "2024-02-04T10:00:00Z",
    "createdBy": "507f1f77bcf86cd799439012"
  }
}
```

### Getting a Secret with Decryption

```javascript
// Request
GET /admin/secrets/507f1f77bcf86cd799439020

// Response (decrypted value included)
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "key": "DATABASE_PASSWORD",
    "category": "database",
    "environment": "production",
    "value": "SuperSecretPassword123!@#", // Decrypted
    "metadata": { "host": "db.prod.internal" },
    "tags": ["production", "critical"],
    "createdAt": "2024-02-04T10:00:00Z",
    "lastModifiedAt": "2024-02-04T14:00:00Z"
  }
}
```

### Listing Secrets (Masked)

```javascript
// Request with filters
GET /admin/secrets?page=1&limit=25&category=database&environment=production

// Response (values masked)
{
  "status": "success",
  "data": {
    "page": 1,
    "limit": 25,
    "total": 12,
    "pages": 1,
    "secrets": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "key": "DATABASE_PASSWORD",
        "category": "database",
        "environment": "production",
        "valueMasked": "Su***d123!@#", // Masked, not decrypted
        "tags": ["production", "critical"],
        "createdAt": "2024-02-04T10:00:00Z"
      },
      // ... more secrets
    ]
  }
}
```

### Rotating a Secret

```javascript
// Request
POST /admin/secrets/507f1f77bcf86cd799439020/rotate
Content-Type: application/json

{
  "newValue": "NewSecretPassword456!@#$%"
}

// Response
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "key": "DATABASE_PASSWORD",
    "value": "NewSecretPassword456!@#$%", // New decrypted value
    "lastModifiedAt": "2024-02-04T17:00:00Z",
    "lastModifiedBy": "507f1f77bcf86cd799439012"
  }
}

// Audit log shows rotation in history
// Previous value is stored encrypted (last 10 versions kept)
```

### Exporting Secrets (Encrypted)

```javascript
// Request with optional filters
GET /admin/secrets/export?category=api-key&environment=production

// Response (encrypted payload)
{
  "status": "success",
  "data": {
    "encrypted": true,
    "payload": "U2FsdGVkX1...[very long encrypted string]...==",
    "count": 5,
    "exportedAt": "2024-02-04T17:05:00Z"
  }
}

// Payload is AES-256-GCM encrypted
// Can be transmitted securely or stored for backup
```

### Importing Secrets (Encrypted)

```javascript
// Request
POST /admin/secrets/import
Content-Type: application/json

{
  "encrypted": true,
  "payload": "U2FsdGVkX1...[encrypted payload]...=="
}

// Response
{
  "status": "success",
  "data": {
    "created": 3,
    "updated": 2,
    "errors": []
  },
  "message": "Secrets imported successfully"
}

// Audit log shows IMPORT action with counts
```

### Getting Secrets Due for Rotation

```javascript
// Request
GET /admin/secrets/rotation-due

// Response (secrets with rotationSchedule set and nextRotationDue < now)
{
  "status": "success",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "key": "API_KEY_EXTERNAL_SERVICE",
      "category": "api-key",
      "rotationSchedule": "monthly",
      "lastRotatedAt": "2024-01-04T10:00:00Z",
      "nextRotationDue": "2024-02-04T10:00:00Z", // Overdue
      "valueMasked": "abcd...xyz"
    }
  ]
}
```

---

## User Examples

### Creating a User (from auth controller, audit logged)

```javascript
// When user registers or admin creates user
// Audit log created for new user
{
  "action": "CREATE",
  "userId": "507f1f77bcf86cd799439012", // Admin
  "resourceType": "user",
  "resourceId": "507f1f77bcf86cd799439030",
  "details": {
    "email": "newuser@example.com",
    "role": "user"
  },
  "status": "success"
}
```

### Listing Users with Filters

```javascript
// Request
GET /admin/users?page=1&limit=25&role=admin&status=active&search=john

// Response
{
  "status": "success",
  "data": {
    "page": 1,
    "limit": 25,
    "total": 3,
    "pages": 1,
    "users": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "email": "john.admin@example.com",
        "username": "john_admin",
        "firstName": "John",
        "lastName": "Administrator",
        "role": "admin",
        "isActive": true,
        "createdAt": "2023-06-15T08:00:00Z",
        "lastLogin": "2024-02-04T09:30:00Z",
        "emailVerified": true,
        "mfaEnabled": true
      }
    ]
  }
}
```

### Banning a User

```javascript
// Request
POST /admin/users/507f1f77bcf86cd799439030/ban
Content-Type: application/json

{
  "reason": "Violated terms of service - suspicious activity detected"
}

// Response
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "email": "baduser@example.com",
    "isActive": false
  },
  "message": "User banned successfully"
}

// Audit log entry:
{
  "action": "BAN",
  "userId": "507f1f77bcf86cd799439012", // Admin
  "resourceType": "user",
  "resourceId": "507f1f77bcf86cd799439030",
  "details": {
    "email": "baduser@example.com",
    "reason": "Violated terms of service - suspicious activity detected"
  },
  "status": "success"
}
```

### Resetting User Password

```javascript
// Request
POST /admin/users/507f1f77bcf86cd799439030/reset-password

// Response
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "email": "user@example.com",
    "tempPassword": "TempPass123456",
    "message": "Password reset. User must change password on next login."
  }
}

// Audit log entry:
{
  "action": "RESET_PASSWORD",
  "userId": "507f1f77bcf86cd799439012", // Admin
  "resourceType": "user",
  "resourceId": "507f1f77bcf86cd799439030",
  "details": { "email": "user@example.com" },
  "status": "success"
}
```

### Creating Impersonation Token

```javascript
// Request
POST /admin/users/507f1f77bcf86cd799439030/impersonate

// Response
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m",
    "userId": "507f1f77bcf86cd799439030",
    "email": "user@example.com"
  }
}

// Token contains:
{
  "id": "507f1f77bcf86cd799439030",
  "email": "user@example.com",
  "role": "user",
  "impersonatedBy": "507f1f77bcf86cd799439012",
  "isImpersonation": true
}

// Audit log entry:
{
  "action": "IMPERSONATE",
  "userId": "507f1f77bcf86cd799439012", // Admin
  "resourceType": "user",
  "resourceId": "507f1f77bcf86cd799439030",
  "details": { "email": "user@example.com" },
  "status": "success"
}
```

### Getting User Activity

```javascript
// Request
GET /admin/users/507f1f77bcf86cd799439030/activity?page=1&limit=20

// Response
{
  "status": "success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "pages": 3,
    "activity": [
      {
        "_id": "507f1f77bcf86cd799439050",
        "action": "UPDATE",
        "userId": "507f1f77bcf86cd799439030",
        "resourceType": "project",
        "resourceId": "507f1f77bcf86cd799439040",
        "details": { "name": "New Project Name" },
        "status": "success",
        "createdAt": "2024-02-04T16:00:00Z"
      },
      // ... more activity
    ]
  }
}
```

### Getting User Statistics

```javascript
// Request
GET /admin/users/stats

// Response
{
  "status": "success",
  "data": {
    "total": 250,
    "active": 240,
    "inactive": 10,
    "byRole": {
      "user": 200,
      "admin": 45,
      "moderator": 5
    }
  }
}
```

---

## Monitoring Examples

### Getting Real-Time Metrics

```javascript
// Request
GET /admin/monitoring/metrics

// Response
{
  "status": "success",
  "data": {
    "timestamp": "2024-02-04T17:30:00Z",
    "uptime": 86400,
    "cpu": {
      "loadAverage": [0.45, 0.52, 0.48],
      "cores": 8,
      "model": "Intel(R) Core(TM) i7-9700K",
      "speed": 3600
    },
    "memory": {
      "total": 16000000000,
      "free": 4000000000,
      "used": 12000000000,
      "percentUsed": "75.00",
      "process": {
        "rss": 500000000,
        "heapTotal": 300000000,
        "heapUsed": 250000000,
        "external": 20000000
      }
    },
    "node": {
      "version": "v18.14.0",
      "arch": "x64",
      "platform": "linux",
      "pid": 12345
    },
    "requests": {
      "total": 150000,
      "perMinute": 145,
      "active": 23
    }
  }
}
```

### Getting System Logs with Filters

```javascript
// Request with filters and date range
GET /admin/monitoring/logs?page=1&limit=50&action=UPDATE&status=success&resourceType=apiKey&startDate=2024-02-01&endDate=2024-02-04

// Response
{
  "status": "success",
  "data": {
    "page": 1,
    "limit": 50,
    "total": 237,
    "pages": 5,
    "logs": [
      {
        "_id": "507f1f77bcf86cd799439060",
        "action": "UPDATE",
        "userId": {
          "_id": "507f1f77bcf86cd799439012",
          "email": "admin@example.com",
          "username": "admin_user"
        },
        "resourceType": "apiKey",
        "resourceId": "507f1f77bcf86cd799439011",
        "details": {
          "originalState": { "name": "Old Name", "scope": ["read"] },
          "updatedFields": { "name": "New Name", "scope": ["read", "write"] }
        },
        "status": "success",
        "createdAt": "2024-02-04T15:30:00Z"
      },
      // ... more logs
    ]
  }
}
```

### Getting Recent Errors

```javascript
// Request
GET /admin/monitoring/errors?page=1&limit=20

// Response
{
  "status": "success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1,
    "errors": [
      {
        "_id": "507f1f77bcf86cd799439070",
        "action": "CREATE",
        "userId": {
          "_id": "507f1f77bcf86cd799439012",
          "email": "admin@example.com"
        },
        "resourceType": "apiKey",
        "details": {
          "name": "Test Key",
          "scope": ["invalid_scope"] // Invalid scope
        },
        "status": "failure",
        "errorMessage": "Invalid scope: invalid_scope",
        "createdAt": "2024-02-04T16:45:00Z"
      }
    ]
  }
}
```

### Health Check

```javascript
// Request
GET /admin/monitoring/health

// Response (200 if healthy, 503 if degraded)
{
  "status": "success",
  "data": {
    "status": "healthy",
    "timestamp": "2024-02-04T17:35:00Z",
    "uptime": 86460,
    "services": {
      "mongodb": "connected",
      "redis": "connected"
    },
    "details": {
      "mongodb": {
        "state": 1,
        "states": ["disconnected", "connected", "connecting", "disconnecting"]
      }
    }
  }
}
```

### Getting Audit Statistics

```javascript
// Request
GET /admin/monitoring/stats/audit?days=7

// Response
{
  "status": "success",
  "data": {
    "period": "Last 7 days",
    "startDate": "2024-01-28T00:00:00Z",
    "endDate": "2024-02-04T17:40:00Z",
    "stats": {
      "byAction": [
        { "_id": "CREATE", "count": 345 },
        { "_id": "UPDATE", "count": 267 },
        { "_id": "READ", "count": 1250 },
        { "_id": "DELETE", "count": 45 }
      ],
      "byStatus": [
        { "_id": "success", "count": 1897 },
        { "_id": "failure", "count": 10 },
        { "_id": "warning", "count": 5 }
      ],
      "byResourceType": [
        { "_id": "apiKey", "count": 450 },
        { "_id": "secret", "count": 380 },
        { "_id": "user", "count": 720 }
      ],
      "byDay": [
        { "_id": "2024-01-28", "count": 280 },
        { "_id": "2024-01-29", "count": 295 },
        // ... more days
      ]
    }
  }
}
```

---

## Configuration Examples

### Getting All Configuration

```javascript
// Request
GET /admin/config

// Response
{
  "status": "success",
  "data": {
    "userId": "507f1f77bcf86cd799439012",
    "_id": "507f1f77bcf86cd799439080",
    "configurations": [
      {
        "provider": "openai",
        "name": "OpenAI API",
        "apiKey": "***", // Masked
        "apiSecret": "***",
        "baseUrl": "https://api.openai.com",
        "config": { "model": "gpt-4", "timeout": 30000 },
        "active": true
      }
    ],
    "settings": {
      "maxUploadSize": 104857600,
      "enableBeta": false,
      "maintenanceMode": false
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-02-04T10:30:00Z"
  }
}
```

### Updating Configuration

```javascript
// Request
PATCH /admin/config
Content-Type: application/json

{
  "settings": {
    "maxUploadSize": 209715200,
    "enableBeta": true
  }
}

// Response
{
  "status": "success",
  "data": {
    "userId": "507f1f77bcf86cd799439012",
    "configurations": [...],
    "settings": {
      "maxUploadSize": 209715200,
      "enableBeta": true,
      "maintenanceMode": false
    }
  }
}
```

### Testing Database Connection

```javascript
// Request
POST /admin/config/test/database

// Response (200 if connected, 503 if not)
{
  "status": "success",
  "data": {
    "type": "database",
    "status": "connected",
    "healthy": true,
    "state": 1,
    "testedAt": "2024-02-04T17:45:00Z"
  }
}
```

### Exporting Configuration (Encrypted)

```javascript
// Request
GET /admin/config/export

// Response
{
  "status": "success",
  "data": {
    "encrypted": true,
    "payload": "U2FsdGVkX1dXF9KM2kP3...[long encrypted string]...==",
    "exportedAt": "2024-02-04T17:50:00Z"
  }
}

// Payload contains:
{
  "exportedAt": "2024-02-04T17:50:00Z",
  "exportedBy": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439012",
  "configurations": [...],
  "settings": {...}
}
```

### Importing Configuration (Encrypted)

```javascript
// Request
POST /admin/config/import
Content-Type: application/json

{
  "encrypted": true,
  "payload": "U2FsdGVkX1dXF9KM2kP3...[encrypted payload]...=="
}

// Response
{
  "status": "success",
  "data": {
    "userId": "507f1f77bcf86cd799439012",
    "configurations": [...],
    "settings": {...},
    "importedAt": "2024-02-04T17:55:00Z"
  }
}

// Audit log entry:
{
  "action": "IMPORT_CONFIG",
  "userId": "507f1f77bcf86cd799439012",
  "resourceType": "system",
  "status": "success"
}
```

### Getting Configuration History

```javascript
// Request
GET /admin/config/history?page=1&limit=20

// Response
{
  "status": "success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3,
    "history": [
      {
        "_id": "507f1f77bcf86cd799439090",
        "action": "UPDATE",
        "userId": {
          "_id": "507f1f77bcf86cd799439012",
          "email": "admin@example.com"
        },
        "resourceType": "system",
        "details": {
          "originalState": { "configurationsCount": 2 },
          "updatedFields": { "settings": true }
        },
        "status": "success",
        "createdAt": "2024-02-04T10:30:00Z"
      }
    ]
  }
}
```

---

## Common Patterns

### Error Response Handling

```javascript
// Client-side error handling pattern
async function handleApiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`/admin${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data.data;
  } catch (error) {
    console.error('API Error:', error.message);
    // Handle error appropriately
    return null;
  }
}
```

### Pagination Helper

```javascript
// Utility function for pagination
async function fetchPaginatedData(endpoint, filters = {}) {
  const data = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `/admin${endpoint}?page=${page}&${new URLSearchParams(filters)}`
    );
    const result = response.json();

    if (result.data?.items) {
      data.push(...result.data.items);
      hasMore = page < result.data.pages;
      page++;
    } else {
      hasMore = false;
    }
  }

  return data;
}
```

### Audit Log Tracking

```javascript
// Backend pattern for audit logging (already implemented)
async function auditAction(action, userId, resourceType, resourceId, details, status) {
  try {
    await AuditLog.logAction({
      action,
      userId,
      resourceType,
      resourceId,
      details,
      status,
      errorMessage: status === 'failure' ? details.error : undefined
    });
  } catch (error) {
    console.error('Audit log failed:', error);
    // Don't fail main operation
  }
}
```

### Encryption/Decryption Pattern

```javascript
// For secrets
import { encrypt, decrypt } from '../utils/encryption.js';

// Encrypt sensitive value
const encrypted = encrypt(sensitiveValue);

// Decrypt for use
const plainValue = decrypt(encrypted);

// Hash for comparison (no decryption needed)
const hash = hash(plainValue);
const matches = hash === storedHash;
```

### Rate Limit Checking

```javascript
// API key validation pattern (in middleware)
async function validateApiKey(plainKey) {
  const apiKey = await APIKey.validateKey(plainKey);

  if (!apiKey) {
    throw createError(401, 'Invalid or expired API key');
  }

  // Check rate limit
  const rateLimit = apiKey.getRateLimitInfo();
  // Enforce rate limit based on rateLimit.limit and rateLimit.unit

  return apiKey;
}
```

---

**End of Examples**

For more detailed implementation guidance, see:
- ADMIN_CONTROLLERS_IMPLEMENTATION_GUIDE.md
- ADMIN_CONTROLLERS_UPDATE_SUMMARY.md
