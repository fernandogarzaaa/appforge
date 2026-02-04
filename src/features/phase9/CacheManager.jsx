import React, { useState } from 'react';
import { useCacheStrategy } from './useCacheStrategy';

/**
 * Cache Manager Component
 * Configure caching and manual invalidation
 */
export const CacheManager = () => {
  const { cacheStats, invalidate, getHitRate } = useCacheStrategy();
  const [pattern, setPattern] = useState('');
  const [message, setMessage] = useState('');

  const handleInvalidate = async () => {
    try {
      await invalidate(pattern || '*');
      setMessage(`Cache invalidated for pattern: ${pattern || '*'}`);
      setPattern('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Cache Manager</h1>

      {/* Cache Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Cache Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['memory', 'redis', 'cdn'].map(level => (
            <div key={level} className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-lg capitalize mb-2">{level} Cache</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hits:</span>
                  <span className="font-semibold text-green-600">{cacheStats[level].hits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Misses:</span>
                  <span className="font-semibold text-red-600">{cacheStats[level].misses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-semibold">{cacheStats[level].size}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Hit Rate:</span>
                  <span className="font-bold text-blue-600">{getHitRate(level)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cache Invalidation */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Cache Invalidation</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pattern (leave empty for all)
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g., user:*, project:123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleInvalidate}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Invalidate Cache
          </button>
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Cache Configuration */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Cache Configuration</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memory TTL (seconds)
              </label>
              <input
                type="number"
                defaultValue={300}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Redis TTL (seconds)
              </label>
              <input
                type="number"
                defaultValue={3600}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Memory Size (MB)
              </label>
              <input
                type="number"
                defaultValue={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CDN TTL (seconds)
              </label>
              <input
                type="number"
                defaultValue={86400}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Update Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
