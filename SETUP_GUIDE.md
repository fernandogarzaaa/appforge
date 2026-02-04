# Integration: Exact Code Changes Required

## Only 2 Changes Needed in server.js

### Change 1: Add Import (around line 20)

**Location:** After existing route imports (around line 20)

```javascript
import marketplaceRoutes from './routes/marketplace.js';
```

Add this line after the other route imports:
```javascript
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import entityRoutes from './routes/entities.js';
import pageRoutes from './routes/pages.js';
import userRoutes from './routes/users.js';
import teamRoutes from './routes/teams.js';
import subscriptionRoutes from './routes/subscriptions.js';
import webhookRoutes from './routes/webhooks.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import marketplaceRoutes from './routes/marketplace.js';  // ← ADD THIS LINE
```

### Change 2: Mount Route (around line 140)

**Location:** After existing routes mounting (around line 140-145)

```javascript
app.use(`/api/${apiVersion}/marketplace`, marketplaceRoutes);
```

Add this line after the other route mounts:
```javascript
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/projects`, projectRoutes);
app.use(`/api/${apiVersion}/entities`, entityRoutes);
app.use(`/api/${apiVersion}/pages`, pageRoutes);
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/teams`, teamRoutes);
app.use(`/api/${apiVersion}/subscriptions`, subscriptionRoutes);
app.use(`/api/${apiVersion}/webhooks`, webhookRoutes);
app.use(`/api/${apiVersion}/marketplace`, marketplaceRoutes);  // ← ADD THIS LINE
```

---

## Environment Variables to Add

Add these to your `.env` file:

```env
# Marketplace Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# WebSocket Configuration
WEBSOCKET_PORT=5001
SESSION_TTL=3600
REDIS_URL=redis://localhost:6379

# Optional: AWS S3 Cloud Storage
AWS_ACCESS_KEY_ID=optional
AWS_SECRET_ACCESS_KEY=optional
AWS_S3_BUCKET=appforge-templates

# Optional: ClamAV Malware Scanning
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

---

## Package.json Dependencies

Add these to `package.json` in the `dependencies` section:

```json
{
  "dependencies": {
    "multer": "^1.4.5",
    "sharp": "^0.33.0",
    "stripe": "^14.0.0",
    "ioredis": "^5.3.2",
    "@socket.io/redis-adapter": "^8.2.1"
  }
}
```

Then run:
```bash
npm install
```

---

## Quick Start (5 Steps)

1. **Copy Files**
   ```bash
   # Copy all 13 code files from delivery
   cp -r backend/routes/marketplace.js your-project/
   cp -r backend/controllers/marketplace.js your-project/
   # ... etc
   ```

2. **Update server.js**
   ```javascript
   // Add 2 lines (see above)
   ```

3. **Configure .env**
   ```bash
   # Add 8 variables (see above)
   ```

4. **Install Dependencies**
   ```bash
   npm install multer sharp stripe ioredis @socket.io/redis-adapter
   ```

5. **Create Database Tables**
   ```bash
   psql < schema.sql
   ```

---

## That's It!

Done in 5 minutes. Everything else works automatically.

**Status: Ready to deploy**
