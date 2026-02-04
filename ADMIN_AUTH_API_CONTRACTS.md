# Admin Authentication & Authorization - Backend API Contracts

> **Date**: February 4, 2026  
> **Version**: 1.0  
> **Status**: Ready for Backend Implementation

---

## 📋 API Overview

All admin endpoints require:
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: `application/json`
- **HTTPS**: Required for all admin endpoints
- **Rate Limiting**: 100 requests/minute per user
- **Timeout**: 10 seconds
- **Logging**: All requests logged to audit trail

---

## 🔐 Security Headers

### Required Response Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### CORS Configuration
```javascript
CORS Configuration for Admin Endpoints:
- Allow Origin: https://yourdomain.com (production only)
- Allow Methods: GET, POST, PUT, DELETE
- Allow Headers: Content-Type, Authorization, X-App-Id
- Allow Credentials: true
- Max Age: 86400
```

---

## 📡 API Endpoints

### 1. Check Admin Status
**Endpoint**: `GET /api/user/admin-status`  
**Description**: Verify if current user is admin and fetch their role  
**Authentication**: Required (Bearer token)  
**Rate Limit**: 10/minute

**Request Headers**:
```http
Authorization: Bearer {token}
X-App-Id: {appId}
Content-Type: application/json
```

**Response (Success - 200)**:
```json
{
  "data": {
    "isAdmin": true,
    "role": "super_admin",
    "userId": "user_123",
    "email": "fernandogarzaaa@gmail.com",
    "permissions": {
      "canManageKeys": true,
      "canManageSecrets": true,
      "canManageUsers": true,
      "canManageProjects": true,
      "canViewAudit": true,
      "canChangeBilling": true,
      "canManageSystem": true,
      "canRotateKeys": true,
      "canRotateSecrets": true,
      "canViewKeyAudit": true,
      "canViewSecretAudit": true,
      "canInviteUsers": true,
      "canRemoveUsers": true,
      "canEditUserRoles": true,
      "canDeleteProjects": true,
      "canTransferProjects": true,
      "canExportAudit": true,
      "canPurgeOldAudit": true,
      "canViewBilling": true,
      "canEditBillingPlans": true,
      "canViewSystemHealth": true,
      "canAccessSystemLogs": true,
      "canManageSystemSettings": true,
      "canAccessAdminDashboard": true,
      "canViewAnalytics": true,
      "canManagePolicies": true
    },
    "sessionTimeout": 900000,
    "lastActivity": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Unauthorized - 401)**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Forbidden - 403)**:
```json
{
  "error": {
    "code": "NOT_ADMIN",
    "message": "User is not an admin",
    "userId": "user_456",
    "userRole": "user",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. Get User Permissions
**Endpoint**: `GET /api/user/permissions`  
**Description**: Fetch detailed permissions for current user  
**Authentication**: Required  
**Rate Limit**: 10/minute

**Response (Success - 200)**:
```json
{
  "data": {
    "role": "admin",
    "permissions": {
      "canManageKeys": true,
      "canRotateKeys": true,
      "canViewKeyAudit": true,
      "canManageSecrets": true,
      // ... all permissions
    },
    "roleHierarchyLevel": 3,
    "isSuperAdmin": false,
    "isAdmin": true,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3. Validate Admin Token
**Endpoint**: `POST /api/auth/validate-admin`  
**Description**: Validate if a token grants admin access  
**Authentication**: Required  
**Rate Limit**: 5/minute

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200)**:
```json
{
  "data": {
    "valid": true,
    "role": "super_admin",
    "isAdmin": true,
    "expiresAt": "2024-01-16T10:30:00Z"
  }
}
```

**Response (Invalid - 401)**:
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token is invalid or expired",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4. Log Admin Action
**Endpoint**: `POST /api/audit/admin-action`  
**Description**: Log an admin action to audit trail  
**Authentication**: Required  
**Rate Limit**: Unlimited (triggered server-side)

**Request Body**:
```json
{
  "action": "user_role_updated",
  "resource": "users",
  "details": {
    "targetUserId": "user_789",
    "oldRole": "operator",
    "newRole": "admin",
    "reason": "Promoted for special project"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response (Success - 201)**:
```json
{
  "data": {
    "auditId": "audit_12345",
    "userId": "user_123",
    "action": "user_role_updated",
    "resource": "users",
    "details": { ... },
    "timestamp": "2024-01-15T10:30:00Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "status": "success"
  }
}
```

---

### 5. Get Audit Logs
**Endpoint**: `GET /api/audit/logs`  
**Description**: Fetch audit log entries  
**Authentication**: Required (canViewAudit permission)  
**Rate Limit**: 30/minute

**Query Parameters**:
```
?limit=50          # Default: 50, Max: 500
&offset=0          # Default: 0
&startDate=2024-01-01T00:00:00Z
&endDate=2024-01-31T23:59:59Z
&userId=user_123   # Filter by user
&action=user_*     # Filter by action (wildcard support)
&resource=users    # Filter by resource
&status=success    # Filter by status (success|failure)
```

**Response (Success - 200)**:
```json
{
  "data": {
    "total": 1245,
    "limit": 50,
    "offset": 0,
    "logs": [
      {
        "auditId": "audit_12345",
        "userId": "user_123",
        "userName": "Admin User",
        "action": "user_role_updated",
        "resource": "users",
        "details": {
          "targetUserId": "user_789",
          "oldRole": "operator",
          "newRole": "admin"
        },
        "timestamp": "2024-01-15T10:30:00Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "status": "success",
        "duration": 245
      },
      // ... more logs
    ]
  }
}
```

---

### 6. Export Audit Logs
**Endpoint**: `GET /api/audit/export`  
**Description**: Export audit logs in CSV or JSON format  
**Authentication**: Required (canExportAudit permission)  
**Rate Limit**: 5/minute  
**Response Type**: File download

**Query Parameters**:
```
?format=csv                          # csv or json
&startDate=2024-01-01T00:00:00Z
&endDate=2024-01-31T23:59:59Z
&fields=auditId,userId,action,timestamp  # CSV columns
```

**Response (Success - 200)**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="audit-logs-2024-01.csv"

auditId,userId,userName,action,resource,timestamp,status
audit_12345,user_123,Admin User,user_role_updated,users,2024-01-15T10:30:00Z,success
...
```

---

### 7. List Users
**Endpoint**: `GET /api/admin/users`  
**Description**: List all users with pagination  
**Authentication**: Required (canManageUsers permission)  
**Rate Limit**: 30/minute

**Query Parameters**:
```
?limit=50
&offset=0
&role=admin        # Filter by role
&search=email      # Search by name or email
&status=active     # active|inactive|blocked
&sort=created_at   # Sort field
&order=desc        # asc|desc
```

**Response (Success - 200)**:
```json
{
  "data": {
    "total": 156,
    "limit": 50,
    "offset": 0,
    "users": [
      {
        "userId": "user_123",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "admin",
        "status": "active",
        "lastLogin": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "permissions": ["canManageKeys", "canManageSecrets"]
      },
      // ... more users
    ]
  }
}
```

---

### 8. Get User Details
**Endpoint**: `GET /api/admin/users/:userId`  
**Description**: Get detailed information about a specific user  
**Authentication**: Required (canManageUsers permission)  
**Rate Limit**: 60/minute

**Response (Success - 200)**:
```json
{
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "status": "active",
    "lastLogin": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T09:00:00Z",
    "permissions": [...],
    "sessions": [
      {
        "sessionId": "session_abc",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-15T10:00:00Z",
        "lastActivity": "2024-01-15T10:30:00Z"
      }
    ],
    "loginAttempts": 0,
    "failedAttempts": 0,
    "twoFactorEnabled": true
  }
}
```

---

### 9. Update User Role
**Endpoint**: `PUT /api/admin/users/:userId/role`  
**Description**: Change user's role  
**Authentication**: Required (canEditUserRoles permission)  
**Rate Limit**: 20/minute

**Request Body**:
```json
{
  "role": "operator",
  "reason": "Downgrade to operator role"
}
```

**Response (Success - 200)**:
```json
{
  "data": {
    "userId": "user_123",
    "previousRole": "admin",
    "newRole": "operator",
    "changedBy": "user_456",
    "changedAt": "2024-01-15T10:30:00Z",
    "auditId": "audit_12345"
  }
}
```

---

### 10. Remove User
**Endpoint**: `DELETE /api/admin/users/:userId`  
**Description**: Remove a user from the system  
**Authentication**: Required (canRemoveUsers permission, super_admin only)  
**Rate Limit**: 10/minute

**Response (Success - 200)**:
```json
{
  "data": {
    "userId": "user_123",
    "removed": true,
    "removedAt": "2024-01-15T10:30:00Z",
    "removedBy": "user_456",
    "auditId": "audit_12345"
  }
}
```

---

### 11. Manage API Keys
**Endpoint**: `GET /api/admin/keys`  
**Description**: List all API keys  
**Authentication**: Required (canManageKeys permission)  
**Rate Limit**: 30/minute

**Response (Success - 200)**:
```json
{
  "data": {
    "total": 42,
    "keys": [
      {
        "keyId": "key_123",
        "keyName": "Production API Key",
        "createdBy": "user_456",
        "createdAt": "2024-01-01T00:00:00Z",
        "lastUsed": "2024-01-15T10:30:00Z",
        "status": "active",
        "expiresAt": null,
        "permissions": ["read", "write"]
      },
      // ... more keys
    ]
  }
}
```

---

### 12. Rotate API Key
**Endpoint**: `POST /api/admin/keys/:keyId/rotate`  
**Description**: Generate new API key and invalidate old one  
**Authentication**: Required (canRotateKeys permission)  
**Rate Limit**: 10/minute

**Response (Success - 200)**:
```json
{
  "data": {
    "keyId": "key_123",
    "oldKey": "[redacted]",
    "newKey": "sk_live_ABC123DEF456...",
    "rotatedAt": "2024-01-15T10:30:00Z",
    "rotatedBy": "user_456",
    "oldKeyInvalidatedAt": "2024-01-15T10:30:00Z",
    "auditId": "audit_12345"
  }
}
```

---

### 13. Get System Health
**Endpoint**: `GET /api/admin/system/health`  
**Description**: Get system health status  
**Authentication**: Required (canViewSystemHealth permission)  
**Rate Limit**: 60/minute (can be called frequently)

**Response (Success - 200)**:
```json
{
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 12,
        "lastCheck": "2024-01-15T10:30:00Z"
      },
      "cache": {
        "status": "healthy",
        "hitRate": 0.92,
        "lastCheck": "2024-01-15T10:30:00Z"
      },
      "queue": {
        "status": "healthy",
        "processingTime": 234,
        "pendingJobs": 5
      },
      "api": {
        "status": "healthy",
        "responseTime": 45,
        "errorRate": 0.001
      }
    },
    "uptime": 2592000,
    "memory": {
      "used": 2048,
      "available": 8192,
      "percentage": 25
    },
    "disk": {
      "used": 50,
      "available": 200,
      "percentage": 25
    }
  }
}
```

---

### 14. Get System Analytics
**Endpoint**: `GET /api/admin/system/analytics`  
**Description**: Get system analytics and metrics  
**Authentication**: Required (canViewAnalytics permission)  
**Rate Limit**: 30/minute

**Query Parameters**:
```
?timeRange=24h      # 1h|6h|24h|7d|30d
&metrics=requests,errors,latency
```

**Response (Success - 200)**:
```json
{
  "data": {
    "timeRange": "24h",
    "startTime": "2024-01-14T10:30:00Z",
    "endTime": "2024-01-15T10:30:00Z",
    "metrics": {
      "requests": {
        "total": 50000,
        "average": 2083,
        "peak": 5234,
        "trend": "stable"
      },
      "errors": {
        "total": 50,
        "rate": 0.001,
        "topErrors": [
          { "code": "TIMEOUT", "count": 23 },
          { "code": "AUTH_FAILED", "count": 15 }
        ]
      },
      "latency": {
        "p50": 45,
        "p95": 234,
        "p99": 567
      },
      "users": {
        "active": 234,
        "newToday": 12,
        "returning": 222
      }
    }
  }
}
```

---

## 🔄 Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional context"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes
| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_ADMIN` | 403 | User is not an admin |
| `INVALID_ROLE` | 400 | Invalid role specified |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `INVALID_REQUEST` | 400 | Malformed request |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing required permission |

