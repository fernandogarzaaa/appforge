/**
 * Analytics Dashboard Component
 * Displays comprehensive usage analytics and performance metrics
 */

import React, { useMemo, useState } from 'react';
import { analyticsService } from '@/services/analytics';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState(24); // hours

  const analytics = useMemo(() => {
    const summary = analyticsService.getInteractionSummary(timeRange * 60 * 60 * 1000);
    const performanceSummary = analyticsService.getPerformanceSummary();

    return {
      summary,
      performanceSummary,
      topModels: analyticsService.getTopModels(10),
      topSearches: analyticsService.getSearchAnalytics().slice(0, 10),
      keyboardUsage: analyticsService.getKeyboardShortcutStats().slice(0, 10),
    };
  }, [timeRange]);

  const eventBreakdownData = useMemo(() => {
    return Object.entries(analytics.summary.eventBreakdown).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').toUpperCase(),
      value: count,
    }));
  }, [analytics.summary.eventBreakdown]);

  const modelSelectionData = useMemo(() => {
    return analytics.topModels.map((model) => ({
      name: model.modelName,
      selections: model.count,
      provider: model.provider,
    }));
  }, [analytics.topModels]);

  const searchData = useMemo(() => {
    return analytics.topSearches.map((search) => ({
      query: search.query || '(empty)',
      searches: search.count,
    }));
  }, [analytics.topSearches]);

  const performanceData = useMemo(() => {
    return Object.entries(analytics.performanceSummary).map(([name, stats]) => ({
      metric: name,
      avg: Math.round(stats.avg * 10) / 10,
      min: Math.round(stats.min * 10) / 10,
      max: Math.round(stats.max * 10) / 10,
    }));
  }, [analytics.performanceSummary]);

  const handleExportData = () => {
    const data = analyticsService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')) {
      analyticsService.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track usage patterns, performance metrics, and user interactions</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Last 1 hour</option>
              <option value={24}>Last 24 hours</option>
              <option value={168}>Last 7 days</option>
              <option value={720}>Last 30 days</option>
            </select>
          </div>

          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Export Data
          </button>

          <button
            onClick={handleClearData}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            Clear Data
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {['overview', 'models', 'interactions', 'performance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.summary.totalEvents}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Events</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.topModels.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Models Used</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analytics.topSearches.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Unique Searches</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{analytics.keyboardUsage.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Shortcuts Used</div>
              </div>
            </div>

            {/* Event Breakdown Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Event Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Models by Selection</h2>
              {modelSelectionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={modelSelectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="selections" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No model selection data available</p>
              )}
            </div>

            {/* Model Details Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Model Details</h2>
              {analytics.topModels.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-4 text-gray-900 dark:text-white">Model</th>
                      <th className="text-left py-2 px-4 text-gray-900 dark:text-white">Provider</th>
                      <th className="text-left py-2 px-4 text-gray-900 dark:text-white">Selections</th>
                      <th className="text-left py-2 px-4 text-gray-900 dark:text-white">Last Selected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topModels.map((model) => (
                      <tr key={`${model.modelName}-${model.provider}`} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-2 px-4 text-gray-900 dark:text-white">{model.modelName}</td>
                        <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{model.provider}</td>
                        <td className="py-2 px-4 text-gray-900 dark:text-white font-semibold">{model.count}</td>
                        <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{new Date(model.lastSelected).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No model data available</p>
              )}
            </div>
          </div>
        )}

        {/* Interactions Tab */}
        {activeTab === 'interactions' && (
          <div className="space-y-8">
            {/* Search Queries */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Search Queries</h2>
              {searchData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={searchData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="query" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="searches" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No search data available</p>
              )}
            </div>

            {/* Keyboard Shortcuts Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Keyboard Shortcut Usage</h2>
              {analytics.keyboardUsage.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.keyboardUsage.map((shortcut) => (
                    <div key={shortcut.key} className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                      <div className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">{shortcut.key}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Uses: {shortcut.count}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Last used: {new Date(shortcut.lastUsed).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No keyboard shortcut data available</p>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Performance Metrics</h2>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => `${value}ms`} />
                    <Legend />
                    <Bar dataKey="min" fill="#82CA9D" />
                    <Bar dataKey="avg" fill="#FFBB28" />
                    <Bar dataKey="max" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No performance data available</p>
              )}
            </div>

            {/* Detailed Performance Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Detailed Metrics</h2>
              {performanceData.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-4 text-gray-900 dark:text-white">Metric</th>
                      <th className="text-left py-2 px-4 text-gray-900 dark:text-white">Avg (ms)</th>
                      <th className="text-left py-2 px-4 text-gray-900 dark:text-white">Min (ms)</th>
                      <th className="text-left py-2 px-4 text-gray-900 dark:text-white">Max (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((metric) => (
                      <tr key={metric.metric} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-2 px-4 text-gray-900 dark:text-white">{metric.metric}</td>
                        <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{metric.avg}</td>
                        <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{metric.min}</td>
                        <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{metric.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No performance data available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
