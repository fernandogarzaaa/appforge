# Docker Setup Guide - AppForge BullMQ

## Overview

Docker provides the most portable way to run Redis and other services. This guide covers Docker Desktop for Windows.

## Installation

### Step 1: Install Docker Desktop

1. Download from: https://www.docker.com/products/docker-desktop
2. Run the installer
3. Follow the installation wizard (accept default settings)
4. Restart your computer
5. Verify installation:
   ```powershell
   docker --version
   docker-compose --version
   ```

### Step 2: Enable WSL2 (If not already enabled)

Docker Desktop on Windows uses WSL2 for better performance:

```powershell
# Run as Administrator
wsl --install
# Then restart
```

## Running Redis with Docker

### Option A: Using Docker Compose (Recommended)

The project already has a `docker-compose.yml` configured.

```powershell
# Start Redis in background
docker-compose up -d redis

# Verify it's running
docker-compose ps

# Check Redis is responding
docker-compose exec redis redis-cli ping
# Should output: PONG

# View logs
docker-compose logs redis

# Stop Redis
docker-compose down

# Stop but keep data
docker-compose stop
```

### Option B: Using Docker Directly

```powershell
# Start Redis container
docker run -d `
  --name appforge-redis `
  -p 6379:6379 `
  -v redis-data:/data `
  redis:7-alpine `
  redis-server --appendonly yes

# Verify
docker exec appforge-redis redis-cli ping

# Stop
docker stop appforge-redis
docker rm appforge-redis
```

## Connecting to Redis from Your App

### Automatic Connection

The app automatically detects Redis on `localhost:6379`:

```bash
npm run dev
```

### Custom Connection

Set in `.env`:

```env
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password  # if using authentication
```

## Useful Docker Commands

### View Running Containers
```powershell
docker-compose ps
# or
docker ps
```

### View Container Logs
```powershell
docker-compose logs redis
# Follow logs in real-time
docker-compose logs -f redis
```

### Access Redis CLI
```powershell
# Via docker-compose
docker-compose exec redis redis-cli

# Or direct docker
docker exec -it appforge-redis redis-cli
```

### Common Redis CLI Commands
```
redis-cli
> ping                    # Test connection
> INFO                    # Server info
> DBSIZE                  # Number of keys
> KEYS *                  # List all keys
> FLUSHDB                 # Clear current database
> MONITOR                 # Watch all commands
> QUIT                    # Exit CLI
```

### Check Redis Memory Usage
```powershell
docker-compose exec redis redis-cli INFO memory
```

### Backup Redis Data
```powershell
# Redis data is automatically saved to docker volume
# To export manually:
docker-compose exec redis redis-cli BGSAVE

# The backup file is in: /data/dump.rdb
```

## Troubleshooting

### Connection Refused
```powershell
# Check if container is running
docker-compose ps

# If not running, start it
docker-compose up -d redis

# Check logs for errors
docker-compose logs redis
```

### Permission Denied on Windows
- Make sure Docker Desktop is running (look for whale icon in system tray)
- Restart Docker: Right-click whale icon → Restart

### Can't Connect from WSL
```bash
# Inside WSL, find the Windows host IP
cat /etc/resolv.conf | grep nameserver
# Use that IP in REDIS_URL for WSL applications
```

### High Memory Usage
Redis stores data in memory. Adjust container resources:

```yaml
# Edit docker-compose.yml
services:
  redis:
    ...
    deploy:
      resources:
        limits:
          memory: 2G  # Limit to 2GB
```

Then restart: `docker-compose restart redis`

## Running Multiple Services

The full `docker-compose.yml` includes MongoDB as well:

```powershell
# Start Redis and MongoDB
docker-compose up -d

# Check both are running
docker-compose ps

# Access MongoDB
docker-compose exec mongodb mongosh
```

## Production Considerations

For production deployments:

1. **Use Redis Sentinel** for high availability
2. **Enable persistence** (already configured with `appendonly yes`)
3. **Set memory limits** to prevent OOM
4. **Use authentication** (add password in docker-compose.yml)
5. **Monitor with prometheus** (see PRODUCTION_QUEUE_INFRASTRUCTURE.md)

Example production configuration:

```yaml
redis:
  image: redis:7-alpine
  command: >
    redis-server
    --appendonly yes
    --maxmemory 4gb
    --maxmemory-policy allkeys-lru
    --requirepass your-secure-password
  restart: always
  volumes:
    - redis-data:/data
  ports:
    - "6379:6379"
```

## Advanced: Using Redis with Authentication

```yaml
# docker-compose.yml
redis:
  ...
  command: redis-server --requirepass mypassword
```

Then in `.env`:
```env
REDIS_URL=redis://:mypassword@localhost:6379
```

## Next Steps

1. ✅ Install Docker Desktop (if not already)
2. ✅ Run `docker-compose up -d redis` to start Redis
3. ✅ Run `npm run dev` to start the app
4. ✅ Test queue functionality
5. 📚 See PRODUCTION_QUEUE_INFRASTRUCTURE.md for production setup

## Resources

- Docker Docs: https://docs.docker.com/
- Redis Docker Hub: https://hub.docker.com/_/redis
- Docker Compose Docs: https://docs.docker.com/compose/
