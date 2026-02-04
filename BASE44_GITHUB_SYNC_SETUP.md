# Base44 GitHub Sync Setup

This guide explains how to set up GitHub sync with your Base44 app to keep your local development environment and Base44 in sync automatically.

## Overview

Base44's GitHub sync feature allows you to:
- Edit code locally in your preferred editor
- Automatically sync changes to Base44 when you push to `main`
- Keep your domain and existing Base44 app
- Maintain version control with GitHub
- Deploy changes by publishing in Base44

## Prerequisites

- Base44 Builder plan or higher (required for GitHub sync)
- Personal workspace (GitHub sync is only available in personal workspaces)
- GitHub account with access to `fernandogarzaaa/appforge` repository
- Base44 app already created (your app ID: `69741d9301465d2bac03e8bb`)

## Setup Instructions

### Step 1: Connect GitHub to Your Base44 App

1. Open your Base44 app in the editor
2. Click **Dashboard** in the top navigation
3. Click the **GitHub icon** (top-right corner)
4. Click **Connect to GitHub**
5. Click **Connect GitHub**
6. Click **Authorize Base44 Builder**

### Step 2: Install Base44 Builder

1. Select your GitHub organization or account (`fernandogarzaaa`)
2. Choose repositories to allow access (select `appforge`)
3. Click **Install**

### Step 3: Sync the Repository

1. Base44 will prompt you to choose a repository
2. Select the existing **appforge** repository
3. Click **Sync** (or **Link** if already exists)

## Local Development Workflow

Once GitHub sync is enabled:

### Push Changes to Base44
```bash
# Make your code changes locally
git add .
git commit -m "your commit message"
git push origin main
```

**Base44 automatically syncs** when you push to `main`. Changes appear in your Base44 editor.

### Publish to Production
1. Go to your Base44 app
2. Click **Publish** button (top-right)
3. Confirm publication
4. Your domain (`appforge.fun` or custom domain) is updated

### Required Environment Variables

Create `.env.local` for local development:

```
VITE_BASE44_APP_ID=69741d9301465d2bac03e8bb
VITE_BASE44_APP_BASE_URL=https://appforge.base44.app
```

### Run Locally
```bash
npm install
npm run dev
```

## Project Structure

```
appforge/
├── src/                    # Frontend (React/Vue/etc)
│   ├── components/
│   ├── pages/
│   └── ...
├── functions/             # Backend functions (TypeScript)
│   ├── adminCancelSubscription.ts
│   ├── adminChangePlan.ts
│   └── ... (85 total)
├── config.jsonc           # Base44 configuration
├── .app.jsonc             # App ID and metadata
├── .env.local             # Local environment vars
├── vite.config.js         # Build configuration
└── package.json           # Dependencies
```

## Key Points

- ✅ **2-way Sync**: Changes sync from GitHub to Base44
- ✅ **Automatic**: No manual push needed, just commit and push
- ✅ **Keep Domain**: Your existing domain continues to work
- ✅ **Keep App**: No need to create a new Base44 app
- ⚠️ **One Direction**: Changes in Base44 editor sync to GitHub (you must authorize collaborators)
- ⚠️ **No Version Revert**: Can't revert to versions before GitHub sync was enabled

## Troubleshooting

### Changes Not Syncing
- Ensure you pushed to `main` branch
- Check GitHub Actions workflows are passing
- Verify your Base44 app is still connected in Dashboard

### Can't Push to Base44
- Confirm you're on `main` branch
- Check your Base44 plan supports GitHub sync
- Verify GitHub repository is authorized

### Deployment Stuck
- Click **Publish** in Base44 after changes appear
- Wait for Base44 to build and deploy
- Check Base44 dashboard for any errors

## CI/CD Integration

GitHub Actions workflows automatically run on push:
- ✅ **CI/CD Pipeline** - Validates build
- ✅ **Code Scanning & Quality** - Security checks
- ✅ **Security Audit** - Vulnerability scan
- ✅ **Node.js CI** - Tests and compilation
- ✅ **Deploy to Production** - Ready for deployment

All workflows must pass before Base44 syncs changes.

## Next Steps

1. ✅ Confirm GitHub sync is enabled in Base44 Dashboard
2. ✅ Make a test change locally and push to `main`
3. ✅ Verify changes appear in Base44 editor
4. ✅ Click **Publish** to deploy to your domain
5. ✅ Verify changes live on your domain

## Resources

- [Base44 GitHub Integration Docs](https://docs.base44.com/developers/app-code/local-development/github)
- [Base44 Project Structure](https://docs.base44.com/developers/app-code/overview/project-structure)
- [Base44 Pricing & Plans](https://base44.com/pricing)

## Support

For issues, check:
- Base44 Support: [Discord](https://discord.com/invite/ThpYPZpVts)
- Base44 Documentation: [docs.base44.com](https://docs.base44.com)
- GitHub Issues: [appforge issues](https://github.com/fernandogarzaaa/appforge/issues)
