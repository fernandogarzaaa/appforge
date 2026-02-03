# 🐳 Option 1: Install Docker & Test Locally

## Goal
Install Docker Desktop and run the AppForge application locally to test the development environment.

**Time:** 30-45 minutes  
**Difficulty:** Easy  
**Prerequisites:** Windows 10/11 with 8GB RAM

---

## Step 1: Check Your System Requirements

### Minimum Requirements
- Windows 10 (version 22H2) or Windows 11
- 4GB RAM (8GB recommended)
- Virtualization enabled in BIOS
- 10GB free disk space

### Check Windows Version
```powershell
# Open PowerShell and run:
[System.Environment]::OSVersion
# Or: Settings → System → About → Windows specifications
```

### Check Virtualization
```powershell
# Open PowerShell as Administrator:
Get-WmiObject Win32_Processor | Select Name, VirtualizationRulesEnforcement
# If output shows "Virtualization Capable: True" → you're good!
```

---

## Step 2: Install Docker Desktop

### Option A: Download Installer (Recommended)

**1. Download Docker Desktop**
- Visit: https://www.docker.com/products/docker-desktop
- Click "Download for Windows"
- Choose: **Docker Desktop for Windows (x86_64)**

**2. Run Installer**
```powershell
# Double-click Docker Desktop Installer.exe
# Follow the installation wizard
# Default settings are fine
```

**3. Complete Installation**
- Accept license agreement
- Choose installation location
- Wait for installation (5-10 minutes)
- Restart your computer when prompted

### Option B: Use Windows Package Manager

```powershell
# If you have winget installed:
winget install Docker.DockerDesktop

# Or with Chocolatey:
choco install docker-desktop

# Then restart your computer
```

---

## Step 3: Start Docker Desktop

**After restart:**

1. Search for "Docker" in Start menu
2. Click "Docker Desktop"
3. Wait for Docker to start (watch the system tray icon)
4. Icon will change from loading to whale symbol when ready

**Verify Docker is running:**
```powershell
# Open PowerShell and run:
docker --version
docker compose version

# Expected output:
# Docker version 25.x.x
# Docker Compose version 2.x.x
```

**If you see version numbers → Docker is installed! ✅**

---

## Step 4: Prepare AppForge Project

```powershell
# Navigate to project directory
cd 'c:\Users\ferna\Downloads\appforge-main'

# Verify Docker files exist
ls docker-compose.*.yml

# Expected files:
# docker-compose.dev.yml
# docker-compose.prod.yml
# docker-compose.yml
```

---

## Step 5: Start Local Development Environment

```powershell
# Navigate to project
cd 'c:\Users\ferna\Downloads\appforge-main'

# Start development stack
docker compose -f docker-compose.dev.yml up

# Wait for startup (2-3 minutes first time)
# You'll see:
# ✓ appforge-backend-dev starting
# ✓ appforge-mongodb-dev starting
# ✓ appforge-redis-dev starting
```

### Expected Output

```
Creating appforge-backend-dev  ... done
Creating appforge-mongodb-dev  ... done
Creating appforge-redis-dev    ... done
Attaching to appforge-mongodb-dev, appforge-redis-dev, appforge-backend-dev
appforge-mongodb-dev | {"msg":"Server is listening","attr":{"port":27017}}
appforge-redis-dev   | * Ready to accept connections
appforge-backend-dev | Server running on port 5000
```

✅ **All three services started successfully!**

---

## Step 6: Test the Application

### In Another PowerShell Window:

```powershell
# Keep the first window running with Docker
# Open a NEW PowerShell window and run:

# Test Backend API
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-02-03T..."}
```

### Access Services

```
Backend API:     http://localhost:5000
MongoDB:         localhost:27017 (database)
Redis:           localhost:6379 (cache)
Frontend:        npm run dev (need to run separately)
```

---

## Step 7: Start Frontend (Optional)

**In a third PowerShell window:**

