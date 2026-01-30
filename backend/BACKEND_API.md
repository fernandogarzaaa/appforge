# AppForge Backend API Documentation

## Overview

AppForge backend provides a comprehensive REST API and WebSocket server for enterprise-grade team management, permissions, and real-time collaboration.

## Architecture

```
backend/
├── src/
│   ├── server.js              # Main Express app with WebSocket integration
│   ├── routes/                # API route definitions
│   │   ├── teamRoutes.js      # Team management endpoints
│   │   ├── permissionRoutes.js # Permission management endpoints
│   │   ├── authRoutes.js       # Authentication endpoints
│   │   ├── userRoutes.js       # User management endpoints
│   │   ├── quantumRoutes.js    # Quantum computing endpoints
│   │   ├── collaborationRoutes.js # Collaboration endpoints
│   │   └── securityRoutes.js   # Security endpoints
│   ├── controllers/            # Business logic
│   │   ├── teamController.js   # Team operations
│   │   └── permissionController.js # Permission operations
│   ├── models/                 # MongoDB schemas
│   │   ├── Team.js             # Team schema with members
│   │   ├── Permission.js       # Permission schema with TTL
│   │   └── AuditLog.js         # Audit trail schema
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             # JWT authentication
│   │   ├── validation.js       # Request validation
│   │   ├── errorHandler.js     # Error handling
│   │   └── rateLimiter.js      # Rate limiting
│   ├── validators/             # Joi schemas
│   │   └── schemas.js          # Validation schemas
│   ├── utils/                  # Utility functions
│   │   └── auditLogger.js      # Audit logging utilities
│   └── websocket/              # Real-time features
│       └── index.js            # WebSocket server
```

## Features

### ✅ Team Management
- Create, read, update, delete teams
- Add/remove team members
- Update member roles (owner, admin, member, viewer)
- Transfer team ownership
- Team settings (public/private, member invites, approval required)
- Automatic member count tracking

### ✅ Permission System
- Fine-grained permissions (read, create, update, delete, execute, manage, admin)
- Resource-level permissions (project, team, deployment, apiKey, environment, quantum, collaboration)
- Grant/revoke permissions
- Check user permissions
- Permission expiration with automatic cleanup
- User and resource permission queries

### ✅ Audit Logging
- Comprehensive audit trail for all mutations
- Automatic IP address and user-agent capture
- 90-day TTL for compliance
- Query by user, resource, action, or date range
- Status tracking (success/failure/warning)

### ✅ Real-time Collaboration (WebSocket)
- User presence tracking (online/offline/away)
- Room-based collaboration
- Live cursor positions
- Text selection synchronization
- Collaborative text editing
- File locking/unlocking
- Typing indicators
- Room member management

### ✅ Security
- JWT authentication
- Role-based authorization
- Request validation with Joi
- Input sanitization (XSS, SQL injection prevention)
- Rate limiting
- Helmet security headers
- CORS configuration

## API Endpoints

### Team Management

