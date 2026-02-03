# Complete Infrastructure as Code Examples

## 1. Minimal Staging Environment

**File**: `terraform-staging.tf`

```hcl
# Staging Environment - Minimal resources for testing

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Core Infrastructure
module "networking" {
  source = "./modules/networking"
  
  environment = "staging"
  cidr_block  = "10.1.0.0/16"
}

module "compute" {
  source = "./modules/compute"
  
  environment            = "staging"
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  certificate_arn = aws_acm_certificate.staging.arn
  domain_name     = "staging-api.appforge.com"
  
  desired_count  = 1
  min_capacity   = 1
  max_capacity   = 3
}

# Database for staging
module "database" {
  source = "./modules/database"
  
  environment            = "staging"
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  db_instance_class      = "db.t3.micro"      # Cost-optimized
  allocated_storage      = 20                 # Minimal
  backup_retention_days  = 7                  # Short retention
  multi_az              = false               # Single-AZ for staging
  enable_read_replica   = false               # No replicas
  
  db_username = "appforge_admin"
  db_password = var.db_password
}

# Cache for staging
module "cache" {
  source = "./modules/cache"
  
  environment            = "staging"
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  engine           = "redis"
  node_type        = "cache.t4g.micro"
  num_cache_nodes  = 1                    # Single node for staging
  multi_az_enabled = false
}

# Monitoring
module "monitoring" {
  source = "./modules/monitoring"
  
  environment            = "staging"
  ecs_cluster_name      = module.compute.ecs_cluster_id
  ecs_service_name      = module.compute.ecs_service_name
  
  log_retention_days     = 7               # Shorter retention
  enable_detailed_monitoring = false       # Save costs
  enable_sns_alerts      = false           # Optional for staging
}

# ACM Certificate (self-signed for testing)
resource "aws_acm_certificate" "staging" {
  domain_name       = "staging-api.appforge.com"
  validation_method = "DNS"
  
  tags = {
    Name        = "staging-cert"
    Environment = "staging"
  }
}

# Outputs for application configuration
output "staging_config" {
  value = {
    db_host              = module.database.primary_address
    db_port              = module.database.primary_port
    redis_host           = module.cache.redis_endpoint
    redis_port           = module.cache.redis_port
    alb_dns              = module.compute.alb_dns_name
    log_group            = module.monitoring.log_group_app_name
  }
  sensitive = false
}
```

---

## 2. High-Availability Production Environment

**File**: `terraform-production.tf`

