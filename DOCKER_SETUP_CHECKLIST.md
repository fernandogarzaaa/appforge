# ✅ Docker Installation & Local Testing Checklist

## Phase 1: Installation (10 minutes)

### System Check
- [ ] Windows 10/11 with version 22H2+
- [ ] At least 8GB RAM (4GB minimum)
- [ ] 10GB free disk space
- [ ] Virtualization enabled in BIOS

### Download Docker Desktop
- [ ] Visit: https://www.docker.com/products/docker-desktop
- [ ] Download: Docker Desktop for Windows (x86_64)
- [ ] Run installer: Docker Desktop Installer.exe
- [ ] Complete installation wizard
- [ ] Restart computer when prompted

### Verify Installation
- [ ] Docker Desktop appears in Start menu
- [ ] Docker icon appears in system tray
- [ ] Run: `docker --version` (shows version 25.x+)
- [ ] Run: `docker compose version` (shows version 2.x+)

---

## Phase 2: Setup Project (5 minutes)

### Navigate to Project
- [ ] Open PowerShell
- [ ] Run: `cd 'c:\Users\ferna\Downloads\appforge-main'`
- [ ] Verify Docker files exist: `ls docker-compose.*.yml`

### Verify Files
- [ ] docker-compose.dev.yml (exists ✓)
- [ ] docker-compose.prod.yml (exists ✓)
- [ ] backend/Dockerfile.dev (exists ✓)
- [ ] All script files in scripts/ folder

---

## Phase 3: Start Services (5-10 minutes)

### Start Development Stack
- [ ] Run: `docker compose -f docker-compose.dev.yml up`
- [ ] Wait for startup (see progress in terminal)
- [ ] See "ready to accept connections" messages
- [ ] All three services showing as running

### Expected Services
- [ ] ✓ appforge-mongodb-dev (port 27017)
- [ ] ✓ appforge-redis-dev (port 6379)
- [ ] ✓ appforge-backend-dev (port 5000/5001)

---

## Phase 4: Test Services (10 minutes)

### Open Second PowerShell Window

**Test Backend Health:**
- [ ] Run: `curl http://localhost:5000/api/health`
- [ ] See response: `{"status":"ok",...}`

**List Running Containers:**
- [ ] Run: `docker ps`
- [ ] See 3 containers running

**Test Database:**
- [ ] Run: `docker exec appforge-mongodb-dev mongosh --eval "db.adminCommand('ping')"`
- [ ] See response: `{ ok: 1 }`

**Test Cache:**
- [ ] Run: `docker exec appforge-redis-dev redis-cli ping`
- [ ] See response: `PONG`

### All Services Healthy? ✅
- [ ] Backend responding to API calls
- [ ] MongoDB connected and responding
- [ ] Redis cache responding
- [ ] No error messages in logs

---

## Phase 5: Test Frontend (Optional, 5 minutes)

### Open Third PowerShell Window
- [ ] Navigate: `cd 'c:\Users\ferna\Downloads\appforge-main'`
- [ ] Install: `npm install`
- [ ] Start: `npm run dev`
- [ ] Wait for Vite to start

### Access Frontend
- [ ] Open browser: http://localhost:5173
- [ ] See React app loading
- [ ] Check browser console (F12) for errors
- [ ] Test clicking between pages

---

## Phase 6: Verification (5 minutes)

### All Services Running?
- [ ] Backend: http://localhost:5000/api/health
- [ ] Frontend: http://localhost:5173 (if running npm run dev)
- [ ] MongoDB: Connected and responding
- [ ] Redis: Connected and responding

### Docker Health
- [ ] Run: `docker compose -f docker-compose.dev.yml ps`
- [ ] All containers show "Up" status
- [ ] All containers show correct ports

### Logs Look Good?
- [ ] Run: `docker compose -f docker-compose.dev.yml logs`
- [ ] No ERROR messages
- [ ] All services showing successful startup

---

## Common Issues & Solutions

### Issue: Docker won't start
**Status: [ ]**
- [ ] Checked that Docker Desktop is running
- [ ] Looked in Windows system tray
- [ ] Restarted Docker if needed
- [ ] Waited 2-3 minutes for full startup

### Issue: Port already in use
**Status: [ ]**
- [ ] Ran: `netstat -ano | findstr :5000`
- [ ] Identified conflicting process
- [ ] Closed/killed conflicting process
- [ ] Restarted Docker services

