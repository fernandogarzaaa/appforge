# 🔐 GitHub Actions CI/CD Deployment Secrets Guide

This guide explains how to set up deployment secrets for your GitHub Actions CI/CD pipeline.

## 📋 Table of Contents

- [Required Secrets](#required-secrets)
- [How to Add Secrets](#how-to-add-secrets)
- [AWS Deployment](#aws-deployment)
- [DigitalOcean Deployment](#digitalocean-deployment)
- [Azure Deployment](#azure-deployment)
- [Docker Registry](#docker-registry)
- [Database & Services](#database--services)
- [Security Best Practices](#security-best-practices)

---

## 🔑 Required Secrets

### Core Application Secrets

These secrets are required for all deployment types:

| Secret Name | Description | Example/Format |
|------------|-------------|----------------|
| `JWT_SECRET` | Secret key for JWT token signing | `random-64-char-string` |
| `ENCRYPTION_KEY` | 32-character encryption key | `12345678901234567890123456789012` |
| `DATABASE_URL` | Production MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `REDIS_URL` | Production Redis connection string | `redis://user:pass@host:6379` |

### Optional Secrets

| Secret Name | Description | Required For |
|------------|-------------|--------------|
| `SENTRY_DSN` | Sentry error tracking URL | Error monitoring |
| `STRIPE_SECRET_KEY` | Stripe payment processing | Payment features |
| `GITHUB_TOKEN` | Automatically provided | All workflows |

---

## 🛠️ How to Add Secrets

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add a New Secret

1. Click **New repository secret**
2. Enter the **Name** (exactly as shown in tables above)
3. Enter the **Value** (the actual secret key/token)
4. Click **Add secret**

### Step 3: Verify Secrets

- Secrets will appear in the list (values are hidden)
- You can update or delete secrets anytime
- Secrets are available to all workflows in the repository

---

## ☁️ AWS Deployment

### Required AWS Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | AWS Console → IAM → Users → Security Credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | Generated with access key |
| `AWS_REGION` | AWS region code | e.g., `us-east-1`, `eu-west-1` |
| `AWS_ACCOUNT_ID` | Your AWS account ID | AWS Console → Account Settings |

### AWS ECR (Docker Registry)

| Secret Name | Description |
|------------|-------------|
| `AWS_ECR_REPOSITORY` | ECR repository name |
| `AWS_ECR_REGISTRY` | ECR registry URL |

### Getting AWS Credentials

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS
aws configure

# Create IAM user for deployment
aws iam create-user --user-name github-actions-deployer

# Attach policies
aws iam attach-user-policy --user-name github-actions-deployer \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

# Create access key
aws iam create-access-key --user-name github-actions-deployer
```

---

## 🌊 DigitalOcean Deployment

### Required DigitalOcean Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DO API token | DigitalOcean → API → Tokens/Keys |
| `DIGITALOCEAN_REGISTRY_NAME` | Container registry name | DigitalOcean → Container Registry |
| `DIGITALOCEAN_CLUSTER_ID` | Kubernetes cluster ID (if using K8s) | DigitalOcean → Kubernetes |

### Getting DigitalOcean Token

1. Log in to DigitalOcean
2. Click **API** in the left sidebar
3. Click **Generate New Token**
4. Name: `github-actions-deployer`
5. Scopes: Select **Read** and **Write**
6. Click **Generate Token**
7. **Copy the token immediately** (shown only once)

---

## 🔷 Azure Deployment

### Required Azure Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `AZURE_CREDENTIALS` | Service principal JSON | See below |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | Azure Portal → Subscriptions |
| `AZURE_RESOURCE_GROUP` | Resource group name | Your resource group |
| `AZURE_REGISTRY_NAME` | Container registry name | Azure Container Registry |

### Creating Azure Service Principal

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create service principal
az ad sp create-for-rbac \
  --name "github-actions-deployer" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth

# Output will be JSON - copy entire output to AZURE_CREDENTIALS secret
```

---

## 🐳 Docker Registry

### GitHub Container Registry (GHCR)

**No secrets needed!** GHCR uses the automatic `GITHUB_TOKEN`.

Workflows automatically authenticate with:
```yaml
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

### Docker Hub

| Secret Name | Description |
|------------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password or access token |

### Getting Docker Hub Token

1. Log in to Docker Hub
2. Click your username → **Account Settings**
3. Click **Security** → **New Access Token**
4. Name: `github-actions`
5. Permissions: **Read, Write, Delete**
6. Click **Generate**
7. Copy the token

---

## 💾 Database & Services

### MongoDB Atlas

| Secret Name | Description | Format |
|------------|-------------|--------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority` |

**Getting MongoDB Atlas URL:**

1. Log in to MongoDB Atlas
2. Click **Connect** on your cluster
3. Select **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `myFirstDatabase` with your database name

### Redis Cloud

| Secret Name | Description | Format |
|------------|-------------|--------|
| `REDIS_URL` | Redis connection string | `redis://default:password@endpoint:port` |

**Getting Redis Cloud URL:**

1. Log in to Redis Cloud
2. Select your database
3. Click **Connect**
4. Copy the connection string

### Stripe (Payment Processing)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe → Webhooks → Add endpoint |

---

## 🔒 Security Best Practices

### 1. **Never Commit Secrets**

❌ **DON'T:**
```javascript
const API_KEY = 'sk_live_abc123...'; // NEVER DO THIS
```

✅ **DO:**
```javascript
const API_KEY = process.env.API_KEY;
```

### 2. **Use Environment-Specific Secrets**

- Development: `.env.local` (not committed)
- Staging: GitHub Environment secrets
- Production: GitHub Environment secrets

### 3. **Rotate Secrets Regularly**

- Rotate all secrets every 90 days
- Immediately rotate if compromised
- Use different secrets for dev/staging/prod

### 4. **Limit Secret Scope**

- Use GitHub Environments for stage-specific secrets
- Grant minimal permissions to service accounts
- Use read-only tokens when possible

### 5. **Monitor Secret Usage**

- Check GitHub Actions logs for failed auth
- Monitor cloud provider audit logs
- Set up alerts for unusual access patterns

### 6. **Generate Strong Secrets**

```bash
# Generate JWT secret (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate random password
openssl rand -base64 32
```

---

## 🚀 Quick Setup Checklist

- [ ] Add `JWT_SECRET` to GitHub Secrets
- [ ] Add `ENCRYPTION_KEY` to GitHub Secrets
- [ ] Add `DATABASE_URL` to GitHub Secrets
- [ ] Add `REDIS_URL` to GitHub Secrets
- [ ] Add cloud provider credentials (AWS/DO/Azure)
- [ ] Add `STRIPE_SECRET_KEY` (if using payments)
- [ ] Add `SENTRY_DSN` (if using error tracking)
- [ ] Test workflows with secrets
- [ ] Document secret rotation schedule
- [ ] Set up secret rotation reminders

---

## 📚 Additional Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [DigitalOcean API Documentation](https://docs.digitalocean.com/reference/api/)
- [Azure Service Principals](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)

---

## 🆘 Troubleshooting

### "Secret not found" Error

1. Verify secret name matches exactly (case-sensitive)
2. Check secret is in correct repository/environment
3. Ensure workflow has permission to access secrets

### Authentication Failed

1. Verify credentials are correct and not expired
2. Check service account has required permissions
3. Ensure secret value doesn't have trailing spaces

### Secret Not Working in Workflow

1. Check workflow syntax: `${{ secrets.SECRET_NAME }}`
2. Verify secret is available to the workflow environment
3. Check workflow permissions in repository settings

---

**Need help?** Open an issue in the repository or check workflow logs for detailed error messages.
