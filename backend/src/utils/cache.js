/**
 * Cache utility - Uses Redis when available, falls back to in-memory
 */

import redisCache from './redisCache.js';

// Wrapper functions that delegate to Redis cache
const getCacheEntry = async (key) => {
  return await redisCache.get(key);
};

const setCacheEntry = async (key, value, ttlMs = 60000) => {
  return await redisCache.set(key, value, ttlMs);
};

const deleteCacheEntry = async (key) => {
  return await redisCache.del(key);
};

const clearCache = async () => {
  return await redisCache.clear();
};

const deletePattern = async (pattern) => {
  return await redisCache.delPattern(pattern);
};

export { getCacheEntry, setCacheEntry, deleteCacheEntry, clearCache, deletePattern };
export default {
  get: getCacheEntry,
  set: setCacheEntry,
  del: deleteCacheEntry,
  clear: clearCache,
  delPattern: deletePattern
};
