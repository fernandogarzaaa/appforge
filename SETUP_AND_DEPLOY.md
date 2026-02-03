# 🚀 Production Deployment - Complete Setup Guide

## Phase 1: Local Testing (Your Machine)

### Prerequisites Check
- [ ] Docker Desktop installed (`docker --version`)
- [ ] Docker Compose installed (`docker compose version`)
- [ ] Git installed (`git --version`)
- [ ] Node.js 20+ installed (`node --version`)

### Start Development Environment

```powershell
# Navigate to project
cd 'c:\Users\ferna\Downloads\appforge-main'

# Start development stack (requires Docker Desktop running)
docker compose -f docker-compose.dev.yml up

# Expected output:
# - appforge-backend-dev    (port 5000)
# - appforge-mongodb-dev    (port 27017)
# - appforge-redis-dev      (port 6379)

# Access:
# Frontend: http://localhost:5173 (via npm run dev in separate terminal)
# Backend: http://localhost:5000
```

### Verify Local Setup

```powershell
# Check containers running
docker ps

# Test backend health
curl http://localhost:5000/api/health

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop when done
docker compose -f docker-compose.dev.yml down
```

---

## Phase 2: Production Server Preparation

### Server Options

**Recommended Options:**
1. **AWS EC2** (Recommended for beginners)
   - Ubuntu 22.04 LTS, t3.medium instance
   - Elastic IP for static IP
   - RDS option for managed MongoDB/PostgreSQL

2. **Digital Ocean** (Best for cost)
   - App Platform (managed containers)
   - Or droplet (Ubuntu 22.04 LTS)

3. **Azure** (Best integration with Windows)
   - App Service with Docker containers
   - Or VM with Ubuntu

4. **Linode** (Best for reliability)
   - Dedicated server or shared instance
   - Ubuntu 22.04 LTS

5. **Local/On-Premises**
   - Ubuntu/CentOS/Windows Server
   - Docker + Docker Compose installed

### Step 1: Launch Server

**AWS EC2 Example:**
```bash
# Instance: t3.medium (2 vCPU, 4GB RAM) or larger
# OS: Ubuntu 22.04 LTS
# Storage: 50GB+ (gp3)
# Network: Security group allow 22, 80, 443
# SSH Key: Download and save locally
```

### Step 2: Connect to Server

```bash
# Windows PowerShell
ssh -i "your-key.pem" ubuntu@your-server-ip

# Or use PuTTY/Windows Terminal
```

### Step 3: Install Docker

**On Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# Add Docker repo
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify
docker --version
docker compose version
```

### Step 4: Clone Repository

```bash
# On server
cd /opt
sudo git clone https://github.com/yourusername/appforge.git
cd appforge

