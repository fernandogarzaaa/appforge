# API Key Rotation Setup Guide

## Overview

AppForge includes an automated API key rotation system that enhances security by regularly rotating API keys and providing advance notice to users.

## Features

- ✅ **Automated Rotation**: Keys automatically rotate on a configurable schedule (default: 90 days)
- ✅ **Grace Period**: Old keys remain valid for 7 days after rotation for seamless transitions
- ✅ **Advance Warnings**: Users receive notifications 14 days before rotation
- ✅ **Rotation Dashboard**: Track rotation status and upcoming rotations
- ✅ **Cleanup**: Automatically removes expired keys after grace period
- ✅ **Background Scheduler**: 24-hour cron job ensures continuous operation

## Configuration

### Environment Variables

```bash
# API Key Rotation Configuration (optional)
API_KEY_ROTATION_DAYS=90        # Rotation interval in days (default: 90)
API_KEY_GRACE_PERIOD_DAYS=7     # Grace period after rotation (default: 7)
API_KEY_WARNING_DAYS=14          # Days before rotation to warn users (default: 14)
API_KEY_CLEANUP_ENABLED=true     # Enable automatic cleanup (default: true)
```

Add these to your `.env` file:

```bash
# .env
API_KEY_ROTATION_DAYS=90
API_KEY_GRACE_PERIOD_DAYS=7
API_KEY_WARNING_DAYS=14
```

## Getting Started

### 1. Initialize Rotation Service

The rotation service initializes automatically on server startup:

```bash
npm run rotation:init
```

This will:
- ✅ Set up the 24-hour rotation scheduler
- ✅ Enable automatic cleanup jobs
- ✅ Prepare notification system

### 2. API Key Endpoints

#### Generate New API Key

```bash
POST /api/keys/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Production API Key",
  "scopes": ["read:projects", "write:deployments"]
}

# Response
{
  "id": "key_123abc",
  "name": "Production API Key",
  "key": "ak_prod_xxxxxxxxxxxxxxxx",  # Only shown once!
  "scopes": ["read:projects", "write:deployments"],
  "createdAt": "2026-02-03T10:00:00Z",
  "expiresAt": null,
  "status": "active"
}
```

#### Get Rotation Status

```bash
GET /api/keys/rotation-status
Authorization: Bearer <jwt_token>

# Response
{
  "userId": "user_123",
  "keys": [
    {
      "id": "key_123",
      "name": "Production API Key",
      "status": "active",
      "createdAt": "2025-08-03T10:00:00Z",
      "rotatesAt": "2026-02-03T10:00:00Z",
      "daysUntilRotation": 2,
      "warningsSent": 1
    },
    {
      "id": "key_456",
      "name": "Staging API Key",
      "status": "deprecated",
      "replacedBy": "key_789",
      "expiresAt": "2026-02-10T10:00:00Z",
      "daysUntilExpiry": 7
    }
  ],
  "nextRotation": "2026-02-04T00:00:00Z",
  "rotationStats": {
    "activeKeys": 1,
    "deprecatedKeys": 1,
    "expiredKeys": 0
  }
}
```

#### Manually Rotate a Key

```bash
POST /api/keys/:id/rotate
Authorization: Bearer <jwt_token>

# Response
{
  "oldKeyId": "key_123",
  "newKeyId": "key_456",
  "newKey": "ak_prod_yyyyyyyyyyyyyyyy",
  "replacementStartsAt": "2026-02-03T10:00:00Z",
  "oldKeyExpiresAt": "2026-02-10T10:00:00Z",
  "message": "Key rotated successfully. Old key remains valid for 7 days."
}
```

## Best Practices

### 1. Store Keys Securely

Never commit API keys to version control:

```bash
# Good ✅
API_KEY=ak_prod_xxxxxxx  # In .env (git-ignored)
API_KEY=$(aws secretsmanager get-secret-value --secret-id appforge-api-key)  # From secrets manager

# Bad ❌
const API_KEY = "ak_prod_xxxxxxx";  // Hardcoded in source
```

### 2. Use Multiple Keys

Create separate keys for different purposes:

```javascript
// Development
const DEV_KEY = process.env.DEV_API_KEY;

// Production
const PROD_KEY = process.env.PROD_API_KEY;

// CI/CD
const CI_KEY = process.env.CI_API_KEY;
```

### 3. Monitor Rotation Schedule

Track upcoming rotations:

```javascript
import { getRotationStatus } from './services/apiKeyRotation.js';

const status = await getRotationStatus(userId);
status.keys.forEach(key => {
  if (key.daysUntilRotation < 14) {
    console.warn(`⚠️ Key "${key.name}" rotates in ${key.daysUntilRotation} days`);
  }
});
```

### 4. Handle Deprecation Gracefully

Support both old and new keys during grace period:

```javascript
// During grace period: accept both old_key and new_key
const validKeys = [oldKey, newKey];
const isValid = validKeys.includes(providedKey);

// After grace period: only accept new key
const isValid = newKey === providedKey;
```

## Rotation Workflow

