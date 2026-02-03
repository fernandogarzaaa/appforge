# Infrastructure as Code - README

## Terraform Setup Guide

This directory contains Terraform configurations for deploying AppForge infrastructure on AWS.

### Prerequisites

1. **Terraform** >= 1.4.0
   ```bash
   # Install on macOS
   brew install terraform
   
   # Install on Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **AWS CLI** configured
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and default region
   ```

3. **Required AWS Permissions**
   - VPC, Subnet, Route Table creation
   - ECS, ECR, ALB management
   - RDS, ElastiCache administration
   - IAM role creation
   - CloudWatch, CloudFront access

### Quick Start

1. **Initialize Terraform**
   ```bash
   cd infrastructure/terraform
   terraform init
   ```

2. **Create terraform.tfvars**
   ```hcl
   aws_region         = "us-east-1"
   environment        = "production"
   owner_email        = "your-email@company.com"
   domain_name        = "appforge.dev"
   ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/abc123"
   ```

3. **Plan Infrastructure**
   ```bash
   terraform plan -out=tfplan
   ```

4. **Apply Configuration**
   ```bash
   terraform apply tfplan
   ```

### Module Structure

```
terraform/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── modules/
│   ├── networking/      # VPC, subnets, routing
│   ├── compute/         # ECS, ALB, auto-scaling
│   ├── database/        # RDS, read replicas
│   ├── cache/           # Redis/ElastiCache
│   ├── cdn/             # CloudFront distribution
│   └── monitoring/      # CloudWatch, alarms
```

### Modules Overview

#### 1. Networking Module
Creates VPC with public/private subnets across multiple AZs:
- VPC (10.0.0.0/16)
- 3 Public subnets (one per AZ)
- 3 Private subnets (one per AZ)
- Internet Gateway
- NAT Gateways (one per AZ)
- Security Groups

#### 2. Compute Module
ECS cluster with Fargate tasks:
- Application Load Balancer (HTTPS/HTTP)
- ECS Cluster with auto-scaling
- ECR repositories for Docker images
- Task definitions for frontend/backend

#### 3. Database Module
RDS PostgreSQL with read replicas:
- Primary RDS instance (Multi-AZ)
- Read replica for scaling
- Automated backups (7-day retention)
- Parameter groups for optimization

#### 4. Cache Module
ElastiCache Redis cluster:
- Multi-node cluster for high availability
- Automatic failover
- Encryption at rest and in transit

#### 5. CDN Module
CloudFront distribution:
- SSL/TLS termination
- Edge caching
- Custom domain support

#### 6. Monitoring Module
CloudWatch dashboards and alarms:
- CPU/Memory metrics
- Request count and latency
- Error rate monitoring
- SNS alerts

### Environment Configuration

#### Development
```hcl
environment       = "dev"
db_instance_class = "db.t3.micro"
mongodb_atlas_tier = "M0"
```

#### Staging
```hcl
environment       = "staging"
db_instance_class = "db.t3.small"
mongodb_atlas_tier = "M10"
```

#### Production
```hcl
environment        = "production"
db_instance_class  = "db.t3.medium"
mongodb_atlas_tier = "M30"
```

### State Management

Terraform state is stored in S3 with DynamoDB locking:

```hcl
backend "s3" {
  bucket         = "appforge-terraform-state"
  key            = "production/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "appforge-terraform-locks"
}
```

**Setup S3 Backend:**
```bash
# Create S3 bucket
aws s3 mb s3://appforge-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket appforge-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name appforge-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Cost Estimation

Use `terraform cost` or Infracost for cost estimates:

```bash
# Install Infracost
brew install infracost

# Generate cost report
infracost breakdown --path .
```

**Estimated Monthly Costs (Production):**
- ECS Fargate: ~$150-300
- RDS (db.t3.medium): ~$100-150
- ElastiCache: ~$50-100
- Load Balancer: ~$20-30
- Data Transfer: ~$50-100
- **Total: ~$370-680/month**

### Deployment Workflow

1. **Make infrastructure changes**
2. **Run terraform plan**
   ```bash
   terraform plan -out=tfplan
   ```
3. **Review changes carefully**
4. **Apply if approved**
   ```bash
   terraform apply tfplan
   ```
5. **Tag release**
   ```bash
   git tag -a infra-v1.2.0 -m "Added read replicas"
   git push origin infra-v1.2.0
   ```

### Disaster Recovery

#### Backup Strategy
- RDS automated backups (7-day retention)
- Manual snapshots before major changes
- Terraform state versioned in S3

#### Recovery Steps
1. Restore from RDS snapshot
2. Restore Terraform state from S3 version
3. Re-apply Terraform configuration
4. Update DNS records if needed

### Security Best Practices

1. **Enable encryption at rest and in transit**
2. **Use AWS Secrets Manager for sensitive data**
3. **Restrict security group rules**
4. **Enable VPC Flow Logs**
5. **Regular security audits**

### Troubleshooting

#### State Lock Issues
```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

#### Resource Errors
```bash
# Import existing resources
terraform import aws_ecs_cluster.appforge appforge-cluster

# Target specific resources
terraform apply -target=module.database
```

#### Plan Failures
```bash
# Refresh state
terraform refresh

# Validate configuration
terraform validate
```

### Contributing

1. Create feature branch
2. Make changes to Terraform files
3. Run `terraform fmt` to format
4. Run `terraform validate` to check syntax
5. Create PR with plan output

### Support

- **Documentation**: https://docs.appforge.dev/infrastructure
- **Slack**: #infrastructure channel
- **Email**: devops@appforge.dev

---

**Last Updated:** February 3, 2026
