import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as analytics from '@/utils/analytics';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsPanel() {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    eventsByType: {},
    sessionCount: 0,
    eventBatches: 0
  });
  const [activeTab, setActiveTab] = useState('events');
  const [_filters, _setFilters] = useState({
    eventType: 'all',
    timeRange: '24h',
    source: 'all'
  });

  useEffect(() => {
    // Initialize analytics
    analytics.configureAnalytics({
      endpoint: '/api/analytics',
      batchSize: 50,
      flushInterval: 30000
    });

    // Subscribe to analytics events
    const unsubscribe = analytics.onAnalyticsEvent('*', (event) => {
      setAnalyticsData(prev => {
        const updated = [
          {
            ...event,
            timestamp: new Date(event.timestamp).toLocaleTimeString(),
            date: new Date(event.timestamp).toLocaleDateString()
          },
          ...prev
        ].slice(0, 100); // Keep last 100 events
        return updated;
      });
    });

    // Update summary every 5 seconds
    const interval = setInterval(() => {
      const summary = analytics.getAnalyticsSummary();
      setSummary({
        totalEvents: analyticsData.length,
        eventsByType: analyticsData.reduce((acc, event) => ({
          ...acc,
          [event.eventType]: (acc[event.eventType] || 0) + 1
        }), {}),
        sessionCount: summary.activeSession ? 1 : 0,
        eventBatches: summary.queueSize
      });
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [analyticsData]);

  const handleTrackEvent = (eventType, data) => {
    analytics.trackEvent(eventType, data);
  };

  const handleTrackAction = (element, action) => {
    analytics.trackUserAction(action, element);
  };

  const handleFlush = () => {
    analytics.flushAnalytics();
    // Show toast notification
    const btn = event.target;
    const button = btn;
    if (button instanceof HTMLElement) {
      button.textContent = 'Flushed!';
      setTimeout(() => { button.textContent = 'Flush Now'; }, 2000);
    }
  };

  const getChartData = () => {
    const byType = {};
    analyticsData.forEach(event => {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1;
    });
    return Object.entries(byType).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };

  const getTimelineData = () => {
    const byTime = {};
    analyticsData.slice().reverse().forEach(event => {
      byTime[event.timestamp] = (byTime[event.timestamp] || 0) + 1;
    });
    return Object.entries(byTime).map(([time, count]) => ({
      time,
      events: count
    }));
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        📊 Analytics Dashboard
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">Total Events</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.totalEvents}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">Event Types</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Object.keys(summary.eventsByType).length}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">Sessions</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.sessionCount}
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">In Queue</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {summary.eventBatches}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {['events', 'chart', 'timeline'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === 'events' && (
        <div>
          <div className="mb-4 flex gap-2">
            <button
              onClick={handleFlush}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Flush Now
            </button>
            <button
              onClick={() => handleTrackEvent('page_view', { page: 'analytics' })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Track Page View
            </button>
            <button
              onClick={() => handleTrackAction('dashboard', 'click')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Track Action
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                    Event Type
                  </th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                    Data
                  </th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.slice(0, 20).map((event, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-2 font-medium text-blue-600 dark:text-blue-400">
                      {event.eventType}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      {JSON.stringify(event.data).substring(0, 40)}...
                    </td>
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-500">
                      {event.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analyticsData.length === 0 && (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                No events tracked yet
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chart' && (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getChartData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getTimelineData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="events" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