#### GET /api/teams
Get all teams for authenticated user.
```json
Response: [
  {
    "id": "team_id",
    "name": "Engineering Team",
    "description": "Core engineering team",
    "owner": { "id": "user_id", "name": "John Doe", "email": "john@example.com" },
    "memberCount": 5,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

#### GET /api/teams/:id
Get team by ID with members.
```json
Response: {
  "id": "team_id",
  "name": "Engineering Team",
  "description": "Core engineering team",
  "owner": { "id": "user_id", "name": "John Doe" },
  "members": [
    {
      "user": { "id": "user_id", "name": "Jane Smith", "email": "jane@example.com" },
      "role": "admin",
      "joinedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "settings": {
    "isPublic": false,
    "allowMemberInvites": true,
    "requireApproval": true,
    "maxMembers": 50
  },
  "stats": {
    "totalMembers": 5,
    "activeMembers": 4
  }
}
```

#### POST /api/teams
Create a new team.
```json
Request: {
  "name": "Engineering Team",
  "description": "Core engineering team",
  "settings": {
    "isPublic": false,
    "allowMemberInvites": true,
    "requireApproval": true,
    "maxMembers": 50
  }
}

Response: {
  "id": "team_id",
  "name": "Engineering Team",
  "owner": "user_id",
  "members": [{ "user": "user_id", "role": "owner" }]
}
```

#### PUT /api/teams/:id
Update team (admin/owner only).
```json
Request: {
  "name": "Updated Team Name",
  "description": "Updated description",
  "settings": { "isPublic": true }
}
```

#### DELETE /api/teams/:id
Delete team (owner only).

#### GET /api/teams/:id/members
Get team members.

#### POST /api/teams/:id/members
Add team member (admin/owner only).
```json
Request: {
  "userId": "user_id",
  "role": "member"
}
```

#### DELETE /api/teams/:id/members/:userId
Remove team member (admin/owner only).

#### PATCH /api/teams/:id/members/:userId
Update member role (admin/owner only).
```json
Request: {
  "role": "admin"
}
```

#### POST /api/teams/:id/transfer-ownership
Transfer team ownership (owner only).
```json
Request: {
  "newOwnerId": "user_id"
}
```

### Permission Management

#### GET /api/permissions
Get all permissions for authenticated user.
```json
Response: [
  {
    "id": "permission_id",
    "action": "admin",
    "resourceType": "team",
    "resourceId": "team_id",
    "grantedBy": { "id": "user_id", "name": "John Doe" },
    "expiresAt": "2024-12-31T23:59:59Z",
    "isActive": true
  }
]
```

#### GET /api/permissions/resource/:resourceType/:resourceId
Get permissions for a specific resource.

#### GET /api/permissions/user/:userId
Get permissions for a specific user (admin/owner only).

#### POST /api/permissions/check
Check if user has permission.
```json
Request: {
  "userId": "user_id",
  "action": "update",
  "resourceType": "project",
  "resourceId": "project_id"
}

Response: {
  "hasPermission": true,
  "permission": { ... }
}
```

#### POST /api/permissions/grant
Grant permission to user (admin/owner only).
```json
Request: {
  "userId": "user_id",
  "action": "update",
  "resourceType": "project",
  "resourceId": "project_id",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### DELETE /api/permissions/revoke
Revoke permission (admin/owner only).
```json
Request: {
  "userId": "user_id",
  "action": "update",
  "resourceType": "project",
  "resourceId": "project_id"
}
```

### Audit Logging

Audit logs are automatically created for all mutations. Query via utility functions:

```javascript
import { getUserAuditLogs, getResourceAuditLogs, getAuditLogsByAction } from './utils/auditLogger.js';

// Get user activity
const userLogs = await getUserAuditLogs(userId, 100);

// Get resource history
const resourceLogs = await getResourceAuditLogs('team', teamId, 50);

// Get specific action logs
const actionLogs = await getAuditLogsByAction('team.create', startDate, endDate);
```

## WebSocket Events

### Client to Server

#### connect
Authenticate and connect to WebSocket server.
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'JWT_TOKEN' }
});
```

#### join-room
Join a collaboration room.
```javascript
socket.emit('join-room', {
  roomId: 'project_123',
  resourceType: 'project',
  resourceId: 'project_123'
});
```

#### leave-room
Leave a collaboration room.
```javascript
socket.emit('leave-room', { roomId: 'project_123' });
```

#### cursor-move
Send cursor position.
```javascript
socket.emit('cursor-move', {
  roomId: 'project_123',
  position: { line: 10, column: 5 },
  file: 'src/app.js'
});
```

#### selection-change
Send text selection.
```javascript
socket.emit('selection-change', {
  roomId: 'project_123',
  selection: { start: { line: 10, col: 0 }, end: { line: 12, col: 10 } },
  file: 'src/app.js'
});
```

#### text-change
Send text changes for collaborative editing.
```javascript
socket.emit('text-change', {
  roomId: 'project_123',
  changes: [{ insert: 'hello', position: { line: 10, col: 0 } }],
  version: 5,
  file: 'src/app.js'
});
```

#### file-lock
Lock a file for editing.
```javascript
socket.emit('file-lock', {
  roomId: 'project_123',
  fileId: 'file_456',
  fileName: 'src/app.js'
});
```

#### file-unlock
Unlock a file.
```javascript
socket.emit('file-unlock', {
  roomId: 'project_123',
  fileId: 'file_456'
});
```

#### typing
Send typing indicator.
```javascript
socket.emit('typing', {
  roomId: 'project_123',
  isTyping: true,
  file: 'src/app.js'
});
```

#### presence-update
Update presence status.
```javascript
socket.emit('presence-update', { status: 'away' });
```

### Server to Client

#### user-joined
User joined the room.
```javascript
socket.on('user-joined', (data) => {
  console.log(`${data.name} joined`);
});
```

#### user-left
User left the room.
```javascript
socket.on('user-left', (data) => {
  console.log(`${data.name} left`);
});
```

#### room-users
Current users in the room.
```javascript
socket.on('room-users', (users) => {
  console.log('Room users:', users);
});
```

#### cursor-update
Cursor position update from another user.
```javascript
socket.on('cursor-update', (data) => {
  updateCursor(data.userId, data.position);
});
```

#### selection-update
Selection update from another user.
```javascript
socket.on('selection-update', (data) => {
  highlightSelection(data.userId, data.selection);
});
```

#### text-update
Text change from another user.
```javascript
socket.on('text-update', (data) => {
  applyChanges(data.changes, data.version);
});
```

#### file-locked
File was locked by another user.
```javascript
socket.on('file-locked', (data) => {
  showLockedIndicator(data.fileId, data.name);
});
```

#### file-unlocked
File was unlocked.
```javascript
socket.on('file-unlocked', (data) => {
  hideLockedIndicator(data.fileId);
});
```

#### typing-update
Typing indicator from another user.
```javascript
socket.on('typing-update', (data) => {
  showTypingIndicator(data.userId, data.isTyping);
});
```

#### presence-update
User presence status changed.
```javascript
socket.on('presence-update', (data) => {
  updateUserPresence(data.userId, data.status);
});
```

#### presence-list
List of all user presence statuses.
```javascript
socket.on('presence-list', (presenceList) => {
  presenceList.forEach(({ userId, status }) => {
    updateUserPresence(userId, status);
  });
});
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/appforge

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Schemas

