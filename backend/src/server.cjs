const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { createServer } = require('http');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { requestContext } = require('./middleware/requestContext');
const ddosProtection = require('./middleware/ddosProtection');
const tenantContext = require('./middleware/tenantContext');
const { sanitizeInput } = require('./middleware/validation');
const authRoutes = require('./routes/authRoutes');
const quantumRoutes = require('./routes/quantumRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const securityRoutes = require('./routes/securityRoutes');
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const creditsRoutes = require('./routes/creditsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const teamSettingsRoutes = require('./routes/teamSettingsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const persistenceRoutes = require('./routes/persistenceRoutes');
const observabilityRoutes = require('./routes/observabilityRoutes');
const batchRoutes = require('./routes/batchRoutes');
const pluginRoutes = require('./routes/pluginRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const scheduledRoutes = require('./routes/scheduledRoutes');
const { handleStripeWebhook } = require('./services/stripeService');
const { startMetrics, metricsMiddleware } = require('./observability/metrics');
const { tracingMiddleware } = require('./observability/tracing');
const { loadPlugins } = require('./plugins/registry');
const { configureReadReplicas } = require('./services/databaseRouting');
const { startBatchWorker, stopBatchWorker } = require('./workers/batchWorker');
const { startScheduledWorker, stopScheduledWorker } = require('./workers/scheduledWorker');
const { getQueue } = require('./services/batchQueue');
const { graphqlHTTP } = require('express-graphql');
const { schema, root } = require('./graphql/index');
const WebSocketServer = require('./websocket/index');
const { setIO } = require('./websocket/emitter');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const app = express();
let batchWorker;
let scheduledWorker;
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_TEST = NODE_ENV === 'test' || process.argv.includes('--test');

// Configure read replicas if provided
const replicaUris = (process.env.READ_REPLICA_URIS || '')
  .split(',')
  .map(uri => uri.trim())
  .filter(Boolean);

if (replicaUris.length > 0) {
  configureReadReplicas(replicaUris);
}

// Load custom plugins
loadPlugins();

// Security Middleware
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      if (NODE_ENV === 'production') {
        return callback(new Error('CORS: Origin required'), false);
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Tenant-Id'],
  exposedHeaders: ['X-Request-Id', 'Traceparent', 'X-Tenant-Id']
}));

// Request context + tenant context
app.use(requestContext);
app.use(tenantContext);

// DDoS protection (burst control)
app.use(ddosProtection);

// Observability metrics/tracing
startMetrics();
app.use(metricsMiddleware);
app.use(tracingMiddleware);

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

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

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

// Observability & operations
app.use('/api/observability', observabilityRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/plugins', pluginRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/scheduled', scheduledRoutes);

// GraphQL endpoint
app.use('/graphql', graphqlHTTP((req) => ({
  schema,
  rootValue: root,
  graphiql: NODE_ENV !== 'production',
  context: {
    userId: req.user?.id,
    tenantId: req.tenant?.id
  }
})));

// Bull Board - Queue monitoring dashboard
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

try {
  const queue = getQueue();
  if (queue) {
    createBullBoard({
      queues: [new BullMQAdapter(queue)],
      serverAdapter,
    });
    app.use('/admin/queues', serverAdapter.getRouter());
    console.log('✓ Queue monitoring dashboard enabled at /admin/queues');
  }
} catch (error) {
  console.warn('⚠️  Bull Board setup failed:', error.message);
}

// Frontend persistence layer routes
app.use('/api/user', settingsRoutes);
app.use('/api/team', teamSettingsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be last)
app.use(errorHandler);

let httpServer = null;
let wsServer = null;

if (!IS_TEST) {
  // Create HTTP server for WebSocket integration
  httpServer = createServer(app);

  // Initialize WebSocket server
  wsServer = new WebSocketServer(httpServer);
  setIO(wsServer.io);
  console.log('✅ WebSocket server initialized');
}

async function closeServer() {
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
async function initializeDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appforge';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log(`✅ MongoDB connected: ${mongoUri}`);
  } catch (error) {
    console.warn(`⚠️  MongoDB connection failed: ${error.message}`);
    console.warn('Database features will be unavailable. Server will continue without persistence.');
  }

  // Load custom plugins
  try {
    await loadPlugins();
    console.log('✓ Custom plugins loaded');
  } catch (error) {
    console.warn('⚠️  Plugin loading failed:', error.message);
  }

  // Configure read replicas if available
  if (replicaUris.length > 0) {
    try {
      await configureReadReplicas(replicaUris);
      console.log('✓ Read replicas configured');
    } catch (error) {
      console.warn('⚠️  Read replica configuration failed:', error.message);
    }
  }

  // Start batch worker
  try {
    batchWorker = startBatchWorker();
  } catch (error) {
    console.warn('⚠️  Batch worker failed to start:', error.message);
    console.warn('💡 Running in DEVELOPMENT MODE - jobs will process in-memory');
  }

  // Start scheduled jobs worker
  try {
    scheduledWorker = startScheduledWorker();
  } catch (error) {
    console.warn('⚠️  Scheduled worker failed to start:', error.message);
  }
}

// Graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down gracefully...');
  
  if (httpServer) {
    httpServer.close(async () => {
      if (batchWorker) {
        await stopBatchWorker(batchWorker);
      }
      if (scheduledWorker) {
        await stopScheduledWorker(scheduledWorker);
      }
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      console.log('✓ Server closed');
      process.exit(0);
    });
  }

  // Force exit after 30s
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server (avoid top-level await in tests)
if (!IS_TEST && httpServer && wsServer) {
  initializeDatabase()
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

module.exports = { app, httpServer, wsServer };
