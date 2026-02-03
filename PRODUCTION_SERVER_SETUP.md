# Production Server Setup Guide

## Prerequisites Installation

### 1. Install Docker & Docker Compose

#### Windows (Recommended: Docker Desktop)

**Option A: Docker Desktop (Easiest)**
```powershell
# Download from: https://www.docker.com/products/docker-desktop
# Or via Windows Package Manager:
winget install Docker.DockerDesktop

# Verify installation
docker --version
docker compose version
```

**Option B: Docker Engine (Server only, no GUI)**
```powershell
# Install via Windows Package Manager
winget install Docker.CLI

# For actual Docker daemon, use WSL 2 with Ubuntu:
wsl --install
# Then install Docker in WSL: apt-get install docker.io docker-compose
```

#### Linux (Ubuntu/Debian)

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Add your user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version

# Start Docker daemon
sudo systemctl start docker
sudo systemctl enable docker
```

#### Linux (CentOS/RHEL)

```bash
# Install Docker
sudo yum install -y docker docker-compose

# Start Docker daemon
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### macOS

```bash
# Via Homebrew
brew install docker docker-compose

# Or download Docker Desktop: https://www.docker.com/products/docker-desktop

# Verify
docker --version
docker compose version
```

---

### 2. Install Git

#### Windows
```powershell
winget install Git.Git
```

#### Linux/macOS
```bash
# Ubuntu/Debian
sudo apt-get install git

# CentOS/RHEL
sudo yum install git

# macOS
brew install git
```

---

### 3. Install Node.js (for local development only)

#### Windows
```powershell
winget install OpenJS.NodeJS.LTS
```

#### Linux/macOS
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node@20
```

---

## Server Setup

### Step 1: Clone Repository

```bash
cd /opt
sudo git clone https://github.com/yourusername/appforge.git
cd appforge
```

### Step 2: Generate Production Secrets

```bash
# Make script executable
chmod +x scripts/setup-production.sh

# Generate secrets (creates .env.production)
./scripts/setup-production.sh
```

**Output:**
```
✅ Generated .env.production with secure secrets:
- JWT_SECRET: (64-byte hex)
- ENCRYPTION_KEY: (32-byte hex)
- MONGO_PASSWORD: (32-byte base64)
- REDIS_PASSWORD: (32-byte base64)
```

### Step 3: Configure Environment

Edit `.env.production`:

```bash
nano .env.production
```

**Update these critical values:**

```env
# Domains
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
WS_URL=wss://api.yourdomain.com

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe (payment processing)
STRIPE_SECRET_KEY=sk_live_xxxx

# Sentry (error tracking)
SENTRY_DSN=https://xxxx@sentry.io/xxxx

# Logging
LOG_LEVEL=info
```

### Step 4: Setup SSL Certificates (Let's Encrypt)

**On Linux:**
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Certificates stored in:
# /etc/letsencrypt/live/yourdomain.com/
```

**Update `.env.production`:**
```env
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

**On Windows (use AWS Certificate Manager or commercial cert):**
- Get certificate from your provider
- Copy to `backend/certs/` directory
- Update paths in `.env.production`

### Step 5: Configure DNS

Point your domain to your server:

```
A Record:
yourdomain.com      → your-server-ip
www.yourdomain.com  → your-server-ip
api.yourdomain.com  → your-server-ip
```

Verify with:
```bash
nslookup yourdomain.com
dig yourdomain.com
```

### Step 6: Configure Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Or on AWS/Azure/GCP security groups:
# Inbound: SSH (22), HTTP (80), HTTPS (443)
# Outbound: All
```

---

## Deployment

### Option 1: Manual Deployment

```bash
# Navigate to project
cd /opt/appforge

# Pull latest code
git pull origin main

# Make deployment script executable
chmod +x scripts/deploy-production.sh

# Deploy
./scripts/deploy-production.sh
```

**Expected output:**
```
✅ Validating environment variables...
✅ Pulling latest code...
✅ Building Docker images...
✅ Starting services...
✅ Health check passed!
✅ Deployment successful
```

### Option 2: Automated Deployment (CI/CD)

Configure GitHub Actions with these secrets:

```bash
# GitHub Secrets (Settings → Secrets → New repository secret)
PROD_HOST=your-server-ip-or-domain
PROD_USERNAME=ubuntu
PROD_SSH_KEY=<your-private-ssh-key>
PROD_URL=https://yourdomain.com
```

Then every push to `main` automatically deploys.

---

## Verification

### Check Service Status

```bash
# View all containers
docker ps

# View specific service
docker ps | grep appforge

# Expected output:
# appforge-frontend    - React SPA
# appforge-backend     - Node.js API
# appforge-mongodb     - Database
# appforge-redis       - Cache
# appforge-nginx       - Reverse proxy
```

### Run Health Check

```bash
./scripts/health-check.sh
```

**Expected output:**
```
✅ Backend API is healthy
✅ Frontend is healthy
✅ MongoDB is healthy
✅ Redis is healthy
✅ All services are healthy
```

### Test Endpoints

```bash
# Health check
curl https://yourdomain.com/api/health

# Frontend
curl https://yourdomain.com

# API docs (if enabled)
curl https://yourdomain.com/api/docs
```

---

## Post-Deployment Setup

### 1. Setup Automated Backups

```bash
# Create backup directory
sudo mkdir -p /backups/mongodb
sudo chown ubuntu:ubuntu /backups/mongodb

# Make backup script executable
chmod +x scripts/backup-mongodb.sh

# Test backup
./scripts/backup-mongodb.sh

# Setup automated daily backups (2 AM)
crontab -e

# Add this line:
0 2 * * * /opt/appforge/scripts/backup-mongodb.sh
```