```hcl
# Production Environment - Full redundancy and monitoring

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "appforge-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = "us-east-1"
}

# Global Variables
locals {
  environment = "production"
  
  tags = {
    Environment = local.environment
    ManagedBy   = "Terraform"
    Project     = "AppForge"
  }
}

# Networking - Multi-AZ
module "networking" {
  source = "./modules/networking"
  
  environment = local.environment
  cidr_block  = "10.0.0.0/16"
}

# Compute - High Availability
module "compute" {
  source = "./modules/compute"
  
  environment            = local.environment
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  certificate_arn = aws_acm_certificate.production.arn
  domain_name     = "api.appforge.com"
  
  desired_count  = 3                 # High availability
  min_capacity   = 2
  max_capacity   = 10
  
  cpu_target_tracking_value    = 70
  memory_target_tracking_value = 80
}

# Database - Multi-AZ with Read Replicas
module "database" {
  source = "./modules/database"
  
  environment            = local.environment
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  db_instance_class      = "db.t3.small"
  allocated_storage      = 100
  max_allocated_storage  = 500              # Auto-scaling enabled
  backup_retention_days  = 30
  multi_az              = true
  enable_read_replica   = true
  read_replica_count    = 2                 # 2 read replicas
  
  enable_encryption      = true
  enable_enhanced_monitoring = true
  monitoring_interval    = 60              # Detailed monitoring
  deletion_protection    = true
  
  db_username = "appforge_admin"
  db_password = var.db_password
}

# Cache - Redis Multi-AZ
module "cache" {
  source = "./modules/cache"
  
  environment            = local.environment
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  
  engine                 = "redis"
  engine_version         = "7.0"
  node_type              = "cache.t4g.small"
  num_cache_nodes        = 3                # Multi-node cluster
  
  multi_az_enabled       = true
  automatic_failover_enabled = true
  
  enable_encryption      = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  transit_encryption_mode = "required"
  auth_token             = random_password.redis_token.result
  
  snapshot_retention_limit = 7
  enable_automatic_backups = true
  log_delivery_configuration = true
}

# CDN - Global Distribution
module "cdn" {
  source = "./modules/cdn"
  
  environment         = local.environment
  domain_name         = "api.appforge.com"
  certificate_arn     = aws_acm_certificate.production.arn
  alb_dns_name        = module.compute.alb_dns_name
  
  enable_s3_origin    = true
  s3_bucket_domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
  
  price_class         = "PriceClass_All"   # Global coverage
  default_ttl         = 86400              # 1 day
  max_ttl             = 31536000           # 1 year
  
  enable_waf          = true
  waf_acl_arn         = aws_wafv2_web_acl.production.arn
  enable_logging      = true
  log_bucket_name     = aws_s3_bucket.cdn_logs.id
  
  custom_headers = {
    "X-Environment" = "production"
    "X-Cache-Control" = "public"
  }
}

# Monitoring - Comprehensive Observability
module "monitoring" {
  source = "./modules/monitoring"
  
  environment            = local.environment
  ecs_cluster_name      = module.compute.ecs_cluster_id
  ecs_service_name      = module.compute.ecs_service_name
  alb_target_group_arn  = module.compute.target_group_arn
  
  log_retention_days     = 30
  enable_detailed_monitoring = true
  enable_sns_alerts      = true
  alert_email            = "ops@appforge.com"
  
  cpu_threshold          = 80
  memory_threshold       = 80
  
  enable_dashboard       = true
  enable_log_insights    = true
  enable_anomaly_detection = true
}

# ACM Certificate
resource "aws_acm_certificate" "production" {
  domain_name       = "api.appforge.com"
  subject_alternative_names = [
    "*.api.appforge.com"
  ]
  validation_method = "DNS"
  
  tags = local.tags
}

# S3 for Static Assets
resource "aws_s3_bucket" "assets" {
  bucket = "appforge-assets-${data.aws_caller_identity.current.account_id}"
  
  tags = local.tags
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 for CDN Logs
resource "aws_s3_bucket" "cdn_logs" {
  bucket = "appforge-cdn-logs-${data.aws_caller_identity.current.account_id}"
  
  tags = local.tags
}

# WAF for CloudFront
resource "aws_wafv2_web_acl" "production" {
  name  = "appforge-production-waf"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "RateLimitRule"
      sampled_requests_enabled  = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "appforge-production-waf"
    sampled_requests_enabled  = true
  }
  
  tags = local.tags
}

# Generate Redis Auth Token
resource "random_password" "redis_token" {
  length  = 32
  special = true
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Outputs
output "production_endpoints" {
  value = {
    api_endpoint     = "https://api.appforge.com"
    alb_dns          = module.compute.alb_dns_name
    cloudfront_dns   = module.cdn.domain_name
    db_primary       = module.database.primary_endpoint
    db_replicas      = module.database.replica_endpoints
    redis_endpoint   = module.cache.redis_endpoint
    redis_reader     = module.cache.redis_reader_endpoint
    dashboard        = module.monitoring.dashboard_url
  }
}

output "production_security" {
  value = {
    rds_encryption_key    = module.database.kms_key_id
    cache_encryption_key  = module.cache.kms_key_id
    cdn_waf_acl          = aws_wafv2_web_acl.production.id
  }
  sensitive = true
}
```

---

## 3. Development Environment Configuration

**File**: `terraform-dev.tfvars`

```hcl
# Development Environment Variables

environment = "development"

# Networking
cidr_block = "10.2.0.0/16"

# Compute - Minimal
desired_count           = 1
min_capacity            = 1
max_capacity            = 2
cpu_target_tracking_value = 90

# Database - Minimal
db_instance_class       = "db.t3.micro"
allocated_storage       = 10
backup_retention_days   = 1
multi_az               = false
enable_read_replica    = false

# Cache
cache_node_type         = "cache.t4g.micro"
cache_num_cache_nodes   = 1
multi_az_enabled        = false

# Monitoring
log_retention_days      = 7
enable_detailed_monitoring = false
enable_sns_alerts       = false
enable_dashboard        = true
enable_log_insights     = true

# CDN
cdn_price_class = "PriceClass_100"

# Credentials
db_password = "dev-password-change-me"
```

