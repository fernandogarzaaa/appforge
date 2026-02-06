import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook for multi-level caching strategy
 * @returns {Object} Cache management utilities
 */
export const useCacheStrategy = () => {
  const [cacheStats, setCacheStats] = useState({
    memory: { hits: 0, misses: 0, size: 0 },
    redis: { hits: 0, misses: 0, size: 0 },
    cdn: { hits: 0, misses: 0, size: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [memoryCache] = useState(new Map());

  /**
   * Get from cache with fallback chain
   */
  const get = useCallback(async (key, fetchFn) => {
    setLoading(true);
    setError(null);

    try {
      // L1: Memory cache
      if (memoryCache.has(key)) {
        setCacheStats(prev => ({
          ...prev,
          memory: { ...prev.memory, hits: prev.memory.hits + 1 },
        }));
        setLoading(false);
        return memoryCache.get(key);
      }

      // L2: Backend cache
      const cacheResponse = await base44.functions.invoke('cacheManager', {
        action: 'get',
        key
      });

      if (cacheResponse?.data?.hit) {
        const cachedValue = cacheResponse.data.value;
        memoryCache.set(key, cachedValue);
        setCacheStats(prev => ({
          ...prev,
          redis: { ...prev.redis, hits: prev.redis.hits + 1 },
        }));
        setLoading(false);
        return cachedValue;
      }

      // L3: Fetch from source
      const value = await fetchFn();
      await set(key, value);
      
      setCacheStats(prev => ({
        ...prev,
        memory: { ...prev.memory, misses: prev.memory.misses + 1 },
        redis: { ...prev.redis, misses: prev.redis.misses + 1 },
      }));

      return value;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [memoryCache]);

  /**
   * Set value in all cache levels
   */
  const set = useCallback(async (key, value, ttl = 3600) => {
    try {
      // L1: Memory
      memoryCache.set(key, value);

      // L2: Backend cache
      await base44.functions.invoke('cacheManager', {
        action: 'set',
        key,
        value,
        ttl
      });

      // Update stats
      setCacheStats(prev => ({
        ...prev,
        memory: { ...prev.memory, size: memoryCache.size },
        redis: { ...prev.redis, size: prev.redis.size + 1 },
      }));

      // Auto-expire memory cache after TTL
      setTimeout(() => {
        memoryCache.delete(key);
      }, ttl * 1000);
    } catch (err) {
      console.error('Cache set failed:', err);
    }
  }, [memoryCache]);

  /**
   * Invalidate cache key
   */
  const invalidate = useCallback(async (pattern) => {
    try {
      // Clear memory cache
      if (pattern === '*') {
        memoryCache.clear();
      } else {
        for (const key of memoryCache.keys()) {
          if (key.includes(pattern)) {
            memoryCache.delete(key);
          }
        }
      }

      // Clear backend cache
      await base44.functions.invoke('cacheManager', {
        action: 'invalidate',
        pattern
      });

      setCacheStats(prev => ({
        ...prev,
        memory: { ...prev.memory, size: memoryCache.size },
      }));
    } catch (err) {
      setError(err.message);
    }
  }, [memoryCache]);

  /**
   * Get cache hit rate
   */
  const getHitRate = useCallback((level) => {
    const stats = cacheStats[level];
    const total = stats.hits + stats.misses;
    return total > 0 ? ((stats.hits / total) * 100).toFixed(2) : 0;
  }, [cacheStats]);

  return {
    cacheStats,
    loading,
    error,
    get,
    set,
    invalidate,
    getHitRate,
  };
};
