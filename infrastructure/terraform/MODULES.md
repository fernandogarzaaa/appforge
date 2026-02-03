# Terraform Modules Documentation

## Overview

This directory contains modular Terraform configurations for AppForge infrastructure on AWS. Each module is self-contained and can be used independently or combined to build complete environments.

## Modules

### 1. Networking Module (`networking/`)

**Purpose**: Foundation VPC infrastructure with public and private subnets across multiple availability zones.

**Key Resources**:
- VPC with DNS support
- Public subnets (3 AZs) with Internet Gateway
- Private subnets (3 AZs) with NAT Gateways
- Route tables and associations
- Security groups for ALB and ECS

**Usage**:
```hcl
module "networking" {
  source = "./modules/networking"
  
  environment = "production"
  cidr_block  = "10.0.0.0/16"
}
```

**Outputs**:
- `vpc_id` - VPC identifier
- `public_subnet_ids` - List of public subnet IDs
- `private_subnet_ids` - List of private subnet IDs
- `alb_security_group_id` - ALB security group ID
- `ecs_security_group_id` - ECS security group ID

---

### 2. Compute Module (`compute/`)

**Purpose**: Application deployment infrastructure with ECS Fargate, Application Load Balancer, and auto-scaling.

**Key Resources**:
- Application Load Balancer (HTTP/HTTPS)
- ECS Fargate cluster with Container Insights
- Task definitions with 512 CPU / 1024 MB memory
- Auto-scaling policies (1-10 tasks, CPU/Memory based)
- CloudWatch log groups
- IAM roles and policies

**Usage**:
```hcl
module "compute" {
  source = "./modules/compute"
  
  environment            = "production"
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  certificate_arn = aws_acm_certificate.main.arn
  domain_name     = "api.appforge.com"
}
```

**Outputs**:
- `alb_dns_name` - Load balancer DNS name
- `alb_zone_id` - Load balancer zone ID
- `ecs_cluster_id` - ECS cluster identifier
- `ecs_service_name` - ECS service name
- `target_group_arn` - Target group ARN

---

### 3. Database Module (`database/`)

**Purpose**: Managed PostgreSQL database with read replicas, encryption, and automated backups.

**Key Resources**:
- RDS PostgreSQL primary instance (Multi-AZ)
- Read replicas (configurable count, 1-5)
- DB subnet group across private subnets
- Parameter group with performance tuning
- KMS encryption key
- Enhanced monitoring with IAM role
- CloudWatch alarms for CPU, storage, connections

**Configuration Options**:

| Variable | Default | Description |
|----------|---------|-------------|
| `db_instance_class` | `db.t3.small` | Instance size (t3.micro, t3.small, t3.medium) |
| `allocated_storage` | `100` | Initial storage in GB |
| `max_allocated_storage` | `500` | Maximum storage for auto-scaling |
| `backup_retention_days` | `30` | Backup retention period |
| `multi_az` | `true` | Enable Multi-AZ deployment |
| `enable_read_replica` | `true` | Create read replicas |
| `read_replica_count` | `1` | Number of replicas (1-5) |

**Usage**:
```hcl
module "database" {
  source = "./modules/database"
  
  environment            = "production"
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  db_instance_class      = "db.t3.small"
  allocated_storage      = 100
  backup_retention_days  = 30
  multi_az              = true
  read_replica_count    = 2
  
  db_username = "appforge_admin"
  db_password = var.db_password # Use Terraform variable
}
```

**Outputs**:
- `primary_endpoint` - Primary database endpoint
- `primary_address` - Primary database host
- `replica_endpoints` - List of read replica endpoints
- `replica_addresses` - List of replica hosts
- `security_group_id` - Database security group
- `multi_az` - Multi-AZ status
- `kms_key_id` - Encryption key ID

**Connection String Format**:
```
postgres://username:password@hostname:5432/appforge
```

**Read Replica Configuration** (in application):
```javascript
const readHost = process.env.POSTGRES_READ_REPLICA_HOST;
const writeHost = process.env.POSTGRES_HOST;

// Use write host for INSERT/UPDATE/DELETE
// Use read host for SELECT queries
```