---

## 4. Integration with CI/CD

**File**: `.github/workflows/terraform-deploy.yml`

```yaml
name: Terraform Deployment

on:
  push:
    branches:
      - main
    paths:
      - 'infrastructure/terraform/**'
  pull_request:
    paths:
      - 'infrastructure/terraform/**'

env:
  AWS_REGION: us-east-1
  TF_VERSION: 1.5.0

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Initialize Terraform
        run: |
          cd infrastructure/terraform
          terraform init
      
      - name: Format Check
        run: |
          cd infrastructure/terraform
          terraform fmt -check
      
      - name: Validate Configuration
        run: |
          cd infrastructure/terraform
          terraform validate
      
      - name: Plan Terraform
        if: github.event_name == 'pull_request'
        run: |
          cd infrastructure/terraform
          terraform plan -out=tfplan
          terraform show -json tfplan > tfplan.json
      
      - name: Comment Plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('infrastructure/terraform/tfplan.json', 'utf8');
            const planData = JSON.parse(plan);
            const summary = `
            ## Terraform Plan
            - Resources to add: ${planData.resource_changes.filter(r => r.change.actions[0] === 'create').length}
            - Resources to change: ${planData.resource_changes.filter(r => r.change.actions[0] === 'update').length}
            - Resources to delete: ${planData.resource_changes.filter(r => r.change.actions[0] === 'delete').length}
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });
      
      - name: Apply Terraform
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          cd infrastructure/terraform
          terraform apply tfplan
      
      - name: Export Outputs
        run: |
          cd infrastructure/terraform
          terraform output -json > ../outputs.json
      
      - name: Upload Outputs
        if: github.event_name == 'push'
        uses: actions/upload-artifact@v3
        with:
          name: terraform-outputs
          path: infrastructure/outputs.json
```

---

## 5. Local Development Setup

**File**: `scripts/setup-local-terraform.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Setting up Terraform for AppForge..."

# Check prerequisites
check_prerequisites() {
  echo "✓ Checking prerequisites..."
  
  if ! command -v terraform &> /dev/null; then
    echo "✗ Terraform not found. Please install from https://terraform.io/downloads"
    exit 1
  fi
  
  if ! command -v aws &> /dev/null; then
    echo "✗ AWS CLI not found. Please install from https://aws.amazon.com/cli"
    exit 1
  fi
  
  echo "✓ Prerequisites OK"
}

# Initialize Terraform
init_terraform() {
  echo "✓ Initializing Terraform..."
  cd infrastructure/terraform
  terraform init
  cd -
}

# Create tfvars file
create_tfvars() {
  echo "✓ Creating terraform.tfvars..."
  
  read -p "Environment (dev/staging/production): " ENVIRONMENT
  read -p "AWS Region [us-east-1]: " AWS_REGION
  AWS_REGION=${AWS_REGION:-us-east-1}
  
  if [ "$ENVIRONMENT" = "production" ]; then
    read -p "Database password: " DB_PASSWORD
    read -p "Alert email: " ALERT_EMAIL
  else
    DB_PASSWORD="local-dev-password"
    ALERT_EMAIL="dev@local"
  fi
  
  cat > infrastructure/terraform/terraform.tfvars << EOF
environment = "$ENVIRONMENT"
db_password = "$DB_PASSWORD"
alert_email = "$ALERT_EMAIL"
EOF
  
  echo "✓ Created terraform.tfvars"
}

# Validate configuration
validate() {
  echo "✓ Validating Terraform configuration..."
  cd infrastructure/terraform
  terraform validate
  cd -
  echo "✓ Validation passed"
}

# Generate plan
plan() {
  echo "✓ Generating Terraform plan..."
  cd infrastructure/terraform
  terraform plan -out=tfplan
  cd -
  echo "✓ Plan saved to tfplan"
}

# Main
check_prerequisites
init_terraform
create_tfvars
validate
plan

echo "✅ Terraform setup complete!"
echo "Next: cd infrastructure/terraform && terraform apply tfplan"
```

---

These examples provide production-ready Infrastructure as Code configurations that can be adapted for specific environments.