```powershell
# Navigate to project
cd 'c:\Users\ferna\Downloads\appforge-main'

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Wait for server to start...
# Expected output:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### Access Frontend

```
Frontend: http://localhost:5173
```

**Try clicking around the app to test functionality!**

---

## Step 8: Verify Everything is Working

### Check Docker Containers

**In a fourth PowerShell window:**

```powershell
# List all running containers
docker ps

# Expected output:
# CONTAINER ID   IMAGE                    PORTS
# xxxxxxxx       appforge-backend-dev     5000->5000, 5001->5001
# xxxxxxxx       appforge-mongodb-dev     27017->27017
# xxxxxxxx       appforge-redis-dev       6379->6379
```

### Run Health Check

```powershell
# Test all services
curl http://localhost:5000/api/health
curl http://localhost:5000  # Backend homepage

# Test database
docker exec appforge-mongodb-dev mongosh --eval "db.adminCommand('ping')"
# Should output: { ok: 1 }

# Test Redis
docker exec appforge-redis-dev redis-cli ping
# Should output: PONG
```

✅ **All services healthy!**

---

## What You Have Running

```
┌─────────────────────────────────────┐
│   AppForge Local Development Stack  │
├─────────────────────────────────────┤
│                                     │
│  Frontend (React + Vite)            │
│  🌐 http://localhost:5173           │
│                                     │
│  Backend API (Node.js + Express)    │
│  📡 http://localhost:5000           │
│  WebSocket: http://localhost:5001   │
│                                     │
│  MongoDB (Database)                 │
│  🗄️  localhost:27017                │
│                                     │
│  Redis (Cache/Sessions)             │
│  💾 localhost:6379                  │
│                                     │
└─────────────────────────────────────┘
```

---

## Test Features

### Test Backend

```powershell
# Health check
curl http://localhost:5000/api/health

# API endpoints (examples)
curl http://localhost:5000/api/persistence/user-state
curl http://localhost:5000/api/analytics

# Create data
$body = @{userId="test-user"; state=@{key="value"}} | ConvertTo-Json
curl -X POST http://localhost:5000/api/persistence/user-state `
  -Header "Content-Type: application/json" `
  -Body $body
```

### Test Frontend

1. Open http://localhost:5173
2. Check browser console (F12) for errors
3. Test navigation between pages
4. Verify data loads from backend

### Test Database

```powershell
# Connect to MongoDB
docker exec -it appforge-mongodb-dev mongosh

# In MongoDB shell:
use appforge
show collections
db.userstates.find()  # See stored data
exit
```

---

## Viewing Logs

### Backend Logs
```powershell
# In the original window, you'll see backend logs
# Or in a new window:
docker logs appforge-backend-dev

# Follow logs (real-time)
docker logs -f appforge-backend-dev

# Last 50 lines
docker logs --tail=50 appforge-backend-dev
```

### Frontend Logs
```powershell
# In the npm run dev window
# You'll see Vite logs and browser errors
```

### All Services Logs
```powershell
# See all services output
docker compose -f docker-compose.dev.yml logs

# Follow all logs (real-time)
docker compose -f docker-compose.dev.yml logs -f
```

---

## Stop Services

### Option 1: Stop in Original Window
```powershell
# In the window running "docker compose up":
# Press: Ctrl+C

# Wait for graceful shutdown (10-30 seconds)
```

### Option 2: Stop in New Window
```powershell
docker compose -f docker-compose.dev.yml down

# Or stop specific container
docker stop appforge-backend-dev
docker stop appforge-mongodb-dev
docker stop appforge-redis-dev
```

---

## Troubleshooting

### Issue: "Docker daemon is not running"
**Solution:**
```powershell
# Make sure Docker Desktop is running
# Check Windows taskbar for Docker icon
# If not there, click Start menu → Docker → Docker Desktop
# Wait 1-2 minutes for startup
```

### Issue: "Port 5000 already in use"
**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (if not Docker)
taskkill /PID <PID> /F

# Or change port in docker-compose.dev.yml
# Change: "5000:5000" to "5001:5000"
```

### Issue: "MongoDB connection failed"
**Solution:**
```powershell
# Check MongoDB is running
docker ps | findstr mongodb

