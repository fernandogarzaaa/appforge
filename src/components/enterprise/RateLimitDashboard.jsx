import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import * as rateLimit from '@/utils/apiRateLimit';

const TIER_LIMITS = {
  free: { requests: 100, window: 60 },
  pro: { requests: 1000, window: 60 },
  enterprise: { requests: 10000, window: 60 }
};

export default function RateLimitDashboard() {
  const [limiters, setLimiters] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    blockedRequests: 0,
    activeUsers: 0,
    avgResponse: 0
  });
  const [simulationData, setSimulationData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [testUserId, setTestUserId] = useState('user-123');
  const [message, setMessage] = useState('');

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate simulation data
    const data = [];
    for (let i = 0; i < 10; i++) {
      data.push({
        time: `${i}s`,
        requests: Math.floor(Math.random() * 150) + 50,
        blocked: Math.floor(Math.random() * 20)
      });
    }
    setSimulationData(data);
  }, []);

  const updateStats = () => {
    const allStats = rateLimit.getRateLimitStats();
    setStats(allStats);
    setLimiters(Array.from(allStats.topUsers || []).slice(0, 5));
  };

  const handleCheckLimit = () => {
    if (!testUserId) {
      setMessage('Please enter a user ID');
      return;
    }

    const tierConfig = TIER_LIMITS[userTier];
    const info = rateLimit.checkRateLimit(testUserId, {
      maxRequests: tierConfig.requests,
      windowMs: tierConfig.window * 1000
    });

    if (info.blocked) {
      setMessage(`❌ Rate limited! Retry after ${info.retryAfter}ms`);
    } else {
      setMessage(
        `✅ Request allowed. Remaining: ${info.remaining}/${info.limit}`
      );
    }

    setSelectedUser({
      userId: testUserId,
      tier: userTier,
      ...info
    });

    setTimeout(() => setMessage(''), 5000);
  };

  const handleSimulateTraffic = async () => {
    const requests = [];
    for (let i = 0; i < 150; i++) {
      const userId = `user-${Math.floor(Math.random() * 10)}`;
      const tierConfig = TIER_LIMITS[userTier];
      const info = rateLimit.checkRateLimit(userId, {
        maxRequests: tierConfig.requests,
        windowMs: tierConfig.window * 1000
      });
      requests.push({ userId, blocked: info.blocked });

      // Simulate slight delay between requests
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const blocked = requests.filter(r => r.blocked).length;
    setMessage(
      `✅ Simulated 150 requests. Blocked: ${blocked} (${(blocked / 150 * 100).toFixed(1)}%)`
    );
    updateStats();

    setTimeout(() => setMessage(''), 5000);
  };

  const handleCleanup = () => {
    rateLimit.cleanupRateLimiters();
    setMessage('✅ Old rate limiters cleaned up');
    updateStats();

    setTimeout(() => setMessage(''), 3000);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 dark:bg-gray-800';
      case 'pro':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'enterprise':
        return 'bg-purple-100 dark:bg-purple-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getUsagePercentage = (remaining, limit) => {
    return Math.max(0, 100 - (remaining / limit * 100));
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        ⚡ Rate Limit Dashboard
      </h2>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('❌')
            ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">Total Requests</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalRequests}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">Blocked</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.blockedRequests}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">Active Users</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.activeUsers}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">Avg Response</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.avgResponse}ms
          </p>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Test Rate Limit
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="User ID"
            value={testUserId}
            onChange={e => setTestUserId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <select
            value={userTier}
            onChange={e => setUserTier(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="free">Free (100/min)</option>
            <option value="pro">Pro (1000/min)</option>
            <option value="enterprise">Enterprise (10000/min)</option>
          </select>
          <button
            onClick={handleCheckLimit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Check Limit
          </button>
          <button
            onClick={handleSimulateTraffic}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Simulate Traffic
          </button>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Traffic Pattern
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#3b82f6"
                name="Requests"
              />
              <Line
                type="monotone"
                dataKey="blocked"
                stroke="#ef4444"
                name="Blocked"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected User Details */}
      {selectedUser && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            User Details: {selectedUser.userId}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tier</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 capitalize">
                {selectedUser.tier}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Limit</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {selectedUser.limit}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {selectedUser.remaining}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className={`text-lg font-bold ${
                selectedUser.blocked
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {selectedUser.blocked ? 'BLOCKED' : 'ALLOWED'}
              </p>
            </div>
          </div>

          {/* Usage Bar */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Usage
            </p>
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all"
                style={{
                  width: `${getUsagePercentage(selectedUser.remaining, selectedUser.limit)}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {Math.round(getUsagePercentage(selectedUser.remaining, selectedUser.limit))}% used
            </p>
          </div>

          {selectedUser.resetTime && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Resets in: {Math.round(selectedUser.resetTime / 1000)}s
            </p>
          )}
        </div>
      )}

      {/* Top Users */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Users by Requests
          </h3>
          <button
            onClick={handleCleanup}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Cleanup
          </button>
        </div>
        <div className="space-y-2">
          {limiters.length > 0 ? (
            limiters.map((limiter, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${getTierColor('free')}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {limiter[0] || `User ${idx + 1}`}
                  </p>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {limiter[1]?.requests || 0} requests
                  </span>
                </div>
                <div className="w-full bg-gray-400 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${Math.min(100, (limiter[1]?.requests || 0) / 100 * 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No active rate limiters
            </p>
          )}
        </div>
      </div>

      {/* Tier Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(TIER_LIMITS).map(([tier, limits]) => (
          <div
            key={tier}
            className={`p-4 rounded-lg border ${getTierColor(tier)} border-gray-300 dark:border-gray-700`}
          >
            <h5 className="font-semibold text-gray-900 dark:text-white capitalize mb-2">
              {tier} Plan
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>{limits.requests}</strong> requests per <strong>{limits.window}</strong> second
              {limits.window !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
