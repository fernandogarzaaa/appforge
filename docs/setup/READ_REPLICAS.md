# Read Replicas Configuration Guide

## Overview

AppForge supports database read replicas for MongoDB and PostgreSQL to distribute read traffic and improve performance.

## MongoDB Read Replicas

### Configuration

Add to `.env`:

```bash
# MongoDB Primary (Write operations)
MONGODB_URI=mongodb://primary-host:27017/appforge

# MongoDB Read Replica (Read operations)
MONGODB_READ_REPLICA_URI=mongodb://replica-host:27018/appforge

# Connection Pool Configuration
MONGODB_MAX_POOL_SIZE=50
```

### How It Works

1. **Read Preference**: Set to `secondaryPreferred`
   - Reads from replica when available
   - Falls back to primary if replica unavailable
   - Writes always go to primary

2. **Connection Pool**: Increased from 10 to 50
   - Handles more concurrent operations
   - Configurable via `MONGODB_MAX_POOL_SIZE`

### Example Setup

```bash
# Primary instance (write operations)
mongodb+srv://user:pass@primary-cluster.mongodb.net/appforge

# Read replica instance (read operations)
mongodb+srv://user:pass@replica-cluster.mongodb.net/appforge

# .env configuration
MONGODB_URI=mongodb+srv://user:pass@primary-cluster.mongodb.net/appforge
MONGODB_READ_REPLICA_URI=mongodb+srv://user:pass@replica-cluster.mongodb.net/appforge
MONGODB_MAX_POOL_SIZE=50
```

## PostgreSQL Read Replicas

### Configuration

Add to `.env`:

```bash
# PostgreSQL Primary (Write operations)
DB_HOST=primary.db.example.com
DB_PORT=5432
DB_USER=appforge_user
DB_PASSWORD=secure_password
DB_NAME=appforge

# PostgreSQL Read Replica (Read operations)
POSTGRES_READ_REPLICA_HOST=replica.db.example.com
POSTGRES_READ_REPLICA_PORT=5432
POSTGRES_READ_REPLICA_USER=appforge_user
POSTGRES_READ_REPLICA_PASSWORD=secure_password

# Connection Pool Configuration
POSTGRES_MAX_POOL_SIZE=50
POSTGRES_MIN_POOL_SIZE=5
```

### How It Works

1. **Read/Write Split**:
   - Reads routed to replica pool
   - Writes routed to primary pool
   - Automatic failover if replica unavailable

2. **Connection Pools**:
   - Primary pool: 5-50 connections
   - Replica pool: 5-50 connections (separate)

### Example Setup

```javascript
// Automatic routing happens in database.js
// No code changes needed!

// All reads go to replica if configured
const users = await User.find({ active: true });

// All writes go to primary
await User.create({ name: 'John' });
```

## Performance Impact

### Before Read Replicas
```
Single Database Instance
├─ Read Queries: 80% of load
├─ Write Queries: 20% of load
└─ Bottleneck: Single instance handles all traffic
```

### After Read Replicas
```
Primary (Writes) + Replica (Reads)
├─ Primary: Handles 20% writes only
├─ Replica: Handles 80% reads
└─ Benefit: 4x read capacity per instance
```

**Expected Improvements**:
- ✅ Read latency: -40%
- ✅ Query throughput: +300-400%
- ✅ Primary availability: +50% (less load)

## Monitoring Read Replicas

### MongoDB

```javascript
import mongoose from 'mongoose';

const client = mongoose.connection;
console.log('Primary:', client.host);
console.log('Read Preference:', client.readPreference);
console.log('Pool Size:', client.poolSize);
```

### PostgreSQL

```javascript
import { sequelize } from './models/index.js';

// Check replica configuration
const replication = sequelize.options.replication;
console.log('Write Host:', replication.write.host);
console.log('Read Hosts:', replication.read.map(r => r.host));
console.log('Pool Size:', sequelize.connectionManager.poolSize);
```

## Failover Handling

### Read Replica Down

```
Automatic Fallback:
1. Read request to replica fails
2. Connection is marked as stale
3. Retry with primary instance
4. Success ✅
5. Monitor replica health

Result: No data loss, transparent to application
```

### Primary Down

```
Cannot failover automatically:
1. Promotion of replica required
2. Update DNS/connection strings
3. Restart application with new primary

Prevention:
- Use managed database services (RDS, MongoDB Atlas)
- Implement automatic failover via cloud provider
```