---

### 4. Cache Module (`cache/`)

**Purpose**: ElastiCache Redis or Memcached cluster with automatic failover, encryption, and monitoring.

**Key Resources**:
- ElastiCache replication group (Redis) or cluster (Memcached)
- Subnet group across private subnets
- Parameter group with performance tuning
- KMS encryption key
- CloudWatch log groups and alarms
- Security group for application access

**Configuration Options**:

| Variable | Default | Description |
|----------|---------|-------------|
| `engine` | `redis` | Cache engine (redis, memcached) |
| `engine_version` | `7.0` | Engine version |
| `node_type` | `cache.t4g.micro` | Node type |
| `num_cache_nodes` | `2` | Number of nodes |
| `multi_az_enabled` | `true` | Enable Multi-AZ |
| `automatic_failover_enabled` | `true` | Auto-failover for Redis |
| `snapshot_retention_limit` | `7` | Backup retention days |
| `enable_encryption` | `true` | Encryption at rest and in transit |
| `auth_token` | `null` | Authentication token |

**Redis Usage**:
```hcl
module "cache" {
  source = "./modules/cache"
  
  environment            = "production"
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  engine                = "redis"
  engine_version        = "7.0"
  node_type             = "cache.t4g.micro"
  num_cache_nodes       = 2
  multi_az_enabled      = true
  automatic_failover_enabled = true
}
```

**Connection Details**:
- Redis Primary: `endpoint:port` → Used for reads/writes
- Redis Reader: `reader_endpoint:port` → Used for read-only operations
- Memcached: All nodes available for load balancing

**Application Integration**:
```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_ENDPOINT,
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableOfflineQueue: true,
  maxRetriesPerRequest: null
});
```

**Outputs**:
- `redis_endpoint` - Primary Redis endpoint
- `redis_reader_endpoint` - Redis read-only endpoint
- `redis_port` - Redis port
- `redis_cluster_id` - Cluster identifier
- `memcached_endpoint` - Memcached endpoint (if using Memcached)
- `security_group_id` - Cache security group
- `kms_key_id` - Encryption key ID

---

### 5. CDN Module (`cdn/`)

**Purpose**: CloudFront distribution for static assets and API caching with SSL/TLS termination.

**Key Resources**:
- CloudFront distribution with HTTP/3 support
- Origins: ALB (primary) and S3 (optional)
- Origin Access Identity for S3
- Managed cache policies (optimized, disabled)
- SSL/TLS certificate from ACM
- CloudWatch alarms for error rates and latency

**Configuration Options**:

| Variable | Default | Description |
|----------|---------|-------------|
| `domain_name` | - | Primary domain name |
| `certificate_arn` | - | ACM certificate ARN |
| `alb_dns_name` | - | ALB DNS name |
| `price_class` | `PriceClass_100` | CloudFront price class |
| `default_ttl` | `86400` | Default cache TTL (seconds) |
| `enable_s3_origin` | `false` | Use S3 for static assets |
| `enable_waf` | `false` | Enable WAF integration |
| `enable_logging` | `true` | CloudFront access logs |

**Usage**:
```hcl
module "cdn" {
  source = "./modules/cdn"
  
  environment     = "production"
  domain_name     = "api.appforge.com"
  certificate_arn = aws_acm_certificate.main.arn
  alb_dns_name    = module.compute.alb_dns_name
  
  price_class        = "PriceClass_100"
  enable_s3_origin   = true
  s3_bucket_domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
  
  enable_waf = true
  waf_acl_arn = aws_wafv2_web_acl.main.arn
}
```

**Cache Behaviors**:

1. **Default (HTML/API)**
   - Paths: All except `/assets/*`, `/static/*`, `/api/*`
   - Methods: GET, HEAD, OPTIONS
   - Policy: Managed-CachingOptimized
   - TTL: 1 day

2. **Static Assets**
   - Paths: `/assets/*`, `/static/*`
   - Methods: GET, HEAD
   - Policy: Managed-CachingOptimized
   - TTL: 1 year

