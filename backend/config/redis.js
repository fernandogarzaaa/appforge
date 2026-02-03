const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times > 3) {
      console.warn('⚠️  Redis connection failed after 3 retries - falling back to development mode');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create Redis connection for BullMQ
const createRedisConnection = () => {
  const redis = new Redis(redisConfig);
  
  redis.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.warn('⚠️  Redis not available - using in-memory development mode');
    }
  });
  
  return redis;
};

// Create Redis client for general caching (optional)
const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  console.log('✓ Redis client connected');
});

redisClient.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') {
    console.error('Redis connection error:', err.message);
  }
});

module.exports = redisConfig;
module.exports.createRedisConnection = createRedisConnection;
module.exports.redisClient = redisClient;

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times > 3) {
      console.warn('⚠️  Redis connection failed after 3 retries - falling back to development mode');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create Redis connection for BullMQ
const createRedisConnection = () => {
  const redis = new Redis(redisConfig);
  
  redis.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.warn('⚠️  Redis not available - using in-memory development mode');
    }
  });
  
  return redis;
};

// Create Redis client for general caching (optional)
const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  console.log('✓ Redis client connected');
});

redisClient.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') {
    console.error('Redis connection error:', err.message);
  }
});

module.exports = redisConfig;
