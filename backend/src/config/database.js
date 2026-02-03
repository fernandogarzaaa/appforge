/**
 * Database Configuration
 * Supports both MongoDB and PostgreSQL
 */

import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { logger } from './logger.js';

// MongoDB connection
let mongoConnection = null;

// PostgreSQL connection
let sequelizeConnection = null;

/**
 * Connect to MongoDB
 * Supports read replicas for horizontal scaling
 */
export async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appforge';
    const readReplicaUri = process.env.MONGODB_READ_REPLICA_URI;
    
    mongoose.set('strictQuery', true);
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE ? parseInt(process.env.MONGODB_MAX_POOL_SIZE) : 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Read preference for read replicas
      readPreference: readReplicaUri ? 'secondaryPreferred' : 'primary',
      retryWrites: true,
      w: 'majority',
    };

    // If read replica is configured, use replica set connection string
    const connectionUri = readReplicaUri 
      ? `${uri},${readReplicaUri}` 
      : uri;
    
    const connection = await mongoose.connect(connectionUri, options);

    mongoConnection = connection;

    logger.info(`✅ MongoDB connected: ${connection.connection.host}`);
    logger.info(`📊 Database: ${connection.connection.name}`);
    logger.info(`📖 Read preference: ${options.readPreference}`);
    logger.info(`🔢 Connection pool: ${options.minPoolSize}-${options.maxPoolSize}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Connect to PostgreSQL using Sequelize
 * Supports read replicas for load distribution
 */
export async function connectPostgreSQL() {
  try {
    const replicationConfig = process.env.POSTGRES_READ_REPLICA_HOST ? {
      read: [{
        host: process.env.POSTGRES_READ_REPLICA_HOST,
        port: parseInt(process.env.POSTGRES_READ_REPLICA_PORT) || 5432,
        username: process.env.POSTGRES_READ_REPLICA_USER || process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_READ_REPLICA_PASSWORD || process.env.POSTGRES_PASSWORD || '',
      }],
      write: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
      }
    } : undefined;

    const sequelize = new Sequelize({
      dialect: 'postgres',
      replication: replicationConfig,
      // If no replication, use single host
      ...(!replicationConfig && {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
      }),
      database: process.env.POSTGRES_DB || 'appforge',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: process.env.POSTGRES_MAX_POOL_SIZE ? parseInt(process.env.POSTGRES_MAX_POOL_SIZE) : 50,
        min: 5,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    });

    // Test connection
    await sequelize.authenticate();
    
    sequelizeConnection = sequelize;

    const primaryHost = replicationConfig ? replicationConfig.write.host : process.env.POSTGRES_HOST;
    const replicaCount = replicationConfig ? replicationConfig.read.length : 0;
    
    logger.info(`✅ PostgreSQL connected: ${primaryHost}:${process.env.POSTGRES_PORT}`);
    logger.info(`📊 Database: ${process.env.POSTGRES_DB}`);
    logger.info(`📖 Read replicas: ${replicaCount} configured`);
    logger.info(`🔢 Connection pool: 5-${process.env.POSTGRES_MAX_POOL_SIZE || 50}`);

    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('📋 Database models synchronized');
    }

    return sequelize;
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

/**
 * Connect to all configured databases
 */
export async function connectDatabases() {
  const promises = [];

  // Connect to MongoDB if configured
  if (process.env.MONGODB_URI) {
    promises.push(connectMongoDB());
  }

  // Connect to PostgreSQL if configured
  if (process.env.POSTGRES_HOST && process.env.POSTGRES_DB) {
    promises.push(connectPostgreSQL());
  }

  if (promises.length === 0) {
    logger.warn('⚠️  No database configured. Set MONGODB_URI or PostgreSQL credentials.');
    return;
  }

  try {
    await Promise.all(promises);
    logger.info('🎉 All databases connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from all databases
 */
export async function disconnectDatabases() {
  const promises = [];

  if (mongoConnection) {
    promises.push(mongoose.disconnect());
  }

  if (sequelizeConnection) {
    promises.push(sequelizeConnection.close());
  }

  try {
    await Promise.all(promises);
    logger.info('🔌 All databases disconnected');
  } catch (error) {
    logger.error('Error disconnecting databases:', error);
  }
}

/**
 * Get MongoDB connection
 */
export function getMongoConnection() {
  if (!mongoConnection) {
    throw new Error('MongoDB not connected');
  }
  return mongoConnection;
}

/**
 * Get PostgreSQL connection
 */
export function getPostgreSQLConnection() {
  if (!sequelizeConnection) {
    throw new Error('PostgreSQL not connected');
  }
  return sequelizeConnection;
}

// Export connections
export { mongoConnection, sequelizeConnection };
