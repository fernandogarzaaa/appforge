# Redis Setup Options for AppForge

## Option 1: Local Installation (Windows) - Using Memurai

Memurai is the recommended Redis implementation for Windows. Visit https://www.memurai.com to download and install.

### Steps:
1. Download Memurai from https://www.memurai.com/downloads
2. Run the installer
3. Redis will be installed and running as a service on port 6379
4. Verify: `redis-cli ping` should return `PONG`

## Option 2: WSL2 with Linux Redis (Recommended for Development)

### Install WSL2:
```powershell
# Run as Administrator
wsl --install Ubuntu-22.04
```

### Install Redis in WSL:
```bash
# Inside WSL bash
sudo apt update
sudo apt install redis-server
sudo service redis-server start
# Verify
redis-cli ping
```

### Connect from Windows to WSL Redis:
```bash
# Inside WSL, get the IP:
ip addr show eth0 | grep "inet "
```

Then in your .env:
```
REDIS_URL=redis://<WSL_IP>:6379
```

## Option 3: Docker Desktop (Easiest if Docker is installed)

### Install Docker Desktop:
1. Download from https://www.docker.com/products/docker-desktop
2. Install and restart
3. Run from project root:

```powershell
docker-compose up -d redis
```

### Verify:
```powershell
docker-compose ps  # Should show redis running
docker-compose exec redis redis-cli ping  # Should return PONG
```

## Option 4: Development Mode (In-Memory Queue - Default)

If you don't have Redis installed, the application automatically falls back to in-memory caching:

```
npm run dev
```

**Note:** In-memory mode is suitable for development only. It will not persist data across restarts and doesn't support distributed setups.

## Status Check

To verify Redis is working:

```powershell
redis-cli ping
# If connected: PONG
# If not connected: (error) ERR Could not connect to Redis at 127.0.0.1:6379
```

Once Redis is running, the application will automatically use it instead of falling back to in-memory storage.
