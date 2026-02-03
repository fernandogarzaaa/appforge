# Terraform Deployment Guide

## Prerequisites

### Required Tools
- Terraform 1.5+ ([Download](https://www.terraform.io/downloads.html))
- AWS CLI v2 ([Download](https://aws.amazon.com/cli/))
- PostgreSQL client (for database testing)
- Redis CLI (for cache testing)

### AWS Account Setup
```bash
# Configure AWS credentials
aws configure

# Verify access
aws sts get-caller-identity
```

### Environment Variables
```bash
export AWS_REGION=us-east-1
export TF_VAR_environment=production
export TF_VAR_db_password=$(openssl rand -base64 32)
```

---

## Project Structure

```
infrastructure/terraform/
├── main.tf                    # Root module configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Root outputs
├── terraform.tfvars          # Environment variables (create manually)
├── .terraform/                # Downloaded modules
├── .terraform.lock.hcl        # Dependency lock file
├── MODULES.md                 # Module documentation
├── README.md                  # Deployment guide
└── modules/
    ├── networking/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── compute/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── database/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── cache/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── cdn/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── monitoring/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

---

## Step-by-Step Deployment

### Phase 1: Initialize Terraform

```bash
cd infrastructure/terraform

# Download provider and modules
terraform init

# Verify initialization
terraform version
ls -la .terraform/
```

**Output**:
```
Initializing the backend...
Initializing modules...
- networking in ./modules/networking
- compute in ./modules/compute
- database in ./modules/database
- cache in ./modules/cache
- cdn in ./modules/cdn
- monitoring in ./modules/monitoring

Terraform has been successfully configured!
```

### Phase 2: Plan Infrastructure (Dry Run)

```bash
# Full infrastructure plan
terraform plan -out=tfplan

# Or plan individual modules
terraform plan -target=module.networking

# Save to file for review
terraform plan -out=tfplan.binary
```

**Review the output**:
- ✅ Number of resources to create
- ✅ Correct variable values
- ✅ No unexpected deletions

### Phase 3: Deploy Networking Foundation

```bash
# Create only networking resources first
terraform apply -target=module.networking

# Confirm the prompt
# Type: yes

# Verify creation
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=*appforge*"
```

**Resources created**:
- 1 VPC with 3 public + 3 private subnets
- 1 Internet Gateway
- 3 NAT Gateways (1 per AZ)
- 2 Security groups (ALB, ECS)

### Phase 4: Pre-deployment Configuration

Before deploying compute, you need:

1. **ACM SSL Certificate**
```bash
# Create or use existing certificate
CERT_ARN="arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"

# Add to terraform.tfvars
echo "certificate_arn = \"$CERT_ARN\"" >> terraform.tfvars
```

2. **Domain Name**
```bash
# Update terraform.tfvars
echo "domain_name = \"api.appforge.com\"" >> terraform.tfvars
```

3. **Database Password**
```bash
# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)
echo "db_password = \"$DB_PASSWORD\"" >> terraform.tfvars

# Save to secure location
echo "$DB_PASSWORD" > ~/.appforge/db_password.txt
chmod 600 ~/.appforge/db_password.txt
```

### Phase 5: Deploy Compute Infrastructure

```bash
# Create compute resources
terraform apply -target=module.compute

# Wait for ALB creation (2-5 minutes)

# Get ALB DNS name
terraform output compute_alb_dns_name
```

**Verify ALB**:
```bash
# Health check should return 200 after service is running
curl -I https://d12345abcde.elb.us-east-1.amazonaws.com/health
```

### Phase 6: Deploy Database

```bash
# Create RDS instance
terraform apply -target=module.database

# Wait for RDS creation (10-15 minutes)

# Get connection details
terraform output database_primary_endpoint
terraform output database_replica_endpoints
```

**Verify database**:
```bash
# Connect to primary
ENDPOINT=$(terraform output -raw database_primary_address)
psql -h $ENDPOINT -U appforge_admin -d appforge -c "SELECT version();"

# Test replication
psql -h $ENDPOINT -U appforge_admin -d appforge -c "SELECT now() - pg_last_xact_replay_timestamp();"
```

### Phase 7: Deploy Cache

```bash
# Create ElastiCache Redis
terraform apply -target=module.cache

# Wait for cache cluster (3-5 minutes)

# Get connection details
terraform output cache_redis_endpoint
terraform output cache_redis_port
```

**Verify Redis**:
```bash
# Connect to Redis
ENDPOINT=$(terraform output -raw cache_redis_endpoint)
PORT=$(terraform output -raw cache_redis_port)
redis-cli -h $ENDPOINT -p $PORT ping

# Should respond: PONG
```

### Phase 8: Deploy CDN

```bash
# Create CloudFront distribution
terraform apply -target=module.cdn

# Wait for distribution deployment (10-20 minutes)

# Get CloudFront domain
terraform output cdn_domain_name
```

**Update DNS**:
```bash
# Create CNAME record in Route 53
# CNAME: api.appforge.com
# Target: d12345abcde.cloudfront.net
```

**Verify CDN**:
```bash
curl -I https://api.appforge.com/

# Should return CloudFront headers
# X-Cache: Hit or Miss
```

### Phase 9: Deploy Monitoring

```bash
# Create CloudWatch dashboards and alarms
terraform apply -target=module.monitoring

# Get dashboard URL
terraform output monitoring_dashboard_url

# Test SNS notifications (if email configured)
```

### Phase 10: Full Deployment

```bash
# Deploy all remaining resources
terraform apply

# Or confirm everything
terraform apply tfplan.binary
```

---

## Configuration Examples

### terraform.tfvars

```hcl
# Environment
environment = "production"

# Networking
cidr_block = "10.0.0.0/16"

# Compute
certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/abcd-1234"
domain_name = "api.appforge.com"

# Database
db_username = "appforge_admin"
db_password = "your-secure-password-here"
db_instance_class = "db.t3.small"
allocated_storage = 100
backup_retention_days = 30
read_replica_count = 2

# Cache
cache_engine = "redis"
cache_node_type = "cache.t4g.micro"
cache_num_nodes = 2

# CDN
enable_cdn_s3_origin = false
cdn_price_class = "PriceClass_100"

# Monitoring
log_retention_days = 30
alert_email = "ops@appforge.com"
```

---

## Verification Checklist

### Networking ✓
- [ ] VPC created with 3 public and 3 private subnets
- [ ] Internet Gateway attached
- [ ] NAT Gateways deployed in each AZ
- [ ] Route tables properly configured
- [ ] Security groups created

### Compute ✓
- [ ] ALB created and healthy
- [ ] ECS cluster running
- [ ] ECS service with at least 1 task
- [ ] Tasks passing health checks
- [ ] CloudWatch logs receiving data

### Database ✓
- [ ] Primary RDS instance running
- [ ] Read replicas created
- [ ] Database accessible from ECS
- [ ] Backups configured
- [ ] Encryption enabled

### Cache ✓
- [ ] Redis cluster running
- [ ] Multi-AZ enabled
- [ ] Automatic failover working
- [ ] Cache accessible from ECS
- [ ] Encryption enabled

### CDN ✓
- [ ] CloudFront distribution deployed
- [ ] DNS records pointing to CloudFront
- [ ] SSL certificate valid
- [ ] Origin responding correctly

### Monitoring ✓
- [ ] CloudWatch dashboard created
- [ ] Alarms configured
- [ ] SNS topic subscribed
- [ ] Log groups receiving data

---

## Post-Deployment Tasks

### 1. Update Application Configuration

```bash
# Get output values
terraform output -json > outputs.json

# Extract connection strings
cat outputs.json | jq '.database_endpoint.value'
cat outputs.json | jq '.cache_endpoint.value'
cat outputs.json | jq '.cdn_domain_name.value'
```

### 2. Configure Application Environment Variables

```bash
# In your CI/CD or deployment system
export DB_HOST=$(terraform output -raw database_primary_address)
export DB_PORT=$(terraform output -raw database_primary_port)
export DB_USER=appforge_admin
export DB_PASSWORD=$TF_VAR_db_password
export REDIS_HOST=$(terraform output -raw cache_redis_endpoint)
export REDIS_PORT=$(terraform output -raw cache_redis_port)
export CDN_URL=$(terraform output -raw cdn_domain_name)
```

### 3. Test Database Replication

```bash
# Write to primary
psql -h $DB_HOST -U appforge_admin -d appforge -c \
  "CREATE TABLE test (id SERIAL, data TEXT);"

# Read from replica
REPLICA_HOST=$(terraform output -raw database_replica_addresses | jq -r '.[0]')
psql -h $REPLICA_HOST -U appforge_admin -d appforge -c "SELECT * FROM test;"
```

### 4. Load Testing

```bash
# Install artillery
npm install -g artillery

# Create test config
cat > load-test.yml << EOF
config:
  target: "https://api.appforge.com"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health Checks"
    flow:
      - get:
          url: "/health"
EOF

# Run test
artillery run load-test.yml
```

### 5. Configure Backup Strategy

```bash
# RDS automated backups are enabled
# For manual backup:
aws rds create-db-snapshot \
  --db-instance-identifier production-appforge-primary \
  --db-snapshot-identifier production-appforge-backup-$(date +%Y%m%d)

# Enable S3 exports for long-term retention
aws rds start-export-task \
  --export-task-identifier backup-export-$(date +%Y%m%d) \
  --source-arn $(terraform output -raw database_primary_arn) \
  --s3-bucket-name appforge-backups \
  --s3-prefix rds-exports/
```

---

## Troubleshooting

### Terraform Errors

#### "Error acquiring the state lock"
```bash
# State lock stuck
terraform force-unlock LOCK_ID

# Or check state
terraform state list
```

#### "No certificate found"
```bash
# List available certificates
aws acm list-certificates --region us-east-1

# Create new certificate
aws acm request-certificate --domain-name api.appforge.com
```

#### Module dependency issues
```bash
# Recreate dependency order
terraform destroy -target=module.cdn
terraform destroy -target=module.monitoring
terraform apply -target=module.cdn
terraform apply -target=module.monitoring
```

### AWS Resource Issues

#### ALB unhealthy targets
```bash
# Check target group
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw compute_target_group_arn)

# Check ECS service
aws ecs describe-services \
  --cluster production-appforge \
  --services production-appforge
```

#### RDS connection timeout
```bash
# Check security group
aws ec2 describe-security-groups \
  --group-ids $(terraform output -raw database_security_group_id)

# Test connectivity from ECS task
aws ecs execute-command \
  --cluster production-appforge \
  --task TASK_ID \
  --container appforge \
  --interactive \
  --command "psql -h $DB_HOST -U appforge_admin -d appforge -c 'SELECT 1;'"
```

#### CloudFront distribution not deploying
```bash
# Check distribution status
aws cloudfront get-distribution \
  --id $(terraform output -raw cdn_distribution_id)

# CloudFront takes 10-20 minutes to deploy
# Check status: InProgress → Deployed
```

---

## Scaling Configuration

### Increase Database Size
```hcl
# Update terraform.tfvars
allocated_storage = 200
max_allocated_storage = 1000
db_instance_class = "db.t3.medium"

terraform apply -target=module.database
```

### Scale Cache Cluster
```hcl
# Add more nodes
cache_num_nodes = 3

terraform apply -target=module.cache
```

### Adjust ECS Auto-scaling
```hcl
# Update compute module variables
desired_count = 3
min_capacity = 2
max_capacity = 10
cpu_target_tracking_value = 70

terraform apply -target=module.compute
```

---

## Monitoring Dashboard

After deployment, access CloudWatch dashboard:
```bash
# Print dashboard URL
terraform output monitoring_dashboard_url

# Or use AWS Console
aws cloudwatch list-dashboards
```

**Dashboard shows**:
- ECS CPU/Memory utilization
- RDS CPU/Storage metrics
- CloudFront error rates
- Application error logs
- Response time trends

---

## Cost Estimation

```bash
# Get cost estimate (requires Terraform Cloud)
terraform plan -out=tfplan
# In Terraform Cloud UI, view cost estimate

# Or manually estimate:
# Networking: $32/month (NAT Gateways)
# Compute: $50-150/month (ECS Fargate)
# Database: $50-200/month (RDS)
# Cache: $15-50/month (ElastiCache)
# CDN: $0.085/GB + requests (varies)
# Monitoring: ~$10/month (CloudWatch)
# Total: ~$160-500/month
```

---

## Cleanup

### Destroy All Resources
```bash
# Destroy in reverse order
terraform destroy -target=module.cdn
terraform destroy -target=module.monitoring
terraform destroy -target=module.cache
terraform destroy -target=module.database
terraform destroy -target=module.compute
terraform destroy -target=module.networking

# Or destroy everything
terraform destroy
```

### Selective Cleanup
```bash
# Remove only database
terraform destroy -target=module.database

# Recreate it
terraform apply -target=module.database
```

---

## Support and Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Architecture Best Practices](https://aws.amazon.com/architecture/)
- [Terraform Best Practices](https://www.terraform.io/docs/language/settings/backends/configuration.html)
- [AppForge Documentation](../../../docs/)