### Team Model
```javascript
{
  name: String (required, unique),
  description: String,
  owner: ObjectId (ref: User, required),
  members: [{
    user: ObjectId (ref: User),
    role: String (owner/admin/member/viewer),
    joinedAt: Date,
    permissions: [String]
  }],
  settings: {
    isPublic: Boolean,
    allowMemberInvites: Boolean,
    requireApproval: Boolean,
    maxMembers: Number
  },
  stats: {
    totalMembers: Number,
    activeMembers: Number
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Permission Model
```javascript
{
  user: ObjectId (ref: User, required),
  action: String (read/create/update/delete/execute/manage/admin, required),
  resourceType: String (project/team/deployment/apiKey/environment/quantum/collaboration, required),
  resourceId: String (required),
  grantedBy: ObjectId (ref: User, required),
  expiresAt: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### AuditLog Model
```javascript
{
  action: String (required),
  userId: ObjectId (ref: User),
  resourceType: String,
  resourceId: String,
  details: Mixed,
  ipAddress: String,
  userAgent: String,
  status: String (success/failure/warning),
  errorMessage: String,
  metadata: Mixed,
  createdAt: Date (auto-deleted after 90 days)
}
```

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Install Socket.io:
```bash
npm install socket.io
```

3. Set up environment variables (see above)

4. Start MongoDB:
```bash
mongod
```

5. Start the server:
```bash
npm run dev
```

The server will start on `http://localhost:5000` with WebSocket support.

## Testing

Run backend tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Security Best Practices

1. **Authentication**: All API routes (except health checks) require JWT authentication
2. **Authorization**: Role-based access control for team and permission operations
3. **Input Validation**: All requests validated with Joi schemas
4. **Input Sanitization**: XSS and SQL injection prevention on all inputs
5. **Rate Limiting**: API rate limiting to prevent abuse
6. **Audit Logging**: Comprehensive audit trail for compliance
7. **Permission Expiration**: Automatic cleanup of expired permissions
8. **CORS**: Configured for trusted frontend origins only
9. **Helmet**: Security headers for common vulnerabilities
10. **Compression**: Response compression for performance

## Performance Optimizations

1. **Database Indexes**: 
   - Team: owner, members.user, text search
   - Permission: compound index (user+resourceType+resourceId+action)
   - AuditLog: userId+createdAt, resourceType+resourceId, action+createdAt

2. **Query Optimization**:
   - Population of user references
   - Selective field projection
   - Limit and pagination support

3. **Caching**:
   - In-memory user/room tracking for WebSocket
   - Permission checks cached per request

4. **TTL Indexes**:
   - AuditLog: 90-day automatic cleanup
   - Permission: Expiration-based cleanup

## License

MIT
