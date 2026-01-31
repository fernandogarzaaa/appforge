/**
 * Configuration utilities
 */

export const getJWTConfig = () => ({
  secret: process.env.JWT_SECRET || 'dev-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256'
});

export const getDatabaseConfig = () => ({
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/appforge',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 50,
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 10,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4 // Use IPv4, skip trying IPv6
  }
});

export const getServerConfig = () => ({
  port: parseInt(process.env.PORT) || 5000,
  env: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
});

export const getCorsConfig = () => ({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
