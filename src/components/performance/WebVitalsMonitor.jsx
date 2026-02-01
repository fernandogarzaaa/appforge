/**
 * Web Vitals Performance Monitor
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyticsService } from '@/services/analytics';

// Web Vitals thresholds (Google's recommended values)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

export function WebVitalsMonitor() {
  const [vitals, setVitals] = useState({
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTFB: null,
  });

  const [performanceScore, setPerformanceScore] = useState(0);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Dynamically import web-vitals
    import('web-vitals').then(({ onLCP, onFID, onCLS, onFCP, onTTFB }) => {
      // Largest Contentful Paint
      onLCP((metric) => {
        setVitals(prev => ({ ...prev, LCP: metric.value }));
        trackMetric('LCP', metric.value, THRESHOLDS.LCP);
      });

      // First Input Delay
      onFID((metric) => {
        setVitals(prev => ({ ...prev, FID: metric.value }));
        trackMetric('FID', metric.value, THRESHOLDS.FID);
      });

      // Cumulative Layout Shift
      onCLS((metric) => {
        setVitals(prev => ({ ...prev, CLS: metric.value }));
        trackMetric('CLS', metric.value, THRESHOLDS.CLS);
      });

      // First Contentful Paint
      onFCP((metric) => {
        setVitals(prev => ({ ...prev, FCP: metric.value }));
        trackMetric('FCP', metric.value, THRESHOLDS.FCP);
      });

      // Time to First Byte
      onTTFB((metric) => {
        setVitals(prev => ({ ...prev, TTFB: metric.value }));
        trackMetric('TTFB', metric.value, THRESHOLDS.TTFB);
      });
    });
  }, []);

  // Track metrics and generate alerts
  const trackMetric = (name, value, threshold) => {
    // Send to analytics
    analyticsService.recordPerformanceMetric(name.toLowerCase(), value);

    // Check if metric exceeds threshold
    if (value > threshold.poor) {
      const alert = {
        id: Date.now(),
        metric: name,
        value,
        severity: 'error',
        message: `${name} is poor (${formatValue(name, value)}). Target: ${formatValue(name, threshold.good)}`,
      };
      setAlerts(prev => [...prev, alert].slice(-5)); // Keep last 5 alerts
    } else if (value > threshold.good) {
      const alert = {
        id: Date.now(),
        metric: name,
        value,
        severity: 'warning',
        message: `${name} needs improvement (${formatValue(name, value)}). Target: ${formatValue(name, threshold.good)}`,
      };
      setAlerts(prev => [...prev, alert].slice(-5));
    }
  };

  // Calculate overall performance score (0-100)
  useEffect(() => {
    const scores = Object.entries(vitals)
      .filter(([_, value]) => value !== null)
      .map(([name, value]) => {
        const threshold = THRESHOLDS[name];
        if (value <= threshold.good) return 100;
        if (value >= threshold.poor) return 0;
        // Linear interpolation between good and poor
        return 100 - ((value - threshold.good) / (threshold.poor - threshold.good)) * 100;
      });

    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      setPerformanceScore(Math.round(avgScore));
    }
  }, [vitals]);

  const formatValue = (metric, value) => {
    if (metric === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  const getStatusColor = (metric, value) => {
    if (value === null) return 'gray';
    const threshold = THRESHOLDS[metric];
    if (value <= threshold.good) return 'green';
    if (value <= threshold.poor) return 'yellow';
    return 'red';
  };

  const getStatusIcon = (color) => {
    switch (color) {
      case 'green':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'yellow':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'red':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Performance Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-600" />
            Performance Score
          </h2>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - performanceScore / 100)}`}
                className={`transition-all duration-1000 ${
                  performanceScore >= 90
                    ? 'text-green-600'
                    : performanceScore >= 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {performanceScore}
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
          {performanceScore >= 90 && 'Excellent performance! 🎉'}
          {performanceScore >= 50 && performanceScore < 90 && 'Good performance, room for improvement'}
          {performanceScore < 50 && 'Performance needs optimization'}
        </p>
      </motion.div>

      {/* Individual Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(vitals).map(([metric, value]) => {
          const color = getStatusColor(metric, value);
          const threshold = THRESHOLDS[metric];

          return (
            <motion.div
              key={metric}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(color)}
                  <h3 className="font-semibold text-gray-900 dark:text-white">{metric}</h3>
                </div>
              </div>

              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {value !== null ? formatValue(metric, value) : '-'}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Target: {formatValue(metric, threshold.good)}
              </div>

              {/* Progress bar */}
              {value !== null && (
                <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      color === 'green'
                        ? 'bg-green-600'
                        : color === 'yellow'
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                    }`}
                    style={{
                      width: `${Math.min(100, (threshold.poor / value) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Performance Alerts
          </h3>

          <div className="space-y-2">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <p className={`text-sm font-medium ${
                  alert.severity === 'error'
                    ? 'text-red-900 dark:text-red-200'
                    : 'text-yellow-900 dark:text-yellow-200'
                }`}>
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Explanation */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          About Core Web Vitals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-white">LCP:</strong> Measures loading performance. Should occur within 2.5s.
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">FID:</strong> Measures interactivity. Should be less than 100ms.
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">CLS:</strong> Measures visual stability. Should be less than 0.1.
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">FCP:</strong> Time until first content is rendered.
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">TTFB:</strong> Time until server responds to the first request.
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebVitalsMonitor;