### 2. Setup Monitoring & Alerts

```bash
# Configure Sentry in .env.production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Setup Slack alerts
# In scripts/health-check.sh, set:
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Test alert
SLACK_WEBHOOK_URL=... ./scripts/health-check.sh
```

### 3. Configure Email Notifications

```bash
# For Gmail:
1. Enable 2FA on Gmail
2. Create App Password: myaccount.google.com/apppasswords
3. Add to .env.production:
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=<16-character-app-password>
```

### 4. Setup Log Rotation

```bash
# Create logrotate config
sudo tee /etc/logrotate.d/appforge > /dev/null <<EOF
/opt/appforge/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        docker exec appforge-backend kill -SIGUSR1 1
    endscript
}
EOF

# Test rotation
sudo logrotate -f /etc/logrotate.d/appforge
```

---

## Maintenance

### Update Application

```bash
cd /opt/appforge

# Pull latest code
git pull origin main

# Deploy update
./scripts/deploy-production.sh

# Verify
./scripts/health-check.sh
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100

# Combine services
docker compose -f docker-compose.prod.yml logs -f backend mongodb
```

### Database Backup & Restore

```bash
# Manual backup
./scripts/backup-mongodb.sh

# List backups
ls /backups/mongodb/

# Restore from backup
docker exec -i appforge-mongodb mongorestore \
  --uri "mongodb://localhost:27017/appforge" \
  /backup/dump_20260203_020000
```

### Scaling

```bash
# Scale backend to 3 instances
docker compose -f docker-compose.prod.yml up -d --scale backend=3

# Check load balancing
docker compose -f docker-compose.prod.yml ps
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs appforge-backend

# Full error output
docker compose -f docker-compose.prod.yml logs backend

# Restart container
docker compose -f docker-compose.prod.yml restart backend
```

### Database connection failed

```bash
# Check MongoDB status
docker exec appforge-mongodb mongosh --eval "db.adminCommand('ping')"

# Check connection string
grep MONGODB_URI .env.production

# Verify database exists
docker exec appforge-mongodb mongosh --eval "show dbs"
```

### Nginx errors

```bash
# Test nginx config
docker exec appforge-nginx nginx -t

# View nginx logs
docker logs appforge-nginx

# Check port bindings
netstat -tlnp | grep -E ':80|:443'
```

### Out of disk space

```bash
# Check disk usage
df -h
du -sh /backups/mongodb

# Clean Docker system
docker system prune -a --volumes

# Remove old backups
find /backups/mongodb -name "*.tar.gz" -mtime +30 -delete
```

### Service timeouts

```bash
# Check resource usage
docker stats

# View resource limits
docker inspect appforge-backend | grep -A 10 "HostConfig"

# Increase resource limits in docker-compose.prod.yml
# Restart: docker compose -f docker-compose.prod.yml restart
```

---

## Security Hardening

### 1. SSH Security

```bash
# Disable password auth (use SSH keys only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Change SSH port (optional)
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2. Firewall Rules

```bash
# UFW (Ubuntu)
sudo ufw limit 22/tcp       # Limit SSH attempts
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# iptables (alternative)
sudo iptables -A INPUT -p tcp --dport 22 -m limit --limit 1/m --limit-burst 3 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j DROP
```

### 3. SSL/TLS Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renewal setup (automatic with certbot)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check renewal status
sudo certbot certificates
```

### 4. Secrets Management

```bash
# Ensure .env.production has restricted permissions
chmod 600 .env.production

# Never commit secrets to git
echo ".env.production" >> .gitignore

# Use environment variable secrets for CI/CD
# GitHub Secrets: Settings → Secrets and variables
```

---

## Performance Optimization

### Database Indexes

Already created in `backend/scripts/mongo-init.js`:

```javascript
// Verify indexes
docker exec appforge-mongodb mongosh <<EOF
use appforge
db.userstates.getIndexes()
db.analytics.getIndexes()
db.synclogs.getIndexes()
db.users.getIndexes()
EOF
```

### Caching Strategy

```bash
# Redis is configured for:
# - Session storage (1 hour TTL)
# - API response caching
# - Rate limiting

# Check Redis memory
docker exec appforge-redis redis-cli INFO memory

# Clear cache (if needed)
docker exec appforge-redis redis-cli FLUSHALL
```

### CDN Setup (Optional)

```bash
# For static assets, configure CloudFront (AWS) or Cloudflare
# Update .env.production:
CDN_URL=https://cdn.yourdomain.com
```

---

## Monitoring & Alerts

### Health Check Monitoring

```bash
# Add to cron (every 5 minutes)
*/5 * * * * /opt/appforge/scripts/health-check.sh >> /var/log/appforge-health.log 2>&1

# View health history
tail -100 /var/log/appforge-health.log
```

### Setup Prometheus (Advanced)

```yaml
# optional: prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'appforge-backend'
    static_configs:
      - targets: ['localhost:5000']
```

---

## Checklist

- [ ] Docker & Docker Compose installed
- [ ] Git configured
- [ ] Repository cloned
- [ ] `.env.production` generated and configured
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] Firewall rules applied
- [ ] Deployment script executed
- [ ] Health check passing
- [ ] Backups configured
- [ ] Monitoring configured
- [ ] Security hardening completed
- [ ] CI/CD pipeline configured

---

## Support & Documentation

- Full deployment guide: See `DEPLOYMENT_COMPLETE.md`
- Troubleshooting: See `QUICK_REFERENCE.md`
- Docker docs: https://docs.docker.com/
- Let's Encrypt: https://letsencrypt.org/
- MongoDB: https://docs.mongodb.com/
- Nginx: https://nginx.org/en/docs/

---

**Your production server is ready for deployment!** 🚀