3. **API**
   - Paths: `/api/*`
   - Methods: All (GET, POST, PUT, DELETE, PATCH, OPTIONS)
   - Policy: Managed-CachingDisabled
   - TTL: 0 (no caching)

**Outputs**:
- `distribution_id` - CloudFront distribution ID
- `distribution_arn` - Distribution ARN
- `domain_name` - CloudFront domain name
- `status` - Distribution status (Deployed/InProgress)
- `aliases` - CNAME aliases

**DNS Configuration**:
```
Alias Record: api.appforge.com
Target: d12345abcde.cloudfront.net (CloudFront domain)
```

---

### 6. Monitoring Module (`monitoring/`)

**Purpose**: CloudWatch dashboards, alarms, log groups, and insights for comprehensive observability.

**Key Resources**:
- CloudWatch log groups for application and ECS logs
- SNS topic for alarm notifications
- CloudWatch alarms for ECS metrics (CPU, memory, task count)
- CloudWatch dashboard with 4 key visualizations
- CloudWatch Logs Insights query definitions
- Composite alarm for overall system health

**Configuration Options**:

| Variable | Default | Description |
|----------|---------|-------------|
| `log_retention_days` | `30` | Log retention period |
| `enable_detailed_monitoring` | `true` | 1-minute metric intervals |
| `enable_sns_alerts` | `true` | SNS notifications |
| `alert_email` | - | Email for SNS subscriptions |
| `cpu_threshold` | `80` | CPU alarm threshold (%) |
| `memory_threshold` | `80` | Memory alarm threshold (%) |
| `enable_dashboard` | `true` | Create CloudWatch dashboard |
| `enable_log_insights` | `true` | Create Logs Insights queries |

**Usage**:
```hcl
module "monitoring" {
  source = "./modules/monitoring"
  
  environment            = "production"
  ecs_cluster_name      = module.compute.ecs_cluster_id
  ecs_service_name      = module.compute.ecs_service_name
  alb_target_group_arn  = module.compute.target_group_arn
  
  log_retention_days    = 30
  enable_detailed_monitoring = true
  enable_sns_alerts     = true
  alert_email          = "alerts@appforge.com"
  
  cpu_threshold         = 80
  memory_threshold      = 80
}
```

**Dashboard Widgets**:

1. **ECS Service Metrics**
   - CPU Utilization (%)
   - Memory Utilization (%)
   - Running Task Count

2. **Log Levels Distribution**
   - CloudWatch Logs Insights query
   - Groups logs by ERROR, WARN, INFO, DEBUG

3. **Application Error Rates**
   - 4xx error count
   - 5xx error count
   - Total request count

4. **Target Response Time**
   - Average latency from ALB

**CloudWatch Alarms**:

| Alarm | Metric | Threshold | Action |
|-------|--------|-----------|--------|
| CPU High | CPUUtilization | > 80% | SNS → Email |
| Memory High | MemoryUtilization | > 80% | SNS → Email |
| Task Count Low | RunningCount | < 1 | SNS → Email |
| Unhealthy Hosts | UnHealthyHostCount | > 0 | SNS → Email |

**CloudWatch Logs Insights Queries**:

1. **Error Logs** - Groups errors by error code
2. **Performance Analysis** - Calculates avg, max, p95, p99 latency
3. **Request Count** - Groups requests by method and status code
4. **Slow Queries** - Finds database queries exceeding 1 second

**Outputs**:
- `log_group_app_name` - Application log group
- `log_group_ecs_tasks_name` - ECS task log group
- `sns_topic_arn` - Alert SNS topic
- `dashboard_url` - CloudWatch dashboard URL
- `cpu_alarm_arn`, `memory_alarm_arn`, `task_count_alarm_arn` - Alarm ARNs

---

## Complete Root Configuration

Example main Terraform file combining all modules:

