# AppForge Final Deployment Guide

Complete step-by-step deployment instructions for AppForge in production environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
  - [Option A: Docker Deployment (Recommended)](#option-a-docker-deployment-recommended)
  - [Option B: VPS/Cloud Deployment](#option-b-vpscloud-deployment)
  - [Option C: Kubernetes Deployment](#option-c-kubernetes-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Troubleshooting](#troubleshooting)
- [Performance Tuning](#performance-tuning)
- [Security Checklist](#security-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Storage | 50 GB SSD | 100+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Required Software

- **Node.js** 18.x or higher
- **Python** 3.10 or higher
- **PostgreSQL** 14 or higher
- **Redis** 6.x or higher
- **Docker** 24.x (for containerized deployment)
- **Docker Compose** 2.x (for containerized deployment)

### Required Accounts & API Keys

- [ ] Database credentials (PostgreSQL)
- [ ] Redis credentials
- [ ] JWT secret key
- [ ] LLM API keys (OpenRouter, Moonshot, OpenAI)
- [ ] Payment processor credentials (Stripe/Xendit)
- [ ] Email service credentials (SendGrid/AWS SES)
- [ ] SSL/TLS certificates

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/appforge.git
cd appforge
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**LLM Gateway:**
```bash
cd llm
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Environment Variables

Create `.env.production` file:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/appforge
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=your-redis-password

# Server
PORT=5000
WEBSOCKET_PORT=5001
NODE_ENV=production
API_VERSION=v1

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS
ALLOWED_ORIGINS=https://appforge.io,https://www.appforge.io

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# LLM Gateway
LLM_API_URL=http://localhost:8000
OPENROUTER_API_KEY=your-openrouter-key
MOONSHOT_API_KEY=your-moonshot-key
OPENAI_API_KEY=your-openai-key

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@appforge.io

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
XENDIT_SECRET_KEY=xnd_...

# Storage
S3_BUCKET=appforge-production
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info
```

### 4. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE appforge;"

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

---

## Deployment Options

### Option A: Docker Deployment (Recommended)

#### 1. Build Images

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Or build individually
docker build -t appforge-backend ./backend
docker build -t appforge-llm ./llm
docker build -t appforge-frontend ./frontend
```

#### 2. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: appforge
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - appforge-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - appforge-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: appforge-backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/appforge
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
    env_file:
      - .env.production
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - appforge-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  llm-gateway:
    image: appforge-llm:latest
    environment:
      - PYTHON_ENV=production
    env_file:
      - .env.production
    ports:
      - "8000:8000"
    networks:
      - appforge-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: appforge-frontend:latest
    ports:
      - "3000:3000"
    networks:
      - appforge-network
    deploy:
      replicas: 2

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
      - llm-gateway
    networks:
      - appforge-network

volumes:
  postgres_data:
  redis_data:

networks:
  appforge-network:
    driver: bridge
```

#### 3. Deploy

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3 --scale llm-gateway=2

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Update deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

### Option B: VPS/Cloud Deployment

#### 1. Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt install python3.10 python3-pip python3-venv -y

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y
```

#### 2. Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE appforge;
CREATE USER appforge WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE appforge TO appforge;
\q

# Enable external connections (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

#### 3. Configure Redis

```bash
sudo nano /etc/redis/redis.conf

# Set password
requirepass your-redis-password

# Enable persistence
appendonly yes

sudo systemctl restart redis
```

#### 4. Deploy Backend with PM2

```bash
cd /var/www/appforge/backend

# Install dependencies
npm install --production

# Run migrations
npm run migrate

# Start with PM2
pm2 start server.js --name "appforge-backend" \
  --instances max \
  --exec-mode cluster \
  --env production

# Save PM2 config
pm2 save
pm2 startup
```

#### 5. Deploy LLM Gateway

```bash
cd /var/www/appforge/llm

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start with PM2
pm2 start "python -m llm.chimera_server" --name "appforge-llm" \
  --instances 2 \
  --exec-mode cluster

pm2 save
```

#### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/appforge
```

```nginx
upstream backend {
    least_conn;
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
}

upstream llm {
    least_conn;
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name appforge.io www.appforge.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name appforge.io www.appforge.io;

    ssl_certificate /etc/nginx/ssl/appforge.crt;
    ssl_certificate_key /etc/nginx/ssl/appforge.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        root /var/www/appforge/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # LLM Gateway
    location /v1/ {
        proxy_pass http://llm;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Health checks
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/appforge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Option C: Kubernetes Deployment

#### 1. Create Namespace

```bash
kubectl create namespace appforge
```

#### 2. Create Secrets

```bash
kubectl create secret generic appforge-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=JWT_SECRET="..." \
  --from-literal=REDIS_PASSWORD="..." \
  --namespace appforge
```

#### 3. Deploy PostgreSQL

```yaml
# postgres-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: appforge
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: appforge-secrets
              key: DB_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: appforge-secrets
              key: DB_PASSWORD
        - name: POSTGRES_DB
          value: appforge
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
```

#### 4. Deploy Backend

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: appforge-backend
  namespace: appforge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: appforge/backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: appforge-secrets
              key: DATABASE_URL
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: appforge
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP
```

#### 5. Deploy Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: appforge-ingress
  namespace: appforge
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
spec:
  tls:
  - hosts:
    - appforge.io
    - www.appforge.io
    secretName: appforge-tls
  rules:
  - host: appforge.io
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 5000
      - path: /v1
        pathType: Prefix
        backend:
          service:
            name: llm-service
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 3000
```

#### 6. Apply Configurations

```bash
kubectl apply -f k8s/
```

---

## Post-Deployment Configuration

### 1. SSL/TLS Certificates

**Let's Encrypt (Certbot):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d appforge.io -d www.appforge.io
```

**Auto-renewal:**
```bash
sudo certbot renew --dry-run
```

### 2. Database Backups

**Automated backups with pg_dump:**
```bash
# Create backup script
sudo nano /opt/backup/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/appforge"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="appforge_backup_$DATE.sql"

# Create backup
pg_dump -U appforge appforge > "$BACKUP_DIR/$FILENAME"

# Compress
gzip "$BACKUP_DIR/$FILENAME"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/$FILENAME.gz" s3://appforge-backups/

# Keep only last 7 days
find $BACKUP_DIR -name "appforge_backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Add to crontab
crontab -e
0 2 * * * /opt/backup/backup-db.sh
```

### 3. Log Rotation

```bash
sudo nano /etc/logrotate.d/appforge
```

```
/var/log/appforge/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Symptoms:** 500 errors, connection timeouts

**Solutions:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U appforge -d appforge -c "SELECT 1;"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Verify firewall
sudo ufw allow 5432/tcp
```

#### 2. High Memory Usage

**Symptoms:** OOM kills, slow responses

**Solutions:**
```bash
# Check memory usage
pm2 monit

# Reduce PM2 instances
pm2 scale backend 2

# Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 3. SSL Certificate Issues

**Symptoms:** Browser warnings, HTTPS failures

**Solutions:**
```bash
# Check certificate
openssl x509 -in /etc/nginx/ssl/appforge.crt -text -noout

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect appforge.io:443
```

#### 4. WebSocket Connection Failures

**Symptoms:** Real-time features not working

**Solutions:**
```bash
# Check Nginx configuration
sudo nginx -t

# Verify WebSocket headers in Nginx
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";

# Check firewall
sudo ufw status
```

#### 5. LLM Gateway Timeouts

**Symptoms:** AI features timing out

**Solutions:**
```bash
# Check LLM service status
pm2 status appforge-llm

# Increase timeout in Nginx
proxy_read_timeout 300;
proxy_connect_timeout 300;

# Check API key validity
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/models
```

### Log Analysis

```bash
# Backend logs
pm2 logs appforge-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u appforge-backend -f

# Search for errors
pm2 logs | grep ERROR
```

---

## Performance Tuning

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_projects_owner ON projects(owner_id);
CREATE INDEX CONCURRENTLY idx_analytics_created ON analytics_events(created_at);

-- Update statistics
ANALYZE;

-- Configure PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
```

```conf
# Memory settings
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 256MB
maintenance_work_mem = 1GB

# Connection settings
max_connections = 200

# Query planner
effective_io_concurrency = 200
random_page_cost = 1.1
```

### Node.js Optimization

```bash
# Set environment variables
export NODE_OPTIONS="--max-old-space-size=4096"
export UV_THREADPOOL_SIZE=128

# PM2 cluster mode
pm2 start server.js -i max

# Enable gzip
npm install compression
```

### Nginx Optimization

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

### Redis Optimization

```bash
sudo nano /etc/redis/redis.conf
```

```conf
# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Connections
tcp-keepalive 300
timeout 0
```

### Caching Strategy

```javascript
// Backend caching example
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await redis.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      redis.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};

// Use for static data
app.get('/api/v1/categories', cacheMiddleware(3600), getCategories);
```

---

## Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Enable firewall (ufw/iptables)
- [ ] Configure fail2ban
- [ ] Set up SSL/TLS certificates
- [ ] Remove development dependencies
- [ ] Disable debug mode
- [ ] Review CORS settings
- [ ] Set secure HTTP headers

### Post-Deployment

- [ ] Enable automatic security updates
- [ ] Configure log monitoring
- [ ] Set up intrusion detection
- [ ] Enable DDoS protection (Cloudflare)
- [ ] Configure backup encryption
- [ ] Set up security scanning (Snyk, Dependabot)
- [ ] Enable audit logging

### Security Commands

```bash
# Enable firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Security scan
npm audit
pip safety check

# Check for secrets
git-secrets --scan
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl https://appforge.io/health

# LLM gateway health
curl https://appforge.io/v1/health

# Database health
psql -U appforge -c "SELECT now();"
```

### Automated Monitoring

**Setup Uptime Monitoring:**
```bash
# Using Uptime Kuma or similar
# Monitor endpoints:
# - https://appforge.io/health
# - https://appforge.io/api/v1/health
# - https://appforge.io/v1/health
```

**Setup Alerts:**
```bash
# Configure alerting for:
# - High CPU usage (>80%)
# - High memory usage (>80%)
# - Disk space (>90%)
# - 5xx errors
# - Response time (>2s)
```

### Maintenance Tasks

**Daily:**
- Check error logs
- Monitor resource usage
- Verify backups

**Weekly:**
- Review security updates
- Analyze performance metrics
- Clean up old logs

**Monthly:**
- Update dependencies
- Review access logs
- Test disaster recovery

---

## Quick Reference

### Useful Commands

```bash
# Restart services
pm2 restart all
docker-compose restart
kubectl rollout restart deployment/backend

# View logs
pm2 logs
docker-compose logs -f
kubectl logs -f deployment/backend

# Scale services
pm2 scale backend 4
docker-compose up -d --scale backend=4
kubectl scale deployment backend --replicas=4

# Database operations
npm run migrate
npm run migrate:rollback
npm run seed

# Clear cache
redis-cli FLUSHDB
```

### Emergency Procedures

**Service Down:**
1. Check service status: `pm2 status` / `docker ps`
2. Check logs for errors
3. Restart service
4. If persists, rollback to previous version

**Database Corruption:**
1. Stop application
2. Restore from latest backup
3. Verify data integrity
4. Restart application

**Security Breach:**
1. Isolate affected systems
2. Rotate all credentials
3. Review access logs
4. Patch vulnerabilities
5. Notify affected users

---

**Last Updated:** March 2026