# View MongoDB logs
docker logs appforge-mongodb-dev

# Restart MongoDB
docker restart appforge-mongodb-dev
```

### Issue: "Out of disk space"
**Solution:**
```powershell
# Clean up Docker
docker system prune -a

# Or free disk space in Windows
# Delete temporary files, uninstall apps, etc.
```

### Issue: "Docker won't start"
**Solution:**
1. Restart Docker Desktop
   - Taskbar → Docker icon → Quit
   - Start menu → Docker → Docker Desktop
2. Restart Windows
3. Check Windows updates (may need restart)
4. Disable Windows Defender temporarily (if issues persist)

### Issue: "WSL2 error"
**Solution:**
```powershell
# Update WSL2
wsl --update

# Or reinstall Docker with WSL2
# Docker Desktop → Settings → Resources → WSL Integration → Enable
```

---

## Next Steps After Testing

### ✅ If Everything Works:

**Congratulations! Your local development environment is working!**

Now you can:

1. **Make code changes** and they auto-reload (hot reload)
2. **Run tests** - `npm test`
3. **Check code quality** - `npm run lint`
4. **Deploy to production** - Follow SETUP_AND_DEPLOY.md

### ⚠️ If Something Doesn't Work:

1. **Check logs** - See what errors appear
2. **Verify Docker** - `docker ps`, `docker logs`
3. **Restart services** - `docker compose down` then `up`
4. **Check ports** - Make sure 5000, 5173, 27017, 6379 are free

---

## Development Commands

```powershell
# Start services
docker compose -f docker-compose.dev.yml up

# Start in background
docker compose -f docker-compose.dev.yml up -d

# Stop services
docker compose -f docker-compose.dev.yml down

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Rebuild containers
docker compose -f docker-compose.dev.yml build --no-cache

# Access container shell
docker exec -it appforge-backend-dev sh

# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Remove all containers
docker system prune -a
```

---

## Front-End Development (Separate Setup)

If you want the frontend to auto-reload too:

```powershell
# In a new PowerShell window
cd 'c:\Users\ferna\Downloads\appforge-main'

# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Access at: http://localhost:5173
```

### Frontend Hot Reload Features
- Edit any React component
- Changes appear instantly in browser
- Errors show in browser console

---

## What You've Accomplished

✅ Installed Docker Desktop  
✅ Started local development environment  
✅ Verified all services running (Backend, MongoDB, Redis)  
✅ Tested API endpoints  
✅ Accessed frontend (optional)  
✅ Learned basic Docker commands  

---

## Ready for Next Steps?

### Option A: Continue Local Development
- Make code changes
- Test features
- Run tests

### Option B: Move to Production Deployment
- Read: SETUP_AND_DEPLOY.md
- Launch: Production server
- Deploy: Application

### Option C: Advanced Features
- See NEXT_PHASE.md for options

---

## Quick Reference

| Task | Command |
|------|---------|
| Start services | `docker compose -f docker-compose.dev.yml up` |
| Stop services | `Ctrl+C` or `docker compose down` |
| View logs | `docker compose logs -f` |
| Test API | `curl http://localhost:5000/api/health` |
| Access frontend | http://localhost:5173 |
| Connect to MongoDB | `docker exec -it appforge-mongodb-dev mongosh` |
| Run tests | `npm test` |
| Check code quality | `npm run lint` |

---

## Support

**Need help?**
- Check logs: `docker compose -f docker-compose.dev.yml logs -f`
- Restart services: `docker compose down && docker compose up`
- See troubleshooting section above
- Check DEPLOYMENT_COMPLETE.md for architecture details

---

**🎉 You're ready to test AppForge locally!**

**Run this command to get started:**
```powershell
docker compose -f docker-compose.dev.yml up
```

**Then open in browser:**
```
Backend: http://localhost:5000/api/health
Frontend: http://localhost:5173 (after npm run dev)
```