# Fix permissions
sudo chown -R $USER:$USER /opt/appforge
chmod +x scripts/*.sh
```

### Step 5: Generate Production Secrets

```bash
# Generate .env.production
./scripts/setup-production.sh

# Verify secrets generated
cat .env.production | head -20
```

---

## Phase 3: Configuration

### Update Environment Variables

```bash
# Edit .env.production
nano .env.production
```

**Critical values to update:**

```env
# 1. Domains (REQUIRED)
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
WS_URL=wss://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# 2. Database (auto-generated, but verify)
MONGODB_URI=mongodb://appforge_user:PASSWORD@mongodb:27017/appforge
REDIS_URL=redis://:PASSWORD@redis:6379

# 3. Email (optional but recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 4. Error tracking (optional)
SENTRY_DSN=https://xxxx@sentry.io/xxxx

# 5. Stripe (optional)
STRIPE_SECRET_KEY=sk_live_xxxx
```

### Configure SSL Certificates

**Option 1: Let's Encrypt (Recommended, Free)**

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com

# Certificates saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Update .env.production
nano .env.production
# Add:
# SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
# SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

**Option 2: Commercial Certificate**

- Purchase from Namecheap, Comodo, etc.
- Copy to `/opt/appforge/backend/certs/`
- Update paths in `.env.production`

### Configure DNS

**Update your domain registrar:**

```
A Record:
yourdomain.com       → your-server-ip
www.yourdomain.com   → your-server-ip
api.yourdomain.com   → your-server-ip
```

**Verify DNS:**
```bash
nslookup yourdomain.com
dig yourdomain.com

# Should return your server IP
```

### Configure Firewall

```bash
# UFW (Ubuntu default)
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable

# Verify rules
sudo ufw status

# On cloud providers (AWS/Azure/GCP):
# Use security groups to allow 22, 80, 443
```

---

## Phase 4: Deploy to Production

### Automated Deployment

```bash
# Make script executable
chmod +x scripts/deploy-production.sh

# Run deployment
./scripts/deploy-production.sh

# Expected output:
# ✅ Validating environment variables...
# ✅ Pulling latest code...
# ✅ Building Docker images...
# ✅ Starting services...
# ✅ Health check passed!
# ✅ Deployment successful
```

### Manual Deployment (if script fails)

```bash
# Pull latest code
git pull origin main

# Build and start containers
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Phase 5: Verification

### Check Services are Running

```bash
# List all containers
docker ps

# Should show:
# - appforge-frontend
# - appforge-backend (possibly multiple instances)
# - appforge-mongodb
# - appforge-redis
# - appforge-nginx

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### Run Health Check Script

```bash
./scripts/health-check.sh

# Expected output:
# ✅ Backend API is healthy
# ✅ Frontend is healthy
# ✅ MongoDB is healthy
# ✅ Redis is healthy
# ✅ All services are healthy
```

### Test Endpoints

```bash
# Frontend
curl https://yourdomain.com

# API health
curl https://yourdomain.com/api/health

# Should return:
# {"status":"ok","version":"1.0.0"}
```

### Access Application

```
Frontend: https://yourdomain.com
API: https://api.yourdomain.com
API Docs: https://api.yourdomain.com/docs (if enabled)
```

---

## Phase 6: Post-Deployment Setup

### 1. Setup Automated Backups

```bash
# Create backup directory
sudo mkdir -p /backups/mongodb
sudo chown $USER:$USER /backups/mongodb

# Make backup script executable
chmod +x scripts/backup-mongodb.sh

# Test backup
./scripts/backup-mongodb.sh

# Verify backup created
ls -lh /backups/mongodb/

# Setup daily backups (2 AM)
crontab -e

# Add this line:
0 2 * * * /opt/appforge/scripts/backup-mongodb.sh >> /var/log/appforge-backup.log 2>&1

# Verify cron job
crontab -l
```

### 2. Setup Monitoring

**Option A: Sentry (Error Tracking)**

```bash
# 1. Create free account at sentry.io
# 2. Create new project (Node.js)
# 3. Copy DSN

# 4. Update .env.production
nano .env.production
# Add: SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# 5. Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

**Option B: Health Monitoring**

```bash
# Setup monitoring script
# Add to cron (every 5 minutes):
*/5 * * * * /opt/appforge/scripts/health-check.sh >> /var/log/appforge-health.log 2>&1

# View health history
tail -100 /var/log/appforge-health.log
```

### 3. Setup Log Rotation

```bash
# Create logrotate config
sudo tee /etc/logrotate.d/appforge > /dev/null <<'EOF'
/opt/appforge/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
}
EOF

# Test logrotate
sudo logrotate -f /etc/logrotate.d/appforge
```

### 4. Setup SSL Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Verify automatic renewal enabled
sudo systemctl status certbot.timer

# Enable if not active
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Phase 7: CI/CD Setup (GitHub Actions)

### Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:

```
PROD_HOST            your-server-ip-or-domain
PROD_USERNAME        ubuntu (or your SSH user)
PROD_SSH_KEY         <contents of your private SSH key>
PROD_URL             https://yourdomain.com
```

### Generate SSH Key (if needed)

```bash
# On your local machine
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy.pub ubuntu@your-server-ip

# Copy private key to GitHub Secret
cat ~/.ssh/github_deploy
# Paste entire contents into PROD_SSH_KEY secret
```

### Enable Automatic Deployments

```bash
# Now every push to main branch automatically deploys
git push origin main

