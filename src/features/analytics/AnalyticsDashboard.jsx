import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { useFeatureAnalytics } from './useFeatureAnalytics';

/**
 * AnalyticsDashboard Component
 * Displays feature usage analytics, user engagement metrics, trending features, and health scores
 * Features: Feature usage tracking, Engagement metrics, Trending features, Feature health scores
 */
export const AnalyticsDashboard = () => {
  const {
    featureUsage,
    trackFeatureUsage,
    recordEvent,
    userEngagement,
    trackUserEngagement,
    getTrendingFeatures,
    getEngagementMetrics,
    getFeatureHealthScore,
    exportAnalyticsReport,
  } = useFeatureAnalytics();

  const [activeTab, setActiveTab] = useState('overview');
  const [trendingFeatures, setTrendingFeatures] = useState([]);
  /** @type {[{highEngagement?: number; mediumEngagement?: number; lowEngagement?: number;}, (e) => void]} */
  const [engagementMetrics, setEngagementMetrics] = useState({});
  const [selectedFeature, setSelectedFeature] = useState(null);

  useEffect(() => {
    const trending = getTrendingFeatures(5);
    setTrendingFeatures(trending);
    setEngagementMetrics(getEngagementMetrics());
  }, []);

  const handleExport = () => {
    exportAnalyticsReport('json');
  };

  const getEngagementColor = (level) => {
    switch (level) {
      case 'high':
        return 'text-green-400 bg-green-400/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-400/10';
    if (score >= 60) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-red-400 bg-red-400/10';
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
        >
          Export Analytics
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {['overview', 'features', 'engagement', 'trends'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Features */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Features</p>
                  <p className="text-2xl font-bold text-white">{Object.keys(featureUsage).length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            {/* Total Events */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Events</p>
                  <p className="text-2xl font-bold text-white">
                    {Object.values(featureUsage).reduce((sum, f) => sum + (f.usageCount || 0), 0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>

            {/* Avg Engagement */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Engagement</p>
                  <p className="text-2xl font-bold text-white">
                    {Object.values(userEngagement).length > 0
                      ? (
                          (Object.values(userEngagement).reduce(
                            (sum, u) => sum + (u.activityCount || 0),
                            0
                          ) / Object.values(userEngagement).length) | 0
                        )
                      : 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-white">{Object.keys(userEngagement).length}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Top Metrics */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">Engagement Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-sm">High Engagement</p>
                <p className="text-2xl font-bold text-green-400">
                  {engagementMetrics.highEngagement || 0}
                </p>
                <p className="text-slate-500 text-xs">users</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Medium Engagement</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {engagementMetrics.mediumEngagement || 0}
                </p>
                <p className="text-slate-500 text-xs">users</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Low Engagement</p>
                <p className="text-2xl font-bold text-slate-400">
                  {engagementMetrics.lowEngagement || 0}
                </p>
                <p className="text-slate-500 text-xs">users</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-3">
          {Object.entries(featureUsage).map(([name, data]) => {
            const health = getFeatureHealthScore(name);
            return (
              <div
                key={name}
                onClick={() => setSelectedFeature(selectedFeature === name ? null : name)}
                className="bg-slate-800 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium capitalize">{name.replace(/_/g, ' ')}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getHealthColor(health)}`}>
                    Health: {health}%
                  </div>
                </div>
                {selectedFeature === name && (
                  <div className="space-y-2 text-sm text-slate-400">
                    <p>Usage Count: <span className="text-white font-medium">{data.usageCount}</span></p>
                    <p>Adoption: <span className="text-white font-medium">{(data.adoption * 100).toFixed(1)}%</span></p>
                    <p>Last Used: <span className="text-white font-medium">{new Date(data.lastUsed).toLocaleString()}</span></p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="space-y-3">
          {Object.entries(userEngagement)
            .sort((a, b) => (b[1].activityCount || 0) - (a[1].activityCount || 0))
            .slice(0, 20)
            .map(([userId, data]) => (
              <div key={userId} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">{userId}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getEngagementColor(data.level)}`}>
                    {data.level || 'low'} Engagement
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Activities</p>
                    <p className="text-white font-medium">{data.activityCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Avg Duration</p>
                    <p className="text-white font-medium">{(data.avgDuration || 0).toFixed(0)}ms</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Score</p>
                    <p className="text-white font-medium">{(data.score || 0).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Top Features by Adoption</h3>
          {trendingFeatures.length > 0 ? (
            <div className="space-y-3">
              {trendingFeatures.map((feature, idx) => {
                const data = featureUsage[feature.name];
                return (
                  <div key={feature.name} className="bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          {idx + 1}
                        </div>
                        <h3 className="text-white font-medium capitalize">{feature.name.replace(/_/g, ' ')}</h3>
                      </div>
                      <span className="text-purple-400 font-bold text-lg">{(feature.adoption * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                        style={{ width: `${feature.adoption * 100}%` }}
                      />
                    </div>
                    <p className="text-slate-400 text-xs mt-2">{data?.usageCount || 0} total uses</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No trending data available yet</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
