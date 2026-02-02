/**
 * Database Migration Script
 * Run this to set up the database schema
 */

import mongoose from 'mongoose';
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import { logger } from '../src/config/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

/**
 * Run MongoDB migrations
 */
async function migrateMongoDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appforge';
    await mongoose.connect(uri);

    logger.info('Connected to MongoDB for migration');

    // Create collections with validation
    const collections = [
      {
        name: 'projects',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'userId'],
            properties: {
              name: { bsonType: 'string' },
              description: { bsonType: 'string' },
              userId: { bsonType: 'string' },
              status: { enum: ['active', 'archived', 'deleted'] }
            }
          }
        }
      },
      {
        name: 'entities',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'projectId'],
            properties: {
              name: { bsonType: 'string' },
              schema: { bsonType: 'object' },
              projectId: { bsonType: 'string' }
            }
          }
        }
      },
      {
        name: 'pages',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'projectId'],
            properties: {
              name: { bsonType: 'string' },
              path: { bsonType: 'string' },
              projectId: { bsonType: 'string' }
            }
          }
        }
      },
      {
        name: 'userstates',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId'],
            properties: {
              userId: { bsonType: 'objectId' },
              state: { bsonType: 'object' },
              version: { bsonType: 'int' }
            }
          }
        }
      },
      {
        name: 'analytics',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['event'],
            properties: {
              event: { bsonType: 'string' },
              userId: { bsonType: 'objectId' },
              sessionId: { bsonType: 'string' },
              properties: { bsonType: 'object' }
            }
          }
        }
      },
      {
        name: 'synclogs',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'entityType', 'entityId', 'action'],
            properties: {
              userId: { bsonType: 'objectId' },
              entityType: { bsonType: 'string' },
              entityId: { bsonType: 'string' },
              action: { bsonType: 'string' },
              status: { bsonType: 'string' }
            }
          }
        }
      }
    ];

    for (const collection of collections) {
      try {
        await mongoose.connection.db.createCollection(collection.name, {
          validator: collection.validator
        });
        logger.info(`✅ Created collection: ${collection.name}`);
      } catch (error) {
        if (error.code === 48) {
          logger.info(`Collection ${collection.name} already exists`);
        } else {
          throw error;
        }
      }
    }

    // Create indexes
    const db = mongoose.connection.db;
    
    await db.collection('projects').createIndex({ userId: 1 });
    await db.collection('projects').createIndex({ status: 1 });
    await db.collection('projects').createIndex({ createdAt: -1 });
    
    await db.collection('entities').createIndex({ projectId: 1 });
    await db.collection('entities').createIndex({ name: 1 });
    
    await db.collection('pages').createIndex({ projectId: 1 });
    await db.collection('pages').createIndex({ path: 1 });

    await db.collection('userstates').createIndex({ userId: 1, updatedAt: -1 });
    await db.collection('userstates').createIndex({ userId: 1, deviceId: 1 });

    await db.collection('analytics').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('analytics').createIndex({ event: 1, createdAt: -1 });

    await db.collection('synclogs').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('synclogs').createIndex({ entityType: 1, entityId: 1, createdAt: -1 });

    logger.info('✅ MongoDB indexes created');

    await mongoose.disconnect();
    logger.info('MongoDB migration complete');
  } catch (error) {
    logger.error('MongoDB migration failed:', error);
    throw error;
  }
}

/**
 * Run PostgreSQL migrations
 */
async function migratePostgreSQL() {
  try {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      database: process.env.POSTGRES_DB || 'appforge',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      logging: false
    });

    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL for migration');

    // Read and execute SQL file
    const sqlFile = path.join(__dirname, 'init-postgres.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    await sequelize.query(sql);
    logger.info('✅ PostgreSQL schema created');

    await sequelize.close();
    logger.info('PostgreSQL migration complete');
  } catch (error) {
    logger.error('PostgreSQL migration failed:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  logger.info('🚀 Starting database migrations...');

  try {
    // Run migrations based on configuration
    if (process.env.MONGODB_URI) {
      await migrateMongoDB();
    }

    if (process.env.POSTGRES_HOST && process.env.POSTGRES_DB) {
      await migratePostgreSQL();
    }

    logger.info('🎉 All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
migrate();