### Issue: MongoDB not connecting
**Status: [ ]**
- [ ] Checked: `docker ps | findstr mongodb`
- [ ] Viewed logs: `docker logs appforge-mongodb-dev`
- [ ] Restarted: `docker restart appforge-mongodb-dev`
- [ ] Waited for recovery

### Issue: Out of disk space
**Status: [ ]**
- [ ] Ran: `docker system prune -a`
- [ ] Freed Windows disk space
- [ ] Restarted Docker
- [ ] Tried again

### Issue: WSL2 error
**Status: [ ]**
- [ ] Updated WSL: `wsl --update`
- [ ] Restarted Windows
- [ ] Reinstalled Docker with WSL2 enabled
- [ ] Verified Docker working

---

## Success Criteria

**You've succeeded when:**

- [ ] Docker installed and running
- [ ] All 3 services started without errors
- [ ] Backend API responding (http://localhost:5000/api/health)
- [ ] MongoDB connected and responding
- [ ] Redis cache responding (redis-cli ping = PONG)
- [ ] No ERROR messages in logs
- [ ] Frontend loaded (http://localhost:5173)
- [ ] All containers show "Up" status

**All criteria met? 🎉 CONGRATULATIONS!**

---

## What's Next?

### Option A: Continue Local Development
- [ ] Make code changes to frontend/backend
- [ ] Test changes in browser
- [ ] Run tests: `npm test`
- [ ] Run linter: `npm run lint`

### Option B: Move to Production
- [ ] Stop services: `Ctrl+C` in first window
- [ ] Read: SETUP_AND_DEPLOY.md
- [ ] Launch cloud server
- [ ] Deploy application

### Option C: Explore & Learn
- [ ] View logs: `docker compose -f docker-compose.dev.yml logs -f`
- [ ] Connect to MongoDB: `docker exec -it appforge-mongodb-dev mongosh`
- [ ] Inspect containers: `docker inspect appforge-backend-dev`
- [ ] Check resource usage: `docker stats`

---

## Quick Commands Reference

```powershell
# START services
docker compose -f docker-compose.dev.yml up

# STOP services
Ctrl+C (in terminal) or docker compose down

# VIEW logs
docker compose -f docker-compose.dev.yml logs -f

# LIST containers
docker ps

# TEST backend
curl http://localhost:5000/api/health

# TEST database
docker exec appforge-mongodb-dev mongosh --eval "db.adminCommand('ping')"

# TEST cache
docker exec appforge-redis-dev redis-cli ping

# CLEAN UP
docker system prune -a
```

---

## Time Breakdown

| Phase | Time | Status |
|-------|------|--------|
| Install Docker | 10 min | |
| Setup Project | 5 min | |
| Start Services | 5-10 min | |
| Test Services | 10 min | |
| Test Frontend (optional) | 5 min | |
| **Total** | **30-45 min** | |

---

## Files to Know

| File | Purpose | Location |
|------|---------|----------|
| docker-compose.dev.yml | Start services | Project root |
| INSTALL_DOCKER_LOCAL.md | This guide | Project root |
| DEPLOYMENT_COMPLETE.md | Architecture | Project root |
| QUICK_REFERENCE.md | Common commands | Project root |

---

## Progress Tracking

- [ ] Phase 1: Docker installation ✓
- [ ] Phase 2: Project setup ✓
- [ ] Phase 3: Start services ✓
- [ ] Phase 4: Test services ✓
- [ ] Phase 5: Test frontend (optional) ✓
- [ ] Phase 6: Final verification ✓

**Completed all phases? 🚀 You're ready for the next option!**

---

## Need Help?

**Check these files:**
1. INSTALL_DOCKER_LOCAL.md (detailed guide)
2. QUICK_REFERENCE.md (common commands)
3. DEPLOYMENT_COMPLETE.md (architecture)

**Still stuck?**
1. View logs: `docker logs <container-name>`
2. Restart services: `docker compose down && docker compose up`
3. Clean system: `docker system prune -a`
4. Restart Docker Desktop
5. Restart Windows

---

**Ready to start? Run:**
```powershell
docker compose -f docker-compose.dev.yml up
```

**Then check:**
```powershell
curl http://localhost:5000/api/health
```

🎉 **Welcome to AppForge local development!**
