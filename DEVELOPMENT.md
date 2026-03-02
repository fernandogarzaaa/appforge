# Development Guide

This guide will help you set up AppForge for local development.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Git**: Latest version
- **Rust**: For building WASM components (optional)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/fernandogarzaaa/appforge.git
cd appforge
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - UPSTASH_REDIS_REST_URL
# - UPSTASH_REDIS_REST_TOKEN
# - GH_TOKEN (for swarm operations)
```

### 4. Start Development Server

```bash
# Start the frontend development server
npm run dev

# In a separate terminal, start the swarm daemon
npm run swarm:daemon
```

The application will be available at `http://localhost:5173`

## Development Workflow

### Running Tests

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run type checker
npm run typecheck
```

### Building

```bash
# Build for development
npm run build

# Build for production
npm run build:production

# Build quantum WASM components
npm run build:quantum

# Build static analyzer WASM components
npm run build:analyzer
```

## Swarm Operations

AppForge uses autonomous swarms for various operations:

```bash
# Run the swarm orchestrator
npm run swarm:orchestrator

# Run QA swarm
npm run swarm:qa

# Run benchmark swarm
npm run swarm:benchmark

# Check swarm status
npm run swarm:status

# View swarm logs
npm run swarm:logs
```

## Project Structure

```
appforge/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── styles/            # Global styles
├── backend/               # Backend API
│   ├── controllers/       # Route controllers
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   └── middleware/        # Express middleware
├── swarm/                 # Swarm orchestration
│   ├── agents/            # Agent definitions
│   ├── core/              # Core swarm logic
│   └── scripts/           # Swarm scripts
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── tests/                 # Test suites
```

## Common Issues

### npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
# Run type checker to see errors
npm run typecheck

# Common fixes:
# 1. Restart TypeScript server in your IDE
# 2. Check for missing type definitions: npm install --save-dev @types/<package>
```

### Swarm daemon won't start

```bash
# Check if pm2 is installed
npm list -g pm2

# Install pm2 globally if needed
npm install -g pm2

# Check swarm logs
npm run swarm:logs
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `GH_TOKEN` | GitHub token for swarm operations | Yes |
| `VITE_API_URL` | Backend API URL | No |
| `NODE_ENV` | Environment (development/production) | No |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## Getting Help

- Check the [documentation](./docs)
- Open an [issue](https://github.com/fernandogarzaaa/appforge/issues)
- Join our discussions