# GitHub Actions will:
# 1. Run tests
# 2. Run linter
# 3. Build Docker images
# 4. Deploy to production
```

---

## Maintenance & Operations

### Daily Tasks

```bash
# Check service health
./scripts/health-check.sh

# View recent logs
docker compose -f docker-compose.prod.yml logs --tail=50
```

### Weekly Tasks

```bash
# Check disk space
df -h

# Check backup status
ls -lh /backups/mongodb/ | head -10

# Check resource usage
docker stats
```

### Monthly Tasks

```bash
# Update Docker images
docker system prune -a

# Review logs and errors
grep ERROR /var/log/appforge-*.log

# Update SSL certificate (auto-renewed, but verify)
sudo certbot certificates
```

### Updates & Deployments

```bash
# Pull latest code
git pull origin main

# Deploy update
./scripts/deploy-production.sh

# Or automatic via GitHub Actions
git push origin main
```

---

## Rollback Procedure

If something goes wrong:

```bash
# 1. Check what failed
docker compose -f docker-compose.prod.yml logs backend

# 2. Rollback to previous commit
git log --oneline -5
git checkout <previous-commit-hash>

# 3. Redeploy
./scripts/deploy-production.sh

# 4. Verify
./scripts/health-check.sh
```

---

## Troubleshooting

### Container won't start
```bash
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml restart backend
```

### Database connection failed
```bash
docker exec appforge-mongodb mongosh --eval "db.adminCommand('ping')"
grep MONGODB_URI .env.production
```

### Nginx errors
```bash
docker exec appforge-nginx nginx -t
docker logs appforge-nginx
```

### Out of disk space
```bash
df -h
docker system prune -a
find /backups/mongodb -name "*.tar.gz" -mtime +30 -delete
```

---

## Success Metrics

✅ **Deployment is successful when:**

- [ ] `./scripts/health-check.sh` returns all green
- [ ] Frontend loads at https://yourdomain.com
- [ ] API responds at https://api.yourdomain.com/api/health
- [ ] SSL certificate is valid (green lock in browser)
- [ ] All 5 Docker containers are running
- [ ] Backups are being created daily
- [ ] Logs are being collected
- [ ] Monitoring is active

---

## Checklist

### Pre-Deployment
- [ ] Docker & Docker Compose installed on server
- [ ] Repository cloned to `/opt/appforge`
- [ ] `.env.production` generated with secrets
- [ ] SSH certificates installed
- [ ] DNS configured
- [ ] Firewall rules applied (22, 80, 443)

### Deployment
- [ ] Deployment script executed successfully
- [ ] Health check passing
- [ ] All 5 services running
- [ ] SSL certificate valid
- [ ] Frontend accessible
- [ ] API health endpoint responding

### Post-Deployment
- [ ] Automated backups configured
- [ ] Monitoring configured
- [ ] Log rotation configured
- [ ] SSL auto-renewal enabled
- [ ] GitHub secrets configured
- [ ] CI/CD pipeline tested

---

## Important Files

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production configuration |
| `.env.production.example` | Environment template |
| `scripts/deploy-production.sh` | Deployment automation |
| `scripts/setup-production.sh` | Secret generation |
| `scripts/backup-mongodb.sh` | Database backups |
| `scripts/health-check.sh` | Service monitoring |
| `backend/nginx/nginx.conf` | Reverse proxy config |
| `PRODUCTION_SERVER_SETUP.md` | Detailed setup guide |

---

## Support Resources

- Docker: https://docs.docker.com/
- Let's Encrypt: https://letsencrypt.org/
- MongoDB: https://docs.mongodb.com/
- Nginx: https://nginx.org/
- GitHub Actions: https://docs.github.com/en/actions
- Ubuntu: https://ubuntu.com/

---

**🎉 Your production deployment is complete! Your application is now live.**

**Next:** Monitor logs, setup alerts, and configure any additional services (email, analytics, etc.)
