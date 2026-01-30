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
import rateLimiter from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import quantumRoutes from './routes/quantumRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import WebSocketServer from './websocket/index.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Middleware
app.use(helmet());
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

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Create HTTP server for WebSocket integration
const httpServer = createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(httpServer);
console.log('✅ WebSocket server initialized');

// Start server
if (process.env.NODE_ENV !== 'test') {
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
}

export default app;
