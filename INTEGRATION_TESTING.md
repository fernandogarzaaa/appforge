# Backend Integration Testing Guide

Complete guide for testing AppForge backend API and frontend integration.

## 🚀 Quick Start

### Prerequisites

You have 2 options:

**Option A: Use Cloud Databases (Recommended - No Installation)**
- MongoDB Atlas (free tier)
- Supabase PostgreSQL (free tier)
- Upstash Redis (optional)

**Option B: Install Local Databases**
- MongoDB 7+
- PostgreSQL 16+
- Redis 7+ (optional)
- Docker Desktop (easiest for all 3)

---

## Option A: Cloud Databases Setup (5 minutes)

### 1. MongoDB Atlas (Free)

```
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create account
3. Create free M0 cluster
4. Create database user
5. Whitelist your IP (or allow from anywhere: 0.0.0.0/0)
6. Get connection string:
   mongodb+srv://username:password@cluster.mongodb.net/appforge?retryWrites=true&w=majority
```

### 2. Supabase PostgreSQL (Free)

```
1. Go to https://supabase.com/dashboard
2. Create account
3. Create new project
4. Go to Settings > Database
5. Note connection details:
   Host: db.xxxxx.supabase.co
   Database: postgres
   Port: 5432
   User: postgres
   Password: [your password]
```

### 3. Update Backend .env

```env
# backend/.env

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/appforge

# Supabase PostgreSQL
POSTGRES_HOST=db.xxxxx.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_supabase_password

# Redis (optional - comment out if not using)
# REDIS_HOST=redis-xxxxx.upstash.io
# REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password
```

---

## Option B: Docker Desktop (All-in-One)

### Install Docker Desktop

```
1. Download: https://www.docker.com/products/docker-desktop
2. Install and restart computer
3. Start Docker Desktop
4. Wait for Docker engine to start
```

### Start Full Stack

```powershell
cd backend
docker compose up -d

# Wait 30 seconds for services to initialize

# Check services
docker compose ps

# Expected output:
# NAME                IMAGE           STATUS
# backend-backend     ...             Up (healthy)
# backend-mongodb     mongo:7         Up (healthy)
# backend-postgres    postgres:16     Up (healthy)
# backend-redis       redis:7         Up (healthy)
# backend-nginx       nginx:alpine    Up (healthy)
# backend-frontend    node:18         Up
```

---

## Start Backend Server

### 1. Install Dependencies

```powershell
cd backend
npm install
```

### 2. Run Database Migrations

```powershell
npm run migrate
```

**Expected output:**
```
🚀 Starting database migrations...
Connected to MongoDB for migration
✅ Created collection: projects
✅ Created collection: entities
✅ Created collection: pages
✅ MongoDB indexes created
MongoDB migration complete
Connected to PostgreSQL for migration
✅ PostgreSQL schema created
PostgreSQL migration complete
🎉 All migrations completed successfully
```

### 3. Start Backend

```powershell
npm run dev
```

**Expected output:**
```
[2026-02-01 10:00:00] INFO: Starting AppForge backend...
[2026-02-01 10:00:01] INFO: MongoDB connected successfully
[2026-02-01 10:00:01] INFO: PostgreSQL connected successfully
[2026-02-01 10:00:01] INFO: Redis connected successfully
[2026-02-01 10:00:02] INFO: ✅ API Server listening on http://localhost:5000
[2026-02-01 10:00:02] INFO: ✅ WebSocket Server listening on http://localhost:5001
```

---

## Test Backend API

### Health Check

```powershell
# PowerShell
Invoke-RestMethod -Uri http://localhost:5000/health

# Or use curl (if installed)
curl http://localhost:5000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-01T10:00:00.000Z",
  "uptime": 3600,
  "services": {
    "mongodb": "connected",
    "postgres": "connected",
    "redis": "connected"
  }
}
```

### Test Authentication

**1. Register User**

```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/auth/register `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**2. Login**

```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Save token for next requests
$token = $response.token
Write-Host "Token: $token"
```

**3. Get Profile**

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/auth/me `
  -Headers @{Authorization="Bearer $token"}
```

### Test Projects

**1. Create Project**

```powershell
$body = @{
    name = "Test Restaurant"
    description = "My test project"
    type = "restaurant"
    features = @("menu", "orders", "reservations")
} | ConvertTo-Json

$project = Invoke-RestMethod -Uri http://localhost:5000/api/projects `
  -Method POST `
  -Headers @{
      Authorization="Bearer $token"
      "Content-Type"="application/json"
  } `
  -Body $body

Write-Host "Project ID: $($project.project.id)"
```

**2. Get Projects**

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/projects `
  -Headers @{Authorization="Bearer $token"}
```

**3. Get Single Project**

```powershell
$projectId = $project.project.id

Invoke-RestMethod -Uri "http://localhost:5000/api/projects/$projectId" `
  -Headers @{Authorization="Bearer $token"}
```

### Test Entities

**1. Create Entity**

