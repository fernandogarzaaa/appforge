import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import errorHandler from './middleware/errorHandler.js';
import rateLimiter, { initializeRateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import quantumRoutes from './routes/quantumRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import creditsRoutes from './routes/creditsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import teamSettingsRoutes from './routes/teamSettingsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import persistenceRoutes from './routes/persistenceRoutes.js';
import embeddingsRoutes from './routes/embeddingsRoutes.js';
import base44Routes from './routes/base44Routes.js';
import botRoutes from './routes/botRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import botScheduler from './services/botScheduler.js';
import { handleStripeWebhook } from './services/stripeService.js';
import WebSocketServer from './websocket/index.js';
import { setIO } from './websocket/emitter.js';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Initialize Sentry (must be first)
import { initializeSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from './config/sentry.js';
import { sanitizeInput } from './middleware/validation.js';

// Advanced observability & tracing
import { tracingMiddleware } from './middleware/distributedTracing.js';
import { profilingMiddleware, MemoryProfiler } from './middleware/performanceProfiling.js';
import { quantumFailoverMiddleware, createQuantumHealthEndpoint, createQuantumResetEndpoint } from './middleware/quantumFailover.js';
import { queryResultCacheMiddleware } from './middleware/cacheDecorator.js';
import { setupSwagger } from './config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_TEST = NODE_ENV === 'test' || process.argv.includes('--test');

// Initialize Sentry error tracking
if (!IS_TEST) {
  initializeSentry(app);
}

// Security Middleware
app.use(helmet());

// Sentry request handler (must be before routes)
if (!IS_TEST && process.env.SENTRY_DSN) {
  app.use(sentryRequestHandler());
  app.use(sentryTracingHandler());
}

// Distributed tracing (cross-service request tracking)
if (!IS_TEST) {
  app.use(tracingMiddleware);
}

// Performance profiling (execution time & memory tracking)
if (!IS_TEST) {
  app.use(profilingMiddleware);
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Stripe webhook endpoint (MUST be before body parser middleware)
// Stripe requires raw body for signature verification
app.post('/webhook/stripe', 
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Input sanitization (XSS protection)
app.use(sanitizeInput);

// Rate limiting
app.use('/api/', rateLimiter);

// Quantum failover middleware (graceful degradation)
app.use('/api/quantum', quantumFailoverMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// Quantum service health check (for circuit breaker status)
app.get('/api/quantum/health', createQuantumHealthEndpoint());

// Quantum circuit breaker reset (admin only)
app.post('/api/quantum/reset', createQuantumResetEndpoint());

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'API Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      quantum: 'ready',
      collaboration: 'ready',
      security: 'ready',
      authentication: 'ready'
    }
  });
});

// Setup Swagger/OpenAPI documentation
setupSwagger(app);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/quantum', quantumRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/persistence', persistenceRoutes);
app.use('/api/embeddings', embeddingsRoutes);
app.use('/api/base44', base44Routes);
app.use('/api/bots', botRoutes);
app.use('/api/webhooks', webhookRoutes);

// Frontend persistence layer routes
app.use('/api/user', settingsRoutes);
app.use('/api/team', teamSettingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminDashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Sentry error handler (must be before other error handlers)
if (!IS_TEST && process.env.SENTRY_DSN) {
  app.use(sentryErrorHandler());
}

// Global error handler (must be last)
app.use(errorHandler);

export let httpServer = null;
export let wsServer = null;

if (!IS_TEST) {
  // Create HTTP server for WebSocket integration
  httpServer = createServer(app);

  // Initialize WebSocket server
  wsServer = new WebSocketServer(httpServer);
  setIO(wsServer.io);
  console.log('✅ WebSocket server initialized');
}

export async function closeServer() {
  if (wsServer && typeof wsServer.close === 'function') {
    await wsServer.close();
  }

  if (httpServer && typeof httpServer.close === 'function') {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  if (mongoose.connection?.readyState) {
    await mongoose.disconnect();
  }
}

// Initialize MongoDB connection
export async function initializeDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appforge';

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB connected: ${mongoUri}`);

    // Start bot scheduler after database connection
    try {
      await botScheduler.start();
      console.log('✅ Bot scheduler started');
    } catch (error) {
      console.warn(`⚠️  Bot scheduler failed to start: ${error.message}`);
    }
  } catch (error) {
    console.warn(`⚠️  MongoDB connection failed: ${error.message}`);
    console.warn('Database features will be unavailable. Server will continue without persistence.');
  }
}

// Start server (avoid top-level await in tests)
if (!IS_TEST && httpServer && wsServer) {
  Promise.all([
    initializeDatabase(),
    initializeRateLimiter()
  ])
    .catch(() => {
      // Initialization already logs its own warnings.
    })
    .finally(() => {
      httpServer.listen(PORT, () => {
        console.log(`🚀 AppForge Backend Server`);
        console.log(`📍 Running on http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${NODE_ENV}`);
        console.log(`⏰ Started at ${new Date().toISOString()}`);
        console.log(`🔌 WebSocket server ready for real-time collaboration`);
        
        // Log WebSocket stats every 5 minutes
        setInterval(() => {
          const stats = wsServer.getStats();
          console.log(`📊 WebSocket Stats: ${stats.connectedUsers} users, ${stats.activeRooms} rooms, ${stats.onlineUsers} online`);
        }, 300000);
      });
    });
}

export default app;
