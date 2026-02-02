/**
 * QuantumMetricsDashboard - Real-time quantum metrics visualization
 * Displays security, stability, and criticality metrics from quantum modules
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Activity,
  AlertCircle,
  Gauge,
} from 'lucide-react';
import { tunneling } from '@/lib/quantumTunneling';
import { zeno } from '@/lib/quantumZeno';
import { renormalization } from '@/lib/quantumRenormalization';

const STATUS_ICONS = {
  EXCELLENT: <CheckCircle className="w-4 h-4 text-green-500" />,
  STABLE: <CheckCircle className="w-4 h-4 text-blue-500" />,
  CAUTION: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  WARNING: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  CRITICAL: <AlertTriangle className="w-4 h-4 text-red-500" />,
};

export function QuantumMetricsDashboard() {
  const [tunnelMetrics, setTunnelMetrics] = useState(null);
  const [zenoMetrics, setZenoMetrics] = useState(null);
  const [normMetrics, setNormMetrics] = useState(null);

  // Simulate metric collection every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Get latest metrics from each quantum module
      const latest = tunneling.getLatest();
      if (latest) setTunnelMetrics(latest);

      const zenoLatest = zeno.getLatest();
      if (zenoLatest) setZenoMetrics(zenoLatest);

      const normLatest = renormalization.getLatest();
      if (normLatest) setNormMetrics(normLatest);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Security Tunneling Card */}
        <SecurityTunnelingCard metrics={tunnelMetrics} />

        {/* Code Stability Card */}
        <CodeStabilityCard metrics={zenoMetrics} />

        {/* System Criticality Card */}
        <CriticalityCard metrics={normMetrics} />
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TunnelingTrendChart />
        <StabilityTrendChart />
      </div>

      {/* System Health Overview */}
      <SystemHealthOverview
        tunneling={tunnelMetrics}
        zeno={zenoMetrics}
        renormalization={normMetrics}
      />
    </div>
  );
}