```powershell
$body = @{
    projectId = $projectId
    name = "MenuItem"
    schema = @{
        name = @{ type = "string"; required = $true }
        price = @{ type = "number"; required = $true }
        description = @{ type = "string" }
        category = @{ type = "string" }
    }
} | ConvertTo-Json -Depth 5

$entity = Invoke-RestMethod -Uri http://localhost:5000/api/entities `
  -Method POST `
  -Headers @{
      Authorization="Bearer $token"
      "Content-Type"="application/json"
  } `
  -Body $body
```

**2. Get Entities**

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/entities?projectId=$projectId" `
  -Headers @{Authorization="Bearer $token"}
```

---

## Start Frontend

### 1. Install Dependencies

```powershell
cd ..  # Back to root
npm install
```

### 2. Configure Environment

Create `.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5001
VITE_WS_AUTO_CONNECT=true
VITE_DEBUG_MODE=true
```

### 3. Start Frontend

```powershell
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 4. Open Browser

```
1. Open http://localhost:5173
2. Open browser console (F12)
3. Check for initialization message:
   [AppForge] API services initialized {
     apiUrl: 'http://localhost:5000/api',
     wsUrl: 'http://localhost:5001'
   }
```

---

## Integration Testing Checklist

### ✅ Backend Tests

- [ ] Health check returns healthy status
- [ ] MongoDB connection successful
- [ ] PostgreSQL connection successful
- [ ] User registration works
- [ ] User login works
- [ ] JWT token is returned
- [ ] Protected endpoints require authentication
- [ ] Project creation works
- [ ] Project retrieval works
- [ ] Entity creation works
- [ ] Entity retrieval works

### ✅ Frontend Tests

- [ ] Frontend loads at http://localhost:5173
- [ ] API services initialize correctly
- [ ] Registration form submits to backend
- [ ] Login form submits to backend
- [ ] JWT token stored in localStorage
- [ ] Protected routes check authentication
- [ ] Project creation sends to backend
- [ ] Projects list loads from backend
- [ ] Entity creation sends to backend
- [ ] Entities list loads from backend

### ✅ WebSocket Tests

- [ ] WebSocket connects to port 5001
- [ ] Authentication via JWT token works
- [ ] Join room event works
- [ ] Cursor tracking works
- [ ] Presence updates work
- [ ] User joined/left events work

---

## Test WebSocket in Browser

```javascript
// Open browser console at http://localhost:5173

// Get JWT token from localStorage
const token = localStorage.getItem('token');

// Connect to WebSocket
const socket = io('http://localhost:5001', {
  auth: { token }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ WebSocket connected');
  
  // Join a room
  socket.emit('join-room', {
    roomId: 'project-123',
    userData: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }
  });
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket disconnected');
});

// Collaboration events
socket.on('user-joined', (data) => {
  console.log('👤 User joined:', data);
});

socket.on('user-left', (data) => {
  console.log('👋 User left:', data);
});

socket.on('cursor-update', (data) => {
  console.log('🖱️ Cursor update:', data);
});

// Send cursor position
socket.emit('cursor-move', {
  roomId: 'project-123',
  position: { x: 100, y: 200 },
  userId: 'user-1'
});
```

---

## Troubleshooting

### Backend won't start

**MongoDB connection error:**
```
✗ Check MongoDB URI in .env
✗ If using Atlas, check IP whitelist
✗ If using Docker, check: docker compose logs mongodb
```

**PostgreSQL connection error:**
```
✗ Check PostgreSQL credentials in .env
✗ If using Supabase, verify connection details
✗ If using Docker, check: docker compose logs postgres
```

**Port already in use:**
```powershell
# Find process on port 5000
Get-NetTCPConnection -LocalPort 5000 | Select OwningProcess

# Kill process
Stop-Process -Id <PID> -Force
```

### Frontend can't connect

**CORS error:**
```
✗ Check backend .env has: CORS_ORIGIN=http://localhost:5173
✗ Restart backend after changing .env
```

**Network error:**
```
✗ Verify backend is running: curl http://localhost:5000/health
✗ Check frontend .env: VITE_API_URL=http://localhost:5000/api
✗ Clear browser cache (Ctrl+Shift+Delete)
```

**WebSocket won't connect:**
```
✗ Check WS_PORT=5001 in backend/.env
✗ Verify frontend has: VITE_WS_URL=http://localhost:5001
✗ Check Windows Firewall isn't blocking port 5001
```

---

## Performance Benchmarks

**Expected Response Times:**
- Health check: < 50ms
- Authentication: < 200ms
- Project CRUD: < 100ms
- Entity operations: < 150ms
- WebSocket latency: < 50ms

**Database Performance:**
- MongoDB queries: < 50ms
- PostgreSQL queries: < 50ms
- Connection pool: 10 max connections each

---

## Success Criteria

✅ **Backend Operational:**
- All services healthy
- Database connections successful
- API endpoints responding
- WebSocket server running

✅ **Frontend Connected:**
- API services initialized
- Authentication flow works
- Data persists in database (not localStorage)
- Real-time updates via WebSocket

✅ **Integration Complete:**
- Users can register/login
- Projects can be created/read/updated/deleted
- Entities can be managed
- Real-time collaboration works

---

**Next Steps:** Once integration testing passes, proceed to production deployment.
