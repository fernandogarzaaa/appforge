import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SystemHealthDashboard() {
  const { data: healthMetrics } = useQuery({
    queryKey: ['system-health-metrics'],
    queryFn: () => base44.entities.SystemHealthMetric.list('-timestamp', 100)
  });

  const { data: performanceMetrics } = useQuery({
    queryKey: ['model-performance-metrics'],
    queryFn: () => base44.entities.ModelPerformanceMetric.list('-timestamp', 100)
  });

  // Process metrics for charts
  const alertVolumeData = healthMetrics?.slice().reverse().map(m => ({
    timestamp: new Date(m.timestamp).toLocaleDateString(),
    alerts: m.alert_count || 0
  })) || [];

  const resourceData = healthMetrics?.slice().reverse().map(m => ({
    timestamp: new Date(m.timestamp).toLocaleDateString(),
    cpu: m.cpu_usage || 0,
    memory: m.memory_usage || 0
  })) || [];

  const performanceData = performanceMetrics?.slice().reverse().map(m => ({
    timestamp: new Date(m.timestamp).toLocaleDateString(),
    accuracy: m.anomaly_detection_accuracy || 0,
    precision: m.precision_score || 0,
    recall: m.recall_score || 0
  })) || [];

  const integrationData = healthMetrics?.flatMap(m => m.failed_integrations || []) || [];
  const integrationSuccess = healthMetrics?.[healthMetrics.length - 1]?.integration_success_rate || 0;

  const latestHealth = healthMetrics?.[0];
  const latestPerformance = performanceMetrics?.[0];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Health Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Last updated: {latestHealth?.timestamp ? new Date(latestHealth.timestamp).toLocaleTimeString() : 'N/A'}
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Alert Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestHealth?.alert_count || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              Trend: <span className="capitalize">{latestHealth?.alert_trend || 'stable'}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(latestHealth?.system_uptime_percent || 0).toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {latestHealth?.downtime_incidents?.length || 0} incidents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Integration Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationSuccess.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {integrationData.length} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Detection Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(latestPerformance?.anomaly_detection_accuracy || 0).toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">
              Based on {latestPerformance?.user_feedback_count || 0} feedback
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alert Volume</TabsTrigger>
          <TabsTrigger value="resources">Resource Usage</TabsTrigger>
          <TabsTrigger value="performance">Model Performance</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Alert Volume Chart */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Volume Trend (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={alertVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="alerts" stroke="#3b82f6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource Usage */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>CPU & Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cpu" fill="#f97316" name="CPU %" />
                    <Bar dataKey="memory" fill="#8b5cf6" name="Memory %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Database Latency</p>
                  <p className="text-lg font-semibold">{latestHealth?.database_latency_ms || 0}ms</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">API Response Time</p>
                  <p className="text-lg font-semibold">{latestHealth?.api_response_time_ms || 0}ms</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Data Processed</p>
                  <p className="text-lg font-semibold">{(latestHealth?.total_data_processed_gb || 0).toFixed(2)}GB</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Active Rules</p>
                  <p className="text-lg font-semibold">{latestHealth?.active_monitoring_rules || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Model Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection Accuracy Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#10b981" name="Accuracy %" strokeWidth={2} />
                  <Line type="monotone" dataKey="precision" stroke="#3b82f6" name="Precision %" />
                  <Line type="monotone" dataKey="recall" stroke="#f97316" name="Recall %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detection Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">True Positives</span>
                  <span className="font-semibold">{latestPerformance?.true_positives || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">False Positives</span>
                  <span className="font-semibold text-orange-600">{latestPerformance?.false_positives || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">False Negatives</span>
                  <span className="font-semibold text-red-600">{latestPerformance?.false_negatives || 0}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm text-slate-600">F1 Score</span>
                  <span className="font-semibold">{(latestPerformance?.f1_score || 0).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600">Version</p>
                  <p className="font-semibold">{latestPerformance?.model_version || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Status</p>
                  <Badge variant="outline" className="capitalize">
                    {latestPerformance?.model_training_status || 'idle'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Last Training</p>
                  <p className="text-sm">{latestPerformance?.last_training_date 
                    ? new Date(latestPerformance.last_training_date).toLocaleDateString() 
                    : 'Never'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integration Health */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {integrationSuccess.toFixed(1)}%
                  </div>
                  <p className="text-slate-600 mt-2">Overall Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {integrationData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Failed Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-auto">
                  {integrationData.map((failure, idx) => (
                    <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold capitalize">{failure.provider}</p>
                          <p className="text-sm text-slate-600">{failure.error}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(failure.failed_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}