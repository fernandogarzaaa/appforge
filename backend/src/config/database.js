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
 */
export async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appforge';
    
    mongoose.set('strictQuery', true);
    
    const connection = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    mongoConnection = connection;

    logger.info(`✅ MongoDB connected: ${connection.connection.host}`);
    logger.info(`📊 Database: ${connection.connection.name}`);

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
 */
export async function connectPostgreSQL() {
  try {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      database: process.env.POSTGRES_DB || 'appforge',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
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

    logger.info(`✅ PostgreSQL connected: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`);
    logger.info(`📊 Database: ${process.env.POSTGRES_DB}`);

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