```hcl
# variables.tf
variable "environment" {
  default = "production"
}

variable "db_password" {
  sensitive = true
}

# main.tf
module "networking" {
  source = "./modules/networking"
  environment = var.environment
}

module "compute" {
  source = "./modules/compute"
  environment = var.environment
  vpc_id = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  private_subnet_ids = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  certificate_arn = aws_acm_certificate.main.arn
  domain_name = "api.appforge.com"
}

module "database" {
  source = "./modules/database"
  environment = var.environment
  vpc_id = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  db_password = var.db_password
  read_replica_count = 2
}

module "cache" {
  source = "./modules/cache"
  environment = var.environment
  vpc_id = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  engine = "redis"
  num_cache_nodes = 2
}

module "cdn" {
  source = "./modules/cdn"
  environment = var.environment
  domain_name = "api.appforge.com"
  certificate_arn = aws_acm_certificate.main.arn
  alb_dns_name = module.compute.alb_dns_name
}

module "monitoring" {
  source = "./modules/monitoring"
  environment = var.environment
  ecs_cluster_name = module.compute.ecs_cluster_id
  ecs_service_name = module.compute.ecs_service_name
  alb_target_group_arn = module.compute.target_group_arn
  
  alert_email = "alerts@appforge.com"
}
```

---

## Deployment Workflow

### Step 1: Networking Foundation
```bash
cd infrastructure/terraform
terraform init

terraform plan -target=module.networking
terraform apply -target=module.networking
```

### Step 2: Compute Infrastructure
```bash
# Requires ACM certificate ARN
terraform apply -target=module.compute
```

### Step 3: Data and Cache Services
```bash
terraform apply -target=module.database
terraform apply -target=module.cache
```

### Step 4: Content Delivery
```bash
terraform apply -target=module.cdn
```

### Step 5: Monitoring and Observability
```bash
terraform apply -target=module.monitoring
```

### Full Deployment
```bash
terraform plan
terraform apply
```

---

## Best Practices

### Security
- ✅ All databases encrypted with KMS
- ✅ Redis/Memcached encrypted in transit and at rest
- ✅ Secrets stored in Terraform variables (use `.tfvars` file)
- ✅ Security groups restrict traffic to necessary ports
- ✅ Multi-AZ deployments for high availability

### Cost Optimization
- 📊 Use `PriceClass_100` for CloudFront (covers 99% of requests)
- 📊 Set appropriate log retention (30 days for logs)
- 📊 Use reserved instances for RDS in production
- 📊 Configure auto-scaling min/max appropriately

### Monitoring
- 📈 CloudWatch alarms notify via SNS
- 📈 Dashboard provides real-time visibility
- 📈 Logs Insights queries pre-built for common issues
- 📈 Composite alarm aggregates critical metrics

### Disaster Recovery
- 🔄 RDS Multi-AZ with automated failover
- 🔄 Read replicas for database scaling
- 🔄 30-day backup retention
- 🔄 Cross-AZ redundancy for all services

---

## Troubleshooting

### Database Connection Issues
```bash
# Test database connectivity
psql -h <primary_endpoint> -U appforge_admin -d appforge

# Monitor replication lag
SELECT now() - pg_last_xact_replay_timestamp() as replication_lag;
```

### Cache Connection Issues
```bash
# Test Redis connectivity
redis-cli -h <redis_endpoint> -p 6379 ping

# Check replication status
redis-cli -h <redis_endpoint> -p 6379 info replication
```

### CloudFront Distribution Issues
```bash
# Check distribution status
aws cloudfront get-distribution --id <distribution_id>

# Invalidate cache
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

### CloudWatch Alarms Not Firing
1. Verify metric data exists: `aws cloudwatch list-metrics --namespace AWS/ECS`
2. Check alarm state: `aws cloudwatch describe-alarms`
3. Verify SNS topic subscriptions are confirmed

---

## Support

For issues with specific modules, refer to:
- **Networking**: AWS VPC documentation
- **Compute**: AWS ECS Fargate documentation
- **Database**: AWS RDS documentation
- **Cache**: AWS ElastiCache documentation
- **CDN**: AWS CloudFront documentation
- **Monitoring**: AWS CloudWatch documentation
