# AppForge Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Base44 account credentials
- (Optional) Domain and hosting provider

### 1. Environment Setup

```bash
# Clone and install
git clone https://github.com/fernandogarzaaa/appforge.git
cd appforge
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your credentials
# VITE_BASE44_USERNAME=your_username
# VITE_BASE44_PASSWORD=your_password
```

### 2. Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Production Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Configure environment variables
# Site settings → Build & deploy → Environment
```

### Option 3: Docker

```dockerfile
# Use provided Dockerfile
docker build -t appforge .
docker run -p 3000:3000 appforge
```

### Option 4: Traditional Hosting

```bash
# Build the app
npm run build

# Upload dist/ folder to your web server
# Point web server to serve dist/index.html
```

## 🔧 Configuration

### Required Environment Variables

```env
VITE_BASE44_USERNAME=your_username_here
VITE_BASE44_PASSWORD=your_password_here
VITE_BASE44_API_URL=https://appforge.fun
```

### Optional Environment Variables

See `.env.example` for full list of available options:
- AI Model API Keys (OpenAI, Claude, Gemini, Grok)
- External Services (Sentry, Google Analytics)
- Feature Flags
- Performance Settings

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t appforge:latest .
```

### Run Container

```bash
docker run -d \
  -p 80:80 \
  -e VITE_BASE44_USERNAME=your_username \
  -e VITE_BASE44_PASSWORD=your_password \
  --name appforge \
  appforge:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  appforge:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_BASE44_USERNAME=${BASE44_USERNAME}
      - VITE_BASE44_PASSWORD=${BASE44_PASSWORD}
    restart: unless-stopped
```

## ☁️ Cloud Provider Setup

### AWS (S3 + CloudFront)

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Google Cloud (Firebase Hosting)

```bash
# Install Firebase CLI
npm i -g firebase-tools

# Initialize
firebase init hosting

# Deploy
firebase deploy
```

### Azure (Static Web Apps)

```bash
# Install Azure CLI
npm i -g @azure/static-web-apps-cli

# Build
npm run build

# Deploy
swa deploy ./dist --deployment-token $AZURE_TOKEN
```

## 🔒 Security Checklist

- [ ] Environment variables configured (never commit .env.local)
- [ ] HTTPS enabled
- [ ] CSP headers configured
- [ ] API rate limiting in place
- [ ] Error tracking enabled (Sentry)
- [ ] Session timeout configured
- [ ] CORS properly configured

## 📊 Monitoring & Analytics

### Error Tracking (Sentry)

1. Create Sentry project
2. Add DSN to `.env.local`:
   ```env
   VITE_SENTRY_DSN=your_sentry_dsn
   VITE_ENABLE_ERROR_TRACKING=true
   ```

### Analytics

1. Add Google Analytics ID:
   ```env
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_ENABLE_ANALYTICS=true
   ```

### Health Monitoring

Access `/system-status` page to monitor:
- API health
- Authentication status
- Performance metrics
- Recent errors

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
        env:
          VITE_BASE44_USERNAME: ${{ secrets.BASE44_USERNAME }}
          VITE_BASE44_PASSWORD: ${{ secrets.BASE44_PASSWORD }}
      - uses: vercel/vercel-action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## 🚨 Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Restart dev server after changing .env files
- Check console for validation errors

### Performance Issues
- Check `/system-status` for metrics
- Review Web Vitals scores
- Enable service worker in production

## 📝 Production Checklist

Before going live:

- [ ] Run `npm run build` successfully
- [ ] Test production build locally: `npm run preview`
- [ ] Configure all required environment variables
- [ ] Enable HTTPS
- [ ] Set up error tracking
- [ ] Configure analytics
- [ ] Test all critical user flows
- [ ] Review `/system-status` page
- [ ] Set up backups
- [ ] Configure domain and DNS
- [ ] Test mobile responsiveness

## 📚 Additional Resources

- [Vite Production Guide](https://vitejs.dev/guide/build.html)
- [React Best Practices](https://react.dev/learn)
- [Base44 Documentation](https://appforge.fun/docs)
- [Web Vitals Guide](https://web.dev/vitals/)

## 🆘 Support

- GitHub Issues: [Report a bug](https://github.com/fernandogarzaaa/appforge/issues)
- Documentation: See README.md
- Base44 Support: https://appforge.fun/support
