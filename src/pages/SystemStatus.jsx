import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, TrendingUp, Clock, Database, Zap, Server } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { runHealthChecks, getSystemStatus } from '@/utils/healthCheck';
import { getWebVitals } from '@/utils/performance';
import errorTracker from '@/utils/errorTracking';
import env from '@/utils/env';
import { motion } from 'framer-motion';

export default function SystemStatus() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [vitals, setVitals] = useState(null);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    loadSystemStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    const status = getSystemStatus();
    setHealthStatus(status);
    
    const webVitals = getWebVitals();
    setVitals(webVitals);
    
    const recentErrors = errorTracker.getRecentErrors(5);
    setErrors(recentErrors);
  };

  const handleRefresh = async () => {
    setIsChecking(true);
    try {
      const results = await runHealthChecks();
      setHealthStatus(results);
      
      const webVitals = getWebVitals();
      setVitals(webVitals);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const getVitalStatus = (metric, value) => {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      tti: { good: 3800, poor: 7300 },
      tbt: { good: 200, poor: 600 },
    };

    const threshold = thresholds[metric];
    if (!threshold || !value) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-600" />
            System Status
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor application health and performance metrics
          </p>
        </div>
        
        <Button
          onClick={handleRefresh}
          disabled={isChecking}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      {healthStatus && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(healthStatus.status)}
                  System Health
                </CardTitle>
                <CardDescription>
                  Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(healthStatus.status)}>
                {healthStatus.status?.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600">
                  {healthStatus.summary?.healthy || 0}
                </div>
                <div className="text-sm text-green-600 mt-1">Healthy</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">
                  {healthStatus.summary?.degraded || 0}
                </div>
                <div className="text-sm text-yellow-600 mt-1">Degraded</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-3xl font-bold text-red-600">
                  {healthStatus.summary?.unhealthy || 0}
                </div>
                <div className="text-sm text-red-600 mt-1">Unhealthy</div>
              </div>
            </div>

            {/* Individual Checks */}
            <div className="space-y-3">
              {healthStatus.checks && Object.entries(healthStatus.checks).map(([name, check]) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="font-medium text-gray-900 capitalize">{name}</div>
                      <div className="text-sm text-gray-600">{check.message}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {check.status}
                    </Badge>
                    {check.duration && (
                      <div className="text-xs text-gray-500">
                        {formatDuration(check.duration)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Web Vitals */}
      {vitals && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Web Vitals
            </CardTitle>
            <CardDescription>Core Web Vitals performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { key: 'fcp', label: 'First Contentful Paint', icon: Zap },
                { key: 'lcp', label: 'Largest Contentful Paint', icon: Server },
                { key: 'fid', label: 'First Input Delay', icon: Clock },
                { key: 'tti', label: 'Time to Interactive', icon: Activity },
                { key: 'tbt', label: 'Total Blocking Time', icon: Database },
              ].map(({ key, label, icon: Icon }) => {
                const value = vitals[key];
                const status = getVitalStatus(key, value);
                const colors = {
                  good: 'bg-green-50 border-green-200 text-green-700',
                  'needs-improvement': 'bg-yellow-50 border-yellow-200 text-yellow-700',
                  poor: 'bg-red-50 border-red-200 text-red-700',
                  unknown: 'bg-gray-50 border-gray-200 text-gray-700',
                };
                
                return (
                  <div key={key} className={`p-4 rounded-lg border ${colors[status]}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" />
                      <div className="text-xs font-medium">{label}</div>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatDuration(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Errors */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Recent Errors ({errors.length})
            </CardTitle>
            <CardDescription>Latest errors captured by the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errors.map((error, index) => (
                <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-red-900">{error.message}</div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </Badge>
                  </div>
                  {error.stack && (
                    <pre className="text-xs text-red-700 bg-red-100 p-2 rounded mt-2 overflow-x-auto">
                      {error.stack.substring(0, 200)}...
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Environment</div>
              <div className="font-medium">{env.app.env}</div>
            </div>
            <div>
              <div className="text-gray-600">Mode</div>
              <div className="font-medium">{env.app.isDevelopment ? 'Development' : 'Production'}</div>
            </div>
            <div>
              <div className="text-gray-600">API URL</div>
              <div className="font-medium text-xs truncate">{env.base44.apiUrl}</div>
            </div>
            <div>
              <div className="text-gray-600">Build Version</div>
              <div className="font-medium">{import.meta.env.VITE_APP_VERSION || '1.0.0'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
