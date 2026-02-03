# 🎯 Option 1: LOCAL DOCKER SETUP - GUIDE

## You Chose: Install Docker & Test Locally

**Goal:** Get AppForge running on your machine for development and testing

**Time:** 30-45 minutes  
**Difficulty:** Easy  
**Result:** Working local development environment

---

## 📋 Two Guides Created for You

### 1. **INSTALL_DOCKER_LOCAL.md** (Comprehensive)
   - Complete installation instructions
   - Step-by-step setup guide
   - Detailed troubleshooting
   - All commands with explanations
   - Test procedures
   
   **👉 Read this for detailed help**

### 2. **DOCKER_SETUP_CHECKLIST.md** (Quick Reference)
   - Checkbox format
   - Six phases to complete
   - Success criteria
   - Quick commands
   - Progress tracking
   
   **👉 Use this as you follow along**

---

## ⚡ Quick Start (The Fast Way)

### Step 1: Download Docker (5 min)
```
Visit: https://www.docker.com/products/docker-desktop
Download: Docker Desktop for Windows (x86_64)
Run installer → Complete → Restart computer
```

### Step 2: Verify Docker Works (2 min)
```powershell
docker --version          # Should show: Docker version 25.x
docker compose version    # Should show: Docker Compose version 2.x
```

### Step 3: Start Development Stack (3 min)
```powershell
cd 'c:\Users\ferna\Downloads\appforge-main'
docker compose -f docker-compose.dev.yml up
```

### Step 4: Test Services (5 min)
**In a NEW PowerShell window:**
```powershell
curl http://localhost:5000/api/health
docker ps
```

✅ **If you see responses → Success!**

---

## 🎯 What Happens When You Run It

```
docker compose -f docker-compose.dev.yml up
```

This starts 3 services in Docker containers:

```
┌─────────────────────────────────────────────┐
│        AppForge Development Stack           │
├─────────────────────────────────────────────┤
│                                             │
│  🌐 Backend API (Node.js)                   │
│     Port: 5000                              │
│     Health: http://localhost:5000/api/...   │
│                                             │
│  🗄️  MongoDB (Database)                     │
│     Port: 27017                             │
│     User: appforge_user (auto)              │
│                                             │
│  💾 Redis (Cache/Sessions)                  │
│     Port: 6379                              │
│     Password: auto-generated                │
│                                             │
└─────────────────────────────────────────────┘

FRONTEND: npm run dev (separate, in another window)
  Port: 5173
  Command: npm run dev (from project root)
```

---

## 📝 What You'll See

### First Window (Docker Services)
```
Creating appforge-mongodb-dev  ... done
Creating appforge-redis-dev    ... done
Creating appforge-backend-dev  ... done
Attaching to services...

appforge-mongodb-dev | Server listening on 27017
appforge-redis-dev   | Ready to accept connections
appforge-backend-dev | Express server listening on port 5000
```

✅ **This means services started successfully!**

### Second Window (Test Commands)
```powershell
PS> curl http://localhost:5000/api/health
StatusCode        : 200
Content           : {"status":"ok","timestamp":"..."}
```

✅ **This means API is responding!**

---

## 🛑 Stop Services When Done

**Option 1: In original window**
```
Press: Ctrl+C
```

**Option 2: In new window**
```powershell
docker compose -f docker-compose.dev.yml down
```

---

## 🔧 Useful Commands

| What | Command |
|------|---------|
| Start services | `docker compose -f docker-compose.dev.yml up` |
| Start in background | `docker compose -f docker-compose.dev.yml up -d` |
| Stop services | `docker compose -f docker-compose.dev.yml down` |
| View logs | `docker compose -f docker-compose.dev.yml logs -f` |
| List containers | `docker ps` |
| Test API | `curl http://localhost:5000/api/health` |
| Connect to MongoDB | `docker exec -it appforge-mongodb-dev mongosh` |
| Restart a service | `docker restart appforge-backend-dev` |

---

## ⚠️ Common Issues

### "Docker daemon is not running"
- Check Windows taskbar for Docker icon
- Click Start → Docker → Docker Desktop
- Wait 1-2 minutes for startup

