const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection pool event handlers
pool.on('connect', (client) => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err.message });
  process.exit(-1);
});

// Health check function
const healthCheck = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.debug('Database health check passed', { timestamp: result.rows[0].now });
    return true;
  } catch (err) {
    logger.error('Database health check failed', { error: err.message });
    return false;
  }
};

// Initialize periodic health checks
setInterval(async () => {
  await healthCheck();
}, 30000);

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down database connection pool');
  try {
    await pool.end();
    logger.info('Database connection pool closed successfully');
  } catch (err) {
    logger.error('Error closing database connection pool', { error: err.message });
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = {
  query: (text, params) => {
    return pool.query(text, params);
  },
  getClient: () => {
    return pool.connect();
  },
  pool,
  healthCheck,
  shutdown,
};
