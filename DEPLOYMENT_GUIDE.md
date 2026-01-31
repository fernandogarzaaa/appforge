# 🚀 AppForge Production Deployment Guide

Complete guide to deploying AppForge in production with Docker.

## 📋 Prerequisites

- Server with Docker and Docker Compose installed (Ubuntu 22.04 recommended)
- Domain name (optional, but recommended)
- 2GB+ RAM, 20GB+ disk space
- Ports 80, 443, 5000, 5001, 5173 available

## 🎯 Deployment Options

### Option 1: Full Docker Stack (Recommended)

Deploy everything with Docker Compose - fastest and easiest way.

### Option 2: Cloud Managed Services

Use managed databases (AWS RDS, DigitalOcean Managed DB) with Docker for app.

### Option 3: Traditional Server

Install all dependencies directly on server without Docker.

---

## 🚀 Option 1: Full Docker Stack Deployment

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/your-username/appforge.git
cd appforge/backend

# Or download and extract
wget https://github.com/your-username/appforge/archive/main.zip
unzip main.zip
cd appforge-main/backend
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Production Environment Variables:**

```env
# Server Configuration
NODE_ENV=production
PORT=5000
WS_PORT=5001
FRONTEND_URL=https://yourdomain.com

# MongoDB (Docker container)
MONGODB_URI=mongodb://appforge_user:CHANGE_THIS_PASSWORD@mongodb:27017/appforge?authSource=admin

# PostgreSQL (Docker container)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=appforge
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD

# Redis (Docker container)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets (MUST CHANGE)
JWT_SECRET=GENERATE_STRONG_32_CHARACTER_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_ANOTHER_STRONG_SECRET_HERE
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Stripe (Production keys)
STRIPE_SECRET_KEY=sk_live_your_production_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_production_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (Production SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# API Keys
OPENAI_API_KEY=sk-your_production_openai_key
GITHUB_TOKEN=ghp_your_github_token
GITLAB_TOKEN=glpat_your_gitlab_token

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

**Generate Strong Secrets:**

```bash
# Generate JWT secrets (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to JWT_SECRET

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to JWT_REFRESH_SECRET
```

### Step 4: Update Docker Compose for Production

Edit `docker-compose.yml` to use your domain:

```yaml
# Update frontend environment
frontend:
  environment:
    - VITE_API_URL=https://api.yourdomain.com
    - VITE_WS_URL=wss://ws.yourdomain.com
```

### Step 5: Start All Services

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 6: Run Database Migrations

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Verify databases
docker-compose exec mongodb mongosh -u appforge_user -p --authenticationDatabase admin
docker-compose exec postgres psql -U postgres -d appforge -c "\dt"
```

### Step 7: Verify Services

```bash
# Check API health
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "healthy",
#   "services": {
#     "mongodb": "connected",
#     "postgres": "connected",
#     "redis": "connected"
#   }
# }

# Check frontend
curl http://localhost:5173

# Check all services
docker-compose ps
```

### Step 8: Configure Nginx Reverse Proxy

```bash
# Install Nginx (outside Docker)
sudo apt install nginx -y

# Create site configuration
sudo nano /etc/nginx/sites-available/appforge
```

**Nginx Configuration:**

```nginx
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Main application
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # File upload limit
    client_max_body_size 50M;
}
```

**Enable site:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/appforge /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 9: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts and enter your email

# Test auto-renewal
sudo certbot renew --dry-run

# Certbot will auto-renew certificates
```

### Step 10: Set Up Auto-Restart

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Update docker-compose.yml restart policies (already set to "always")
# Services will auto-restart on failure or server reboot
```

---

## 🔧 Option 2: Cloud Managed Services

Use managed databases for better reliability and backups.

### AWS Deployment

#### 1. Create RDS PostgreSQL Database

```bash
# In AWS Console:
# RDS → Create Database → PostgreSQL 16
# Instance class: db.t3.micro (free tier) or db.t3.small
# Storage: 20GB
# Enable automatic backups
# Note connection endpoint
```

#### 2. Create DocumentDB (MongoDB-compatible)

```bash
# In AWS Console:
# DocumentDB → Create Cluster
# Instance class: db.t3.medium
# Note connection string
```

#### 3. Update Environment Variables

```env
# Use AWS endpoints
MONGODB_URI=mongodb://username:password@docdb-cluster.cluster-xxxxx.us-east-1.docdb.amazonaws.com:27017/appforge?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred
POSTGRES_HOST=your-postgres.xxxxx.us-east-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=appforge
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

#### 4. Deploy to EC2

```bash
# Launch EC2 instance (Ubuntu 22.04, t2.medium)
# Follow Steps 1-6 from Docker deployment
# Skip MongoDB and PostgreSQL containers in docker-compose.yml
```

### DigitalOcean Deployment

#### 1. Create Managed Databases

```bash
# DigitalOcean Control Panel:
# Databases → Create Database Cluster
# - PostgreSQL 16, 1GB RAM
# - MongoDB 7, 1GB RAM
# Note connection strings
```

#### 2. Deploy App

```bash
# Option A: Droplet
# Create Ubuntu 22.04 Droplet (2GB RAM)
# Follow Docker deployment steps

