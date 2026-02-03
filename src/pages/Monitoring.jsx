import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function Monitoring() {
  const [metrics, setMetrics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch metrics snapshot
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/observability/metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch batch jobs
  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/batch', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  // Fetch recent traces
  const fetchTraces = async () => {
    try {
      const response = await fetch('/api/observability/traces?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch traces');
      const data = await response.json();
      setTraces(data);
    } catch (err) {
      console.error('Failed to fetch traces:', err);
    }
  };

  // Real-time metrics using SSE
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initial fetch
    fetchMetrics();
    fetchJobs();
    fetchTraces();
    setLoading(false);

    // Connect to SSE stream for real-time updates
    const eventSource = new EventSource(`/api/observability/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(data);
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Fallback to polling
      const interval = setInterval(() => {
        fetchMetrics();
        fetchJobs();
      }, 5000);
      return () => clearInterval(interval);
    };

    return () => eventSource.close();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Error Loading Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active':
      case 'processing': return 'bg-blue-500';
      case 'waiting':
      case 'queued': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Real-time system metrics and job tracking</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="w-3 h-3 animate-pulse" />
          Live
        </Badge>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.requests?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Success: {metrics?.requests?.success || 0} | Errors: {metrics?.requests?.error || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.latency?.avg ? `${metrics.latency.avg.toFixed(0)}ms` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              p95: {metrics?.latency?.p95 ? `${metrics.latency.p95.toFixed(0)}ms` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.uptime ? formatUptime(metrics.uptime) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Memory: {metrics?.system?.memoryUsage ? `${(metrics.system.memoryUsage / 1024 / 1024).toFixed(0)}MB` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'active' || j.status === 'processing').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {jobs.length} jobs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Batch Jobs</TabsTrigger>
          <TabsTrigger value="traces">Request Traces</TabsTrigger>
          <TabsTrigger value="routes">Route Analytics</TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Batch Jobs</CardTitle>
              <CardDescription>Real-time job processing status</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No jobs found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.slice(0, 10).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
                        <div className="flex-1">
                          <div className="font-medium">{job.type}</div>
                          <div className="text-sm text-muted-foreground">ID: {job.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant="outline">{job.status}</Badge>
                          {job.progress > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {job.progress}%
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(job.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traces Tab */}
        <TabsContent value="traces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Request Traces</CardTitle>
              <CardDescription>Distributed tracing for API requests</CardDescription>
            </CardHeader>
            <CardContent>
              {traces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No traces found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {traces.slice(0, 20).map((trace) => (
                    <div
                      key={trace.traceId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-2 h-2 rounded-full ${
                          trace.statusCode < 400 ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium font-mono text-sm">{trace.method} {trace.path}</div>
                          <div className="text-xs text-muted-foreground">Trace: {trace.traceId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={trace.statusCode < 400 ? 'default' : 'destructive'}>
                          {trace.statusCode}
                        </Badge>
                        <div className="text-sm font-medium">{formatDuration(trace.duration)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(trace.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Performance</CardTitle>
              <CardDescription>Request counts and latency by route</CardDescription>
            </CardHeader>
            <CardContent>
              {!metrics?.routes || Object.keys(metrics.routes).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No route data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(metrics.routes)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 15)
                    .map(([route, stats]) => (
                      <div
                        key={route}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                      >
                        <div className="flex-1">
                          <div className="font-medium font-mono text-sm">{route}</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.count} requests
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Avg: {stats.avg?.toFixed(0) || 0}ms
                            </div>
                            <div className="text-xs text-muted-foreground">
                              p95: {stats.p95?.toFixed(0) || 0}ms
                            </div>
                          </div>
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(100, (stats.avg / 1000) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
