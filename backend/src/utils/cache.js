/**
 * Simple in-memory cache with TTL support
 */

const cacheStore = new Map();

const getCacheEntry = (key) => {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value;
};

const setCacheEntry = (key, value, ttlMs = 60000) => {
  const expiresAt = ttlMs ? Date.now() + ttlMs : null;
  cacheStore.set(key, { value, expiresAt });
};

const deleteCacheEntry = (key) => {
  cacheStore.delete(key);
};

const clearCache = () => {
  cacheStore.clear();
};

export { getCacheEntry, setCacheEntry, deleteCacheEntry, clearCache };
export default {
  get: getCacheEntry,
  set: setCacheEntry,
  del: deleteCacheEntry,
  clear: clearCache
};