function SecurityTunnelingCard({ metrics }) {
  if (!metrics) {
    return <div className="h-40 bg-slate-900 rounded-lg animate-pulse" />;
  }

  const riskPercentage = (metrics.breachProbability * 100).toFixed(2);
  const riskColor = {
    LOW: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400',
    CRITICAL: 'text-red-400',
  }[metrics.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0 }}
    >
      <Card className="bg-slate-900 border-slate-700 hover:border-slate-600 transition">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="w-4 h-4 text-blue-400" />
            Security Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Breach Probability</div>
            <div className={`text-2xl font-bold ${riskColor}`}>
              {riskPercentage}%
            </div>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Risk Level:</span>
            <Badge
              className={
                metrics.riskLevel === 'LOW'
                  ? 'bg-green-500/20 text-green-400'
                  : metrics.riskLevel === 'MEDIUM'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : metrics.riskLevel === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-red-500/20 text-red-400'
              }
            >
              {metrics.riskLevel}
            </Badge>
          </div>

          <div className="text-xs text-slate-300 bg-slate-800 p-2 rounded">
            {metrics.recommendation}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CodeStabilityCard({ metrics }) {
  if (!metrics) {
    return <div className="h-40 bg-slate-900 rounded-lg animate-pulse" />;
  }

  const stabilityPercentage = (metrics.stability * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-slate-900 border-slate-700 hover:border-slate-600 transition">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="w-4 h-4 text-purple-400" />
            Code Stability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Integrity Level</div>
            <div className="text-2xl font-bold text-purple-400">
              {stabilityPercentage}%
            </div>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Status:</span>
            <div className="flex items-center gap-1">
              {STATUS_ICONS[metrics.status]}
              <span>{metrics.status}</span>
            </div>
          </div>

          <div className="text-xs">
            <div className="text-slate-400 mb-1">
              Zeno Effect: {metrics.isFrozen ? '✅ Active' : '❌ Inactive'}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${metrics.freezeDepth * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CriticalityCard({ metrics }) {
  if (!metrics) {
    return <div className="h-40 bg-slate-900 rounded-lg animate-pulse" />;
  }

  const criticalityPercentage = (metrics.criticality * 100).toFixed(1);
  const isHealthy = metrics.systemHealth.includes('🟢');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-slate-900 border-slate-700 hover:border-slate-600 transition">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="w-4 h-4 text-orange-400" />
            System Criticality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Criticality Level</div>
            <div className={`text-2xl font-bold ${isHealthy ? 'text-green-400' : 'text-red-400'}`}>
              {criticalityPercentage}%
            </div>
          </div>

          <div className="text-xs">
            <span className="text-slate-400 block mb-1">Health:</span>
            <span className="font-semibold">{metrics.systemHealth}</span>
          </div>

          <div className="text-xs text-slate-300">
            Time to failure:{' '}
            <span className="font-bold text-orange-400">
              {metrics.timeToFailure.toFixed(1)}s
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TunnelingTrendChart() {
  const history = tunneling.getHistory();
  const chartData = history.slice(-20).map((item, idx) => ({
    index: idx,
    probability: (item.breachProbability * 100).toFixed(2),
  }));

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Security Breach Probability Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="index" stroke="rgba(148,163,184,0.5)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(148,163,184,0.5)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,23,42,0.9)',
                  border: '1px solid rgba(148,163,184,0.2)',
                }}
              />
              <Line
                type="monotone"
                dataKey="probability"
                stroke="#3b82f6"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400">
            No data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StabilityTrendChart() {
  const history = zeno.getHistory();
  const chartData = history.slice(-20).map((item, idx) => ({
    index: idx,
    stability: (item.stability * 100).toFixed(1),
  }));

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-purple-400" />
          Code Stability Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="index" stroke="rgba(148,163,184,0.5)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(148,163,184,0.5)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,23,42,0.9)',
                  border: '1px solid rgba(148,163,184,0.2)',
                }}
              />
              <Line
                type="monotone"
                dataKey="stability"
                stroke="#a855f7"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400">
            No data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SystemHealthOverview({ tunneling, zeno, renormalization }) {
  const alerts = [];

  if (tunneling && tunneling.riskLevel === 'CRITICAL') {
    alerts.push({
      type: 'security',
      message: 'Security risk level is CRITICAL',
      icon: <Shield className="w-4 h-4" />,
    });
  }

  if (zeno && zeno.status === 'CRITICAL') {
    alerts.push({
      type: 'stability',
      message: 'Code stability is CRITICAL',
      icon: <Zap className="w-4 h-4" />,
    });
  }

  if (renormalization && renormalization.criticality > 0.7) {
    alerts.push({
      type: 'system',
      message: 'System approaching critical phase transition',
      icon: <Gauge className="w-4 h-4" />,
    });
  }

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          System Health Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length > 0 ? (
          <AnimatePresence>
            {alerts.map((alert, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Alert className="bg-red-500/10 border-red-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">{alert.icon}</span>
                    <AlertDescription className="text-sm text-red-200">
                      {alert.message}
                    </AlertDescription>
                  </div>
                </Alert>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-4">
            <div className="text-green-400 text-lg font-semibold mb-2">✅ All Systems Healthy</div>
            <div className="text-slate-400 text-sm">No critical alerts detected</div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Security</div>
            <div className="text-sm font-semibold">
              {tunneling ? (tunneling.breachProbability < 0.01 ? '✅ Secure' : '⚠️ At Risk') : '—'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Stability</div>
            <div className="text-sm font-semibold">
              {zeno ? (zeno.isFrozen ? '✅ Frozen' : '⚠️ Degrading') : '—'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Criticality</div>
            <div className="text-sm font-semibold">
              {renormalization ? (renormalization.criticality < 0.5 ? '✅ Stable' : '⚠️ Critical') : '—'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