```
Day 1: Key Created
  └─ Schedule rotation for Day 91

Day 77: Warning Notification Sent (14 days before)
  ├─ Email sent to user
  ├─ Dashboard notification created
  └─ Rotation status updated

Day 88: Grace Period Starts
  ├─ New key generated
  ├─ Old key marked as "deprecated"
  └─ Both keys remain valid

Day 88-95: Grace Period Active
  ├─ Old key still works for backward compatibility
  ├─ New key is primary
  └─ Users have 7 days to migrate

Day 95: Grace Period Expires
  ├─ Old key revoked/disabled
  ├─ Only new key works
  └─ Cleanup job removes expired key records

Day 188: Next Rotation Scheduled
  └─ Cycle repeats
```

## Notifications

### Email Template

Users receive notifications at different stages:

**14 Days Before Rotation:**
```
Subject: Your API Key will rotate in 14 days

Your API key "Production API Key" (ak_prod_...) will be rotated on Feb 3, 2026.

A new key will be generated automatically. Your old key will continue to work for 7 days after rotation.

What you need to do:
1. Update your applications with the new key when it's available
2. Test thoroughly to ensure seamless transition
3. Remove old key from your systems after 7 days

Questions? Visit: https://docs.appforge.dev/api-key-rotation
```

**On Rotation Day:**
```
Subject: Your API Key has been rotated

Your API key "Production API Key" has been rotated.

Old Key Status: Deprecated (valid until Feb 10, 2026)
New Key Status: Active

Update your applications immediately. Your new key is available in your API settings.
```

**Grace Period Expiring:**
```
Subject: Old API Key expires tomorrow

Your deprecated API key "Production API Key" expires tomorrow (Feb 10, 2026).

After this date, applications using the old key will stop working.

Please ensure all applications have been updated to use the new key.
```

## Troubleshooting

### Key Rotation Failed

```bash
# Check rotation status
curl -H "Authorization: Bearer $JWT" \
  https://api.appforge.dev/api/keys/rotation-status

# Manually trigger rotation for specific key
curl -X POST -H "Authorization: Bearer $JWT" \
  https://api.appforge.dev/api/keys/key_123/rotate
```

### Grace Period Issues

If an application still uses old key after grace period:

```bash
# Extend grace period temporarily
# In .env:
API_KEY_GRACE_PERIOD_DAYS=14  # Increased from 7

# Restart server
npm run dev
```

### Notification Not Sent

```bash
# Check rotation scheduler status
curl -H "Authorization: Bearer $JWT" \
  https://api.appforge.dev/api/keys/rotation-status

# Check logs
tail -f logs/rotation.log

# Verify notification service is configured
# In backend/.env:
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_WEBHOOK_ENABLED=true
```

## API Reference

### Core Functions

```javascript
import {
  generateApiKey,           // Create new API key
  rotateApiKey,            // Rotate specific key
  autoRotateExpiringKeys,  // Batch rotate due keys
  getRotationStatus,       // Check rotation info
  sendRotationWarnings,    // Send notifications
  cleanupExpiredKeys,      // Remove expired keys
  initializeRotationScheduler // Start scheduler
} from './services/apiKeyRotation.js';
```

### Database Schema

```javascript
// API Key document
{
  _id: ObjectId,
  userId: "user_123",
  name: "Production API Key",
  keyHash: "sha256...",      // Hashed for security
  scopes: ["read:projects"],
  status: "active|deprecated|revoked",
  createdAt: Date,
  expiresAt: Date || null,
  rotatesAt: Date,
  replacedBy: "key_456" || null,  // When rotated
  lastUsedAt: Date || null,
  warningsSent: 0,
  metadata: {
    ipWhitelist: ["10.0.0.1"],
    userAgent: "curl/7.64.1"
  }
}
```

## Integration Examples

### Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.appforge.dev',
  headers: {
    'X-API-Key': process.env.APPFORGE_API_KEY
  }
});

// Check if rotation is coming
async function checkUpcomingRotation() {
  try {
    const response = await client.get('/api/keys/rotation-status');
    const { keys } = response.data;
    
    keys.forEach(key => {
      if (key.status === 'active' && key.daysUntilRotation < 7) {
        console.warn(`⚠️ ${key.name} rotates in ${key.daysUntilRotation} days`);
      }
    });
  } catch (error) {
    console.error('Failed to check rotation status:', error.message);
  }
}
```

### Python

```python
import requests
import os

class AppForgeClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('APPFORGE_API_KEY')
        self.base_url = 'https://api.appforge.dev'
        self.headers = {'X-API-Key': self.api_key}
    
    def check_rotation_status(self):
        """Check upcoming key rotations"""
        response = requests.get(
            f'{self.base_url}/api/keys/rotation-status',
            headers=self.headers
        )
        return response.json()
    
    def rotate_key(self, key_id):
        """Manually rotate a key"""
        response = requests.post(
            f'{self.base_url}/api/keys/{key_id}/rotate',
            headers=self.headers
        )
        return response.json()

# Usage
client = AppForgeClient()
status = client.check_rotation_status()
print(f"Active keys: {status['rotationStats']['activeKeys']}")
```

## Support

- **Documentation**: https://docs.appforge.dev/api-key-rotation
- **Issues**: https://github.com/fernandogarzaaa/appforge/issues
- **Email**: security@appforge.dev

---

**Last Updated**: February 3, 2026