### "Port 5000 already in use"
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "No space left on device"
```powershell
docker system prune -a
# Or free Windows disk space
```

### "MongoDB connection failed"
```powershell
docker logs appforge-mongodb-dev
docker restart appforge-mongodb-dev
```

**→ For more issues, see INSTALL_DOCKER_LOCAL.md**

---

## ✅ Success Checklist

You've succeeded when:
- [ ] Docker installed and running
- [ ] Backend API responds: http://localhost:5000/api/health
- [ ] MongoDB connected: `docker exec ... mongosh ... ping` → `{ ok: 1 }`
- [ ] Redis responding: `docker exec ... redis-cli ping` → `PONG`
- [ ] All 3 containers running: `docker ps` (shows 3 containers)
- [ ] No ERROR messages in logs

---

## 📚 Your Two Guides

### For Detailed Instructions:
👉 **Read: [INSTALL_DOCKER_LOCAL.md](INSTALL_DOCKER_LOCAL.md)**
- 8 complete steps with explanations
- Screenshots and examples
- Full troubleshooting section
- Development commands
- Testing procedures

### For Quick Execution:
👉 **Use: [DOCKER_SETUP_CHECKLIST.md](DOCKER_SETUP_CHECKLIST.md)**
- Checkbox format
- 6 phases with sub-steps
- Quick commands reference
- Progress tracking
- Success criteria

---

## 🎯 What's Next?

### Option A: Continue Local Development
- Make code changes
- Test in browser
- Run tests: `npm test`
- Check code: `npm run lint`

### Option B: Deploy to Production
- Stop services: `Ctrl+C`
- Read: SETUP_AND_DEPLOY.md
- Launch server
- Deploy application

### Option C: Try Other Features
- Add advanced features
- Setup monitoring
- Optimize performance
- See NEXT_PHASE.md

---

## 🚀 Let's Get Started!

### 1. Get Docker
👉 https://www.docker.com/products/docker-desktop

### 2. Follow The Checklist
👉 Use [DOCKER_SETUP_CHECKLIST.md](DOCKER_SETUP_CHECKLIST.md)

### 3. Run This Command
```powershell
cd 'c:\Users\ferna\Downloads\appforge-main'
docker compose -f docker-compose.dev.yml up
```

### 4. Test In Another Window
```powershell
curl http://localhost:5000/api/health
```

### 5. Access Frontend (Optional)
```powershell
npm install
npm run dev
# Open: http://localhost:5173
```

---

## 📞 Need Help?

**Before you start:**
- Read: INSTALL_DOCKER_LOCAL.md (comprehensive guide)

**While running services:**
- Check logs: `docker compose -f docker-compose.dev.yml logs -f`
- Restart: `docker compose down && docker compose up`

**Still stuck:**
- See troubleshooting in INSTALL_DOCKER_LOCAL.md
- Check QUICK_REFERENCE.md for commands
- View Docker documentation: https://docs.docker.com/

---

## 📖 Documentation Files Created

```
INSTALL_DOCKER_LOCAL.md        ← Detailed guide (READ THIS FIRST)
DOCKER_SETUP_CHECKLIST.md      ← Checklist format (USE THIS TO FOLLOW ALONG)
DOCKER_SETUP_GUIDE.md          ← This summary
NEXT_PHASE.md                  ← What to do after testing
```

---

**Ready? Let's go! 🚀**

**Step 1:** Install Docker from https://www.docker.com/products/docker-desktop

**Step 2:** Read [INSTALL_DOCKER_LOCAL.md](INSTALL_DOCKER_LOCAL.md) for detailed instructions

**Step 3:** Use [DOCKER_SETUP_CHECKLIST.md](DOCKER_SETUP_CHECKLIST.md) as you follow along

**Step 4:** Run:
```powershell
docker compose -f docker-compose.dev.yml up
```

**Step 5:** Test:
```powershell
curl http://localhost:5000/api/health
```

✅ **You're running AppForge locally!**

---

**Questions?** Check the guides above or see [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common commands.
