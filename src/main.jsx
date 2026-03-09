/*
 * AppForge front-end entrypoint
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initializeAPI } from '@/api/services'

// Initialize tracing (MUST be first)
import { initializeTracingClient } from '@/lib/tracing.js'
initializeTracingClient();

// Initialize Sovereign Telemetry (Phase 8)
import { telemetryService } from '@/services/telemetryService'
telemetryService.start();

// Initialize Sentry for error tracking
import { initializeSentry, setSentryContext } from '@/lib/sentryConfig.jsx'
initializeSentry();

// Initialize API services
initializeAPI({
  apiUrl: import.meta.env.VITE_API_URL,
  wsUrl: import.meta.env.VITE_WS_URL,
  autoConnect: import.meta.env.VITE_WS_AUTO_CONNECT === 'true'
});

// Set initial Sentry context
setSentryContext('environment', {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'disabled',
  appVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
});

console.log('[AppForge] API services initialized', {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'disabled'
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
