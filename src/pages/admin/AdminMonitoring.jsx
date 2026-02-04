import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  Layers,
  Loader2,
  Network,
  RefreshCw,
  Server,
  ShieldAlert,
  Sliders,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUS_STYLES = {
  healthy: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
  unknown: 'bg-slate-100 text-slate-700 border-slate-200',
};

const formatNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatMs = (value) => {
  const num = formatNumber(value, null);
  if (num === null) return 'N/A';
  return `${num.toFixed(0)}ms`;
};

const formatPercent = (value) => `${formatNumber(value).toFixed(1)}%`;

const formatTimeLabel = (date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const wsUrl = (path) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}${path}`;
};

const normalizeStatus = (status) => {
  if (!status) return 'unknown';
  const value = status.toLowerCase();
  if (['healthy', 'ok', 'up', 'green'].includes(value)) return 'healthy';
  if (['warning', 'degraded', 'amber', 'yellow'].includes(value)) return 'warning';
  if (['critical', 'down', 'red', 'error'].includes(value)) return 'critical';
  return 'unknown';
};

const trimSeries = (series, max = 60) => series.slice(Math.max(series.length - max, 0));

export default function AdminMonitoring() {
  const [mode, setMode] = useState('advanced');
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [errors, setErrors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [logPage, setLogPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedError, setSelectedError] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    cpu: 80,
    memory: 85,
    errorRate: 2,
    latencyP99: 1200,
    queueLength: 150,
    dbQuery: 300,
    email: true,
    slack: false,
  });

  const [series, setSeries] = useState({
    cpu: [],
    memory: [],
    requestRate: [],
    dbQuery: [],
    queue: [],
    errorRate: [],
    cacheHit: [],
    p50: [],
    p90: [],
    p99: [],
  });

  const metricsSocketRef = useRef(null);
  const errorsSocketRef = useRef(null);
  const pollingRef = useRef(null);

  const token = useMemo(
    () => localStorage.getItem('token') || localStorage.getItem('authToken'),
    []
  );

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed: ${response.status}`);
    }

    return response.json();
  };

  const fetchAll = async () => {
    try {
      const [metricsData, healthData, errorsData, logsData, sessionsData] = await Promise.all([
        fetchJson('/api/admin/metrics'),
        fetchJson('/api/admin/health'),
        fetchJson('/api/admin/errors'),
        fetchJson(`/api/admin/logs?page=${logPage}&limit=25`),
        fetchJson('/api/admin/sessions'),
      ]);

      setMetrics(metricsData);
      setHealth(healthData);
      setErrors(errorsData?.errors || errorsData || []);
      setLogs(logsData?.logs || logsData || []);
      setSessions(sessionsData?.sessions || sessionsData || []);
      setAlerts(metricsData?.alerts || healthData?.alerts || []);
      setAlertHistory(healthData?.alertHistory || []);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message || 'Failed to load monitoring data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [logPage]);

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchAll();
    }, 5000);

    return () => clearInterval(pollingRef.current);
  }, [logPage]);

  useEffect(() => {
    const now = new Date();
    const timeLabel = formatTimeLabel(now);

    const cpuValue = formatNumber(metrics?.cpu?.usage ?? metrics?.system?.cpu ?? metrics?.cpuUsage ?? 0);
    const memoryValue = formatNumber(metrics?.memory?.usage ?? metrics?.system?.memory ?? metrics?.memoryUsage ?? 0);
    const requestRateValue = formatNumber(
      metrics?.requests?.rate ?? metrics?.requestRate ?? metrics?.requestsPerSecond ?? 0
    );
    const dbQueryValue = formatNumber(
      metrics?.database?.queryTimeMs ?? metrics?.db?.queryTimeMs ?? metrics?.databaseQueryTime ?? 0
    );
    const queueValue = formatNumber(
      metrics?.queues?.length ?? metrics?.queueLength ?? metrics?.queue?.length ?? 0
    );
    const errorRateValue = formatNumber(metrics?.errors?.rate ?? metrics?.errorRate ?? 0);
    const cacheHitValue = formatNumber(metrics?.cache?.hitRate ?? metrics?.cacheHitRate ?? 0);
    const p50Value = formatNumber(metrics?.responseTime?.p50 ?? metrics?.latency?.p50 ?? 0);
    const p90Value = formatNumber(metrics?.responseTime?.p90 ?? metrics?.latency?.p90 ?? 0);
    const p99Value = formatNumber(metrics?.responseTime?.p99 ?? metrics?.latency?.p99 ?? 0);

    setSeries((prev) => ({
      cpu: trimSeries([...prev.cpu, { time: timeLabel, value: cpuValue }]),
      memory: trimSeries([...prev.memory, { time: timeLabel, value: memoryValue }]),
      requestRate: trimSeries([...prev.requestRate, { time: timeLabel, value: requestRateValue }]),
      dbQuery: trimSeries([...prev.dbQuery, { time: timeLabel, value: dbQueryValue }]),
      queue: trimSeries([...prev.queue, { time: timeLabel, value: queueValue }]),
      errorRate: trimSeries([...prev.errorRate, { time: timeLabel, value: errorRateValue }]),
      cacheHit: trimSeries([...prev.cacheHit, { time: timeLabel, value: cacheHitValue }]),
      p50: trimSeries([...prev.p50, { time: timeLabel, value: p50Value }]),
      p90: trimSeries([...prev.p90, { time: timeLabel, value: p90Value }]),
      p99: trimSeries([...prev.p99, { time: timeLabel, value: p99Value }]),
    }));
  }, [metrics]);

  useEffect(() => {
    const metricsSocket = new WebSocket(wsUrl('/ws/admin/metrics'));
    metricsSocketRef.current = metricsSocket;

    metricsSocket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.metrics) {
          setMetrics(payload.metrics);
        } else if (payload?.health) {
          setHealth(payload.health);
        } else {
          setMetrics(payload);
        }

        if (payload?.errors?.length) {
          setErrors((prev) => [...payload.errors, ...prev].slice(0, 200));
        }
      } catch (err) {
        console.error('Failed to parse metrics payload', err);
      }
    };

    metricsSocket.onerror = () => {
      metricsSocket.close();
    };

    const errorsSocket = new WebSocket(wsUrl('/ws/admin/metrics?stream=errors'));
    errorsSocketRef.current = errorsSocket;

    errorsSocket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.error) {
          setErrors((prev) => [payload.error, ...prev].slice(0, 200));
        }
        if (payload?.errors?.length) {
          setErrors((prev) => [...payload.errors, ...prev].slice(0, 200));
        }
      } catch (err) {
        console.error('Failed to parse error payload', err);
      }
    };

    errorsSocket.onerror = () => {
      errorsSocket.close();
    };

    return () => {
      metricsSocket.close();
      errorsSocket.close();
    };
  }, []);

  const filteredErrors = useMemo(() => {
    return errors.filter((error) => {
      const severity = (error.severity || error.level || 'error').toLowerCase();
      const matchesSeverity = severityFilter === 'all' || severity === severityFilter;
      const message = `${error.message || ''} ${error.context || ''}`.toLowerCase();
      const matchesQuery = message.includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesQuery;
    });
  }, [errors, severityFilter, searchQuery]);

  const endpointLatencyData = useMemo(() => {
    const endpoints = metrics?.endpoints || metrics?.endpointLatency || [];
    return endpoints.map((endpoint) => ({
      name: endpoint.name || endpoint.path || endpoint.endpoint || 'unknown',
      p95: formatNumber(endpoint.p95 ?? endpoint.latencyP95 ?? endpoint.latency ?? 0),
      avg: formatNumber(endpoint.avg ?? endpoint.mean ?? 0),
    }));
  }, [metrics]);

  const slowQueries = useMemo(() => {
    return metrics?.database?.slowQueries || metrics?.db?.slowQueries || [];
  }, [metrics]);

  const healthStatus = useMemo(() => {
    const normalize = (value) => normalizeStatus(value?.status || value);
    return {
      database: normalize(health?.database),
      redis: normalize(health?.redis),
      wasm: normalize(health?.wasm),
      api: normalize(health?.api),
      integrations: normalize(health?.integrations),
    };
  }, [health]);

  const handleForceLogout = async (sessionId) => {
    try {
      await fetchJson(`/api/admin/sessions/${sessionId}/logout`, { method: 'POST' });
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    } catch (err) {
      console.error('Failed to force logout', err);
    }
  };

  const handleAlertConfigChange = (field, value) => {
    setAlertConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAcknowledgeAlert = (alertId) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert)));
  };

  const handleSnoozeAlert = (alertId) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: 'snoozed' } : alert)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Monitoring Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">{loadError}</p>
            <Button onClick={fetchAll} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Monitoring</h1>
          <p className="text-sm text-slate-500">Real-time infrastructure metrics, error streaming, and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="w-3 h-3 animate-pulse" />
            Live updates every 5s
          </Badge>
          <div className="flex items-center gap-2">
            <Label htmlFor="mode-switch" className="text-sm text-slate-600">Beginner</Label>
            <Switch
              id="mode-switch"
              checked={mode === 'advanced'}
              onCheckedChange={(checked) => setMode(checked ? 'advanced' : 'beginner')}
            />
            <Label htmlFor="mode-switch" className="text-sm text-slate-600">Advanced</Label>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { key: 'database', label: 'Database', icon: Database },
          { key: 'redis', label: 'Redis', icon: Layers },
          { key: 'wasm', label: 'WASM Modules', icon: Zap },
          { key: 'api', label: 'API Endpoints', icon: Network },
          { key: 'integrations', label: 'Integrations', icon: Server },
        ].map((item) => {
          const status = healthStatus[item.key];
          const Icon = item.icon;
          return (
            <Card key={item.key} className="border">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Icon className="w-4 h-4 text-slate-500" />
                    {item.label}
                  </div>
                  <Badge variant="outline" className={STATUS_STYLES[status]}>
                    {status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {health?.[item.key]?.message || health?.[item.key]?.details || 'Status monitored in real-time.'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mode === 'advanced' && (
        <div className="space-y-6">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  CPU Usage (Last 1h)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series.cpu}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="#cffafe" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Current Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">CPU Usage</p>
                  <p className="text-lg font-semibold">{formatPercent(metrics?.cpu?.usage ?? metrics?.cpuUsage ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Memory Usage</p>
                  <p className="text-lg font-semibold">{formatPercent(metrics?.memory?.usage ?? metrics?.memoryUsage ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Request Rate</p>
                  <p className="text-lg font-semibold">{formatNumber(metrics?.requests?.rate ?? metrics?.requestRate ?? 0)} req/s</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Active Connections</p>
                  <p className="text-lg font-semibold">{formatNumber(metrics?.connections?.active ?? metrics?.activeConnections ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Queue Length</p>
                  <p className="text-lg font-semibold">{formatNumber(metrics?.queues?.length ?? metrics?.queueLength ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">DB Query Time</p>
                  <p className="text-lg font-semibold">{formatMs(metrics?.database?.queryTimeMs ?? metrics?.db?.queryTimeMs ?? 0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Memory Usage Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series.memory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Request Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series.requestRate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Database Query Time</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series.dbQuery}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Error Logs Viewer */}
          <Card>
            <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Error Logs Viewer
                </CardTitle>
                <p className="text-sm text-slate-500">Live error stream with severity filtering</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search message"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-[220px]"
                />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series.errorRate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <ScrollArea className="h-64 border rounded-lg">
                  <div className="divide-y">
                    {filteredErrors.length === 0 && (
                      <div className="p-4 text-sm text-slate-500">No errors match the current filters.</div>
                    )}
                    {filteredErrors.map((error) => (
                      <button
                        key={error.id || error.timestamp || error.message}
                        type="button"
                        onClick={() => setSelectedError(error)}
                        className="w-full text-left p-4 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                error.severity === 'warning'
                                  ? STATUS_STYLES.warning
                                  : error.severity === 'info'
                                  ? STATUS_STYLES.healthy
                                  : STATUS_STYLES.critical
                              }
                            >
                              {error.severity || 'error'}
                            </Badge>
                            <span className="text-sm font-medium text-slate-800">
                              {error.message || 'Unknown error'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {error.timestamp ? new Date(error.timestamp).toLocaleTimeString() : 'just now'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {error.context || error.service || 'No additional context'}
                        </p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="space-y-3">
                <Card className="border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">Stack Trace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedError ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Message</p>
                          <p className="text-sm font-medium text-slate-800">{selectedError.message}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Trace</p>
                          <pre className="text-xs whitespace-pre-wrap text-slate-600 bg-slate-50 p-3 rounded-md">
                            {selectedError.stack || 'No stack trace available.'}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Select an error to view the stack trace.</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">Error Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Current error rate</span>
                      <span className="font-semibold text-red-600">
                        {formatNumber(metrics?.errors?.rate ?? metrics?.errorRate ?? 0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Last incident</span>
                      <span className="text-slate-700">
                        {errors[0]?.timestamp ? new Date(errors[0].timestamp).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Performance Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-600" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">Response Time Percentiles</CardTitle>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={series.p99.map((point, index) => ({
                        time: point.time,
                        p50: series.p50[index]?.value ?? 0,
                        p90: series.p90[index]?.value ?? 0,
                        p99: point.value,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="p50" stroke="#22c55e" dot={false} />
                        <Line type="monotone" dataKey="p90" stroke="#f59e0b" dot={false} />
                        <Line type="monotone" dataKey="p99" stroke="#ef4444" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">Cache Hit Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={series.cacheHit}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#bae6fd" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">Endpoint Latency Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={endpointLatencyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avg" fill="#6366f1" name="Avg" />
                        <Bar dataKey="p95" fill="#f97316" name="p95" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">Slow Query Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {slowQueries.length === 0 && (
                          <p className="text-sm text-slate-500">No slow queries reported.</p>
                        )}
                        {slowQueries.map((query) => (
                          <div key={query.id || query.query} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-800">{query.operation || 'Query'}</span>
                              <Badge variant="outline" className={STATUS_STYLES.warning}>
                                {formatMs(query.durationMs || query.duration)}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 break-words">
                              {query.query || query.statement || 'Query details unavailable'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-600" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b text-slate-500">
                      <th className="py-2">User</th>
                      <th className="py-2">IP Address</th>
                      <th className="py-2">User Agent</th>
                      <th className="py-2">Last Activity</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500">
                          No active sessions found.
                        </td>
                      </tr>
                    )}
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-slate-800">{session.user || session.userEmail || 'Unknown'}</td>
                        <td className="py-3 text-slate-600">{session.ip || session.ipAddress || 'N/A'}</td>
                        <td className="py-3 text-slate-600 truncate max-w-[240px]">{session.userAgent || 'N/A'}</td>
                        <td className="py-3 text-slate-600">
                          {session.lastActivity ? new Date(session.lastActivity).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleForceLogout(session.id)}
                          >
                            Force logout
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="config" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="config">Thresholds</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="history">Alert History</TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'cpu', label: 'CPU Usage (%)' },
                      { key: 'memory', label: 'Memory Usage (%)' },
                      { key: 'errorRate', label: 'Error Rate (%)' },
                      { key: 'latencyP99', label: 'Latency p99 (ms)' },
                      { key: 'queueLength', label: 'Queue Length' },
                      { key: 'dbQuery', label: 'DB Query Time (ms)' },
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label className="text-sm text-slate-600">{field.label}</Label>
                        <Input
                          type="number"
                          value={alertConfig[field.key]}
                          onChange={(event) => handleAlertConfigChange(field.key, Number(event.target.value))}
                        />
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4">
                    <Sliders className="w-4 h-4 mr-2" />
                    Save thresholds
                  </Button>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border shadow-none">
                      <CardHeader>
                        <CardTitle className="text-sm">Channels</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Email notifications</p>
                            <p className="text-xs text-slate-500">alerts@appforge.dev</p>
                          </div>
                          <Switch
                            checked={alertConfig.email}
                            onCheckedChange={(checked) => handleAlertConfigChange('email', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Slack notifications</p>
                            <p className="text-xs text-slate-500">#ops-alerts</p>
                          </div>
                          <Switch
                            checked={alertConfig.slack}
                            onCheckedChange={(checked) => handleAlertConfigChange('slack', checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border shadow-none">
                      <CardHeader>
                        <CardTitle className="text-sm">Active Alerts</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {alerts.length === 0 && (
                          <p className="text-sm text-slate-500">No active alerts.</p>
                        )}
                        {alerts.map((alert) => (
                          <div key={alert.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-800">{alert.title || 'Alert'}</span>
                              <Badge variant="outline" className={STATUS_STYLES[normalizeStatus(alert.severity || alert.status)]}>
                                {alert.severity || alert.status || 'warning'}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">{alert.message || 'No description available.'}</p>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                                Acknowledge
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleSnoozeAlert(alert.id)}>
                                Snooze
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="history">
                  <ScrollArea className="h-64 border rounded-lg">
                    <div className="divide-y">
                      {alertHistory.length === 0 && (
                        <div className="p-4 text-sm text-slate-500">No alert history available.</div>
                      )}
                      {alertHistory.map((alert) => (
                        <div key={alert.id || alert.timestamp} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{alert.title || 'Alert'}</p>
                              <p className="text-xs text-slate-500">{alert.message}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className={STATUS_STYLES[normalizeStatus(alert.severity || alert.status)]}>
                                {alert.severity || alert.status}
                              </Badge>
                              <p className="text-xs text-slate-400 mt-1">
                                {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Logs Viewer */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-slate-600" />
                System Logs
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-4 h-4" />
                Page {logPage}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 border rounded-lg">
                <div className="divide-y">
                  {logs.length === 0 && (
                    <div className="p-4 text-sm text-slate-500">No logs available.</div>
                  )}
                  {logs.map((log) => (
                    <div key={log.id || log.timestamp} className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">{log.message || 'Log entry'}</p>
                        <Badge variant="outline" className={STATUS_STYLES[normalizeStatus(log.level || log.severity || 'unknown')]}>
                          {log.level || log.severity || 'info'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogPage((prev) => Math.max(prev - 1, 1))}
                  disabled={logPage === 1}
                >
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setLogPage((prev) => prev + 1)}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {mode === 'beginner' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-500" />
              Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">System status</p>
              <p className="text-2xl font-semibold text-slate-900">
                {health?.summary || 'All systems monitored'}
              </p>
              <p className="text-sm text-slate-500">
                Last update: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(healthStatus).map(([key, status]) => (
                <div key={key} className="p-3 border rounded-lg">
                  <p className="text-xs text-slate-500 capitalize">{key}</p>
                  <Badge variant="outline" className={STATUS_STYLES[status]}>
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