## Troubleshooting

### Reads Going to Primary

If reads aren't using replica:

1. **Check configuration**:
   ```bash
   # Verify environment variables
   echo $MONGODB_READ_REPLICA_URI
   echo $POSTGRES_READ_REPLICA_HOST
   ```

2. **Verify replica connectivity**:
   ```bash
   # MongoDB
   mongosh mongodb://replica-host:27018

   # PostgreSQL
   psql -h replica.db.example.com -U appforge_user -d appforge
   ```

3. **Check application logs**:
   ```bash
   tail -f logs/database.log | grep -i replica
   ```

### Replication Lag

Monitor lag between primary and replica:

```sql
-- PostgreSQL: Check replication lag
SELECT 
  client_addr,
  state,
  write_lag,
  flush_lag,
  replay_lag
FROM pg_stat_replication;

-- MongoDB: Check replica set status
db.replSetGetStatus()
```

**Acceptable Lag**: < 1 second

**If Lag > 5 seconds**:
1. Check network bandwidth
2. Monitor replica CPU/memory
3. Check for long-running queries on primary
4. Consider read-only backup or cache layer

## Best Practices

### 1. Separate Read/Write Pools

Never mix read and write connections:

```javascript
// ❌ Bad - Same pool for all operations
const pool = new Pool({ max: 50 });
pool.query('SELECT * FROM users');  // Should use replica
pool.query('INSERT INTO users ...');  // Should use primary

// ✅ Good - Separate pools (automatic in config/database.js)
// Read queries automatically use replica pool
// Write queries automatically use primary pool
```

### 2. Monitor Replica Lag

```javascript
import cron from 'node-cron';

cron.schedule('*/5 * * * *', async () => {
  const lag = await checkReplicaLag();
  if (lag > 5000) {  // 5 seconds
    console.warn('⚠️ High replication lag:', lag, 'ms');
    // Consider switching to primary temporarily
  }
});
```

### 3. Plan for Failover

```javascript
// Graceful degradation when replica is down
async function readWithFallback(query) {
  try {
    // Try replica first
    return await queryReplica(query);
  } catch (error) {
    console.warn('Replica failed, falling back to primary:', error.message);
    return await queryPrimary(query);
  }
}
```

### 4. Load Balance Across Multiple Replicas

```bash
# .env with multiple read replicas
POSTGRES_READ_REPLICAS=replica1.db.example.com:5432,replica2.db.example.com:5432,replica3.db.example.com:5432
```

## Implementation Timeline

### Phase 1: Setup (Week 1)
- [ ] Create replica instances
- [ ] Configure replication
- [ ] Update .env files
- [ ] Test in staging

### Phase 2: Validation (Week 2)
- [ ] Monitor replica lag
- [ ] Load test read queries
- [ ] Verify failover handling
- [ ] Check query routing

### Phase 3: Production Deployment (Week 3)
- [ ] Deploy to production
- [ ] Monitor performance metrics
- [ ] Verify read throughput increase
- [ ] Document procedures

## Cost Estimation

**Monthly Cost** (AWS RDS example):

```
Primary Instance (db.t3.medium):    $150
Read Replica (db.t3.medium):        $150
Data Transfer:                       $100
Backup Storage:                      $50
─────────────────────────────────────────
Total:                               ~$450
```

**ROI**:
- Reduced infrastructure scaling needs
- Improved application performance
- Better user experience
- Easier to scale reads independently

## Managed Service Providers

### MongoDB

**MongoDB Atlas**:
```javascript
// Replica sets included in all clusters
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/appforge
MONGODB_READ_REPLICA_URI=mongodb+srv://user:pass@replica.mongodb.net/appforge
```

### PostgreSQL

**AWS RDS**:
```bash
# Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier appforge-read-replica \
  --source-db-instance-identifier appforge-primary
```

**Google Cloud SQL**:
```bash
# Create read replica
gcloud sql instances clone appforge-primary appforge-replica \
  --master-instance-name appforge-primary
```

## Support

- **MongoDB Replication**: https://docs.mongodb.com/manual/replication/
- **PostgreSQL Replication**: https://www.postgresql.org/docs/current/warm-standby.html
- **AWS RDS**: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html
- **GitHub Issues**: https://github.com/fernandogarzaaa/appforge/issues

---

**Last Updated**: February 3, 2026