---

## 🔒 Security Best Practices

### For Backend Developers

1. **Defense-in-Depth**
   - Always check both email AND backend role
   - Don't rely on frontend checks alone
   - Validate all permissions server-side

2. **Audit Logging**
   - Log every admin action
   - Include user, action, resource, and result
   - Use immutable audit log storage
   - Retain logs for minimum 90 days

3. **Rate Limiting**
   - Implement per-user rate limits
   - Use exponential backoff on failures
   - Lock account after 5 failed attempts
   - Monitor for brute force attacks

4. **Session Management**
   - Expire sessions after 15 min inactivity (admin)
   - Expire sessions after 30 days (regular)
   - Store session ID securely
   - Invalidate on password change

5. **Token Security**
   - Use HTTPS for all requests
   - Sign tokens with strong algorithm (RS256)
   - Include expiration in token
   - Rotate tokens periodically

---

## 📊 Audit Log Fields

Every admin action must include:

```json
{
  "auditId": "audit_unique_id",
  "userId": "user_123",
  "userName": "Admin User",
  "email": "admin@example.com",
  "action": "user_role_updated",
  "resource": "users",
  "resourceId": "user_789",
  "details": {
    "targetUserId": "user_789",
    "oldRole": "operator",
    "newRole": "admin",
    "reason": "Promoted for special project"
  },
  "status": "success",
  "errorMessage": null,
  "timestamp": "2024-01-15T10:30:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "duration": 245
}
```

---

## 🧪 Testing Endpoints

### Test Data Setup
```bash
# Create test admin user
POST /api/admin/users
{
  "email": "fernandogarzaaa@gmail.com",
  "role": "super_admin"
}

# Create test operator
POST /api/admin/users
{
  "email": "operator@example.com",
  "role": "operator"
}
```

### Test Scenarios
1. Login as non-admin, try to access admin endpoint → 403
2. Login as admin, access permitted endpoints → 200
3. Update admin role to user, try admin endpoint → 403
4. Verify all actions logged to audit trail
5. Verify rate limiting works
6. Verify error responses formatted correctly

---

## 📝 Implementation Checklist

- [ ] All endpoints implemented
- [ ] All permissions checked
- [ ] Audit logging added
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Security headers added
- [ ] CORS configured
- [ ] JWT validation implemented
- [ ] Role hierarchy enforced
- [ ] Tests written for all scenarios
- [ ] Documentation complete
- [ ] Load testing performed
- [ ] Security review completed