# Option B: App Platform
# Connect GitHub repository
# Set environment variables in UI
# Auto-deploys on git push
```

### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create appforge-production

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Add MongoDB (mLab)
heroku addons:create mongolab:sandbox

# Add Redis
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set STRIPE_SECRET_KEY=sk_live_your_key

# Deploy
git push heroku main

# Scale
heroku ps:scale web=1

# View logs
heroku logs --tail
```

---

## 📊 Post-Deployment

### Monitor Services

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f mongodb
docker-compose logs -f postgres

# Resource usage
docker stats

# Disk usage
df -h
docker system df
```

### Set Up Monitoring

#### Option A: PM2 (if not using Docker)

```bash
npm install -g pm2
pm2 start backend/server.js --name appforge-backend
pm2 startup
pm2 save
```

#### Option B: New Relic

```bash
# Install New Relic agent
npm install newrelic

# Configure newrelic.js
# Add to server.js: require('newrelic')
```

#### Option C: Datadog

```bash
# Install Datadog agent
DD_API_KEY=your_key bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

### Set Up Database Backups

```bash
# PostgreSQL backup script
cat > /usr/local/bin/backup-postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/backups/postgres
mkdir -p $BACKUP_DIR
docker-compose exec -T postgres pg_dump -U postgres appforge > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql
# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-postgres.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-postgres.sh") | crontab -

# MongoDB backup
cat > /usr/local/bin/backup-mongodb.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/backups/mongodb
mkdir -p $BACKUP_DIR
docker-compose exec -T mongodb mongodump --uri="mongodb://appforge_user:password@localhost:27017/appforge?authSource=admin" --out=$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +
EOF

chmod +x /usr/local/bin/backup-mongodb.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-mongodb.sh") | crontab -
```

### Configure Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/appforge
```

```
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
}

/path/to/appforge/backend/logs/*.log {
    daily
    rotate 14
    missingok
    notifempty
    compress
    delaycompress
    create 0640 node node
}
```

---

## 🔒 Security Checklist

### Pre-Production Security

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up firewall (UFW or AWS Security Groups)
- [ ] Enable rate limiting
- [ ] Disable unnecessary services
- [ ] Set up database access controls
- [ ] Enable audit logging
- [ ] Configure CORS properly
- [ ] Set secure headers (Helmet.js enabled)
- [ ] Enable Docker security scanning

### Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### Database Security

```bash
# Change MongoDB admin password
docker-compose exec mongodb mongosh admin
> db.changeUserPassword("admin", "new_strong_password")

# Change PostgreSQL password
docker-compose exec postgres psql -U postgres
postgres=# ALTER USER postgres PASSWORD 'new_strong_password';
```

---

## 🧪 Testing Production Deployment

### Health Checks

```bash
# API health
curl https://yourdomain.com/api/health

# Frontend
curl -I https://yourdomain.com

# WebSocket (requires wscat)
npm install -g wscat
wscat -c wss://yourdomain.com/ws
```

### Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Test API
ab -n 1000 -c 10 https://yourdomain.com/api/health

# Install k6 for advanced testing
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Run load test
k6 run loadtest.js
```

---

## 🚨 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs backend

# Check disk space
df -h

# Check memory
free -h

# Restart specific service
docker-compose restart backend
```

### Database Connection Issues

```bash
# Test MongoDB connection
docker-compose exec mongodb mongosh -u appforge_user -p

# Test PostgreSQL connection
docker-compose exec postgres psql -U postgres -d appforge

# Check environment variables
docker-compose exec backend printenv | grep -i mongo
docker-compose exec backend printenv | grep -i postgres
```

### High Memory Usage

```bash
# Check container resource usage
docker stats

# Limit container memory (in docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiration
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

---

## 📈 Performance Optimization

### Enable Gzip Compression

Already enabled in Nginx configuration.

### Set Up CDN

Use Cloudflare or AWS CloudFront for static assets.

### Database Optimization

```sql
-- PostgreSQL: Analyze tables
ANALYZE;

-- Create indexes for slow queries
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- MongoDB: Create indexes
db.projects.createIndex({ userId: 1 });
db.entities.createIndex({ projectId: 1 });
```

### Enable Redis Caching

```javascript
// Already configured in backend
// Redis used for session storage and caching
```

---

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run any new migrations
docker-compose exec backend npm run migrate
```

### Update Docker Images

```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Clean old images
docker image prune -a
```

### Database Maintenance

```bash
# PostgreSQL vacuum
docker-compose exec postgres psql -U postgres -d appforge -c "VACUUM ANALYZE;"

# MongoDB compact
docker-compose exec mongodb mongosh appforge --eval "db.runCommand({ compact: 'projects' })"
```

---

## 📞 Support & Resources

- **Documentation**: `/backend/README.md`
- **API Docs**: `/backend/API_DOCUMENTATION.md`
- **Issues**: GitHub Issues
- **Health Check**: `https://yourdomain.com/api/health`

---

**Deployment Status**: ✅ Production Ready

Your AppForge backend is now fully deployed and production-ready!
