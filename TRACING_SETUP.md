# Tracing Setup for AppForge

This document explains the OpenTelemetry tracing setup integrated into AppForge.

## Overview

Tracing is configured to work with **AI Toolkit's trace collector** for visualizing distributed traces across the application.

## Backend Tracing

### Setup

The backend tracing is initialized in `backend/tracing.js` and imported at the top of `backend/server.js`:

```javascript
import { initializeTracing } from './tracing.js';
initializeTracing();
```

### Instrumented Components

The following are automatically instrumented:

- **Express.js**: HTTP request/response tracking
- **PostgreSQL**: Database query tracing via `pg` instrumentation
- **Redis**: Cache operation tracing
- **HTTP Calls**: Outbound API requests
- **OpenAI API**: AI model calls with content recording

### Configuration

Environment variables for tracing:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces  # OTLP HTTP endpoint
SERVICE_NAME=appforge-backend                                 # Service identifier
SERVICE_VERSION=1.0.0                                         # Service version
NODE_ENV=development                                          # Environment
```

### Installation

Install tracing dependencies:

```bash
cd backend
npm install
```

Required packages:
- `@opentelemetry/sdk-trace-node`
- `@opentelemetry/exporter-trace-otlp-proto`
- `@opentelemetry/instrumentation-*` (express, http, pg, redis)
- `@traceloop/instrumentation-openai`

## Frontend Tracing

### Setup

Frontend tracing is initialized in `src/lib/tracing.js` and imported in `src/main.jsx`:

```javascript
import { initializeTracingClient } from '@/lib/tracing.js'
initializeTracingClient();
```

### Features

The frontend provides:

1. **Automatic Instrumentation**: Loads when AI Toolkit extension is active
2. **API Tracing**: `tracedFetch()` for tracking HTTP requests
3. **Operation Tracing**: `traceOperation()` for custom operation tracking
4. **Performance Logging**: Duration and status tracking

### Usage Examples

**Track custom operations:**
```javascript
import { traceOperation } from '@/lib/tracing.js'

// Example: Track feature initialization
await traceOperation('Phase7_Analytics_Init', async () => {
  return initializeAnalytics();
});
```

**Track API requests:**
```javascript
import { tracedFetch } from '@/lib/tracing.js'

const response = await tracedFetch('/api/analytics/metrics', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Running with AI Toolkit

### Prerequisites

1. Install VS Code AI Toolkit extension
2. Ensure backend is running on port 5000
3. Ensure frontend dev server is running on port 5173

### Steps

1. **Open Trace Viewer**
   - In VS Code, open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Run: `ai-mlstudio.tracing.open`
   - This starts the trace collector and opens the viewer

2. **Generate Traces**
   - Use the application normally
   - Make API requests
   - Interact with features

3. **View Traces**
   - Traces appear in the AI Toolkit trace viewer
   - Inspect spans, durations, status codes
   - Analyze performance bottlenecks

## Trace Structure

Each trace includes:

- **Span Name**: Operation identifier (e.g., `GET /api/analytics/metrics`)
- **Duration**: Execution time in milliseconds
- **Status**: HTTP status code or error
- **Attributes**: Service name, version, environment
- **Events**: Important points in execution (e.g., database calls)

## Example Traces

### API Request Flow

```
GET /api/analytics/metrics
├── PostgreSQL: SELECT * FROM analytics
├── Redis: CACHE HIT metrics:latest
└── HTTP Response (200 OK)
Duration: 45ms
```

### Feature Initialization

```
Phase7_Analytics_Init
├── Load historical data (PostgreSQL)
├── Initialize chart components (React)
├── Fetch user preferences (HTTP)
└── Render dashboard
Duration: 230ms
```

## Troubleshooting

### No traces appearing

1. Verify AI Toolkit extension is installed
2. Confirm `ai-mlstudio.tracing.open` was executed
3. Check OTLP endpoint is accessible: `http://localhost:4318/v1/traces`
4. Verify environment variables are set correctly

### Traces not showing request bodies

Add to backend/tracing.js:
```javascript
process.env["AZURE_TRACING_GEN_AI_INCLUDE_BINARY_DATA"] = "true"
```

### Performance impact

- Tracing adds minimal overhead (~2-5% latency)
- Consider using sampling in production: configure `BatchSpanProcessor` with `maxExportBatchSize: 512`

## Production Deployment

For production, configure:

1. **Sampling**: Use `ParentBasedSampler` to reduce data volume
2. **Batching**: Increase batch size for efficiency
3. **Endpoint**: Use secure OTLP receiver (e.g., cloud-hosted collector)
4. **Retention**: Configure trace storage limits

Example production config:
```javascript
const sampler = new ParentBasedSampler({
  root: new ProbabilitySampler(0.1), // 10% sampling
});

const provider = new NodeTracerProvider({
  resource: resourceFromAttributes({...}),
  sampler: sampler,
});
```

## Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry Node.js SDK](https://github.com/open-telemetry/opentelemetry-js)
- [OTLP Protocol](https://github.com/open-telemetry/opentelemetry-proto)
- [AI Toolkit Documentation](https://marketplace.visualstudio.com/items?itemName=ms-ai-tools.ai-toolkit-vscode)

## Support

For issues with tracing setup:
1. Check browser console for frontend errors
2. Check backend logs for OTLP connection errors
3. Verify network connectivity to OTLP endpoint
4. Review OpenTelemetry debug logs: `OTEL_LOG_LEVEL=debug`
