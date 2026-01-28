import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Zap, AlertCircle } from 'lucide-react';

export default function IntegrationAnalytics() {
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.ExternalBotIntegration.list()
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['webhookLogs'],
    queryFn: () => base44.entities.WebhookLog.list('-created_date', 1000)
  });

  // Analytics calculations
  const platformData = integrations.reduce((acc, int) => {
    acc[int.platform] = (acc[int.platform] || 0) + 1;
    return acc;
  }, {});

  const platformChartData = Object.entries(platformData).map(([name, value]) => ({ name, value }));

  const successRate = logs.length > 0 
    ? ((logs.filter(l => l.status === 'success').length / logs.length) * 100).toFixed(1)
    : 0;

  const avgResponseTime = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length)
    : 0;

  const errorRate = logs.length > 0
    ? ((logs.filter(l => l.status === 'failed').length / logs.length) * 100).toFixed(1)
    : 0;

  // Timeline data (last 7 days)
  const timelineData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.created_date?.startsWith(dateStr));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      requests: dayLogs.length,
      success: dayLogs.filter(l => l.status === 'success').length,
      failed: dayLogs.filter(l => l.status === 'failed').length
    };
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Integration Analytics</h1>
        <p className="text-gray-500">Performance insights and metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
            <div className="text-3xl font-bold text-green-600">{successRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>
            <div className="text-3xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div className="text-sm text-gray-500">Avg Response</div>
            </div>
            <div className="text-3xl font-bold">{avgResponseTime}ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div className="text-sm text-gray-500">Error Rate</div>
            </div>
            <div className="text-3xl font-bold text-red-600">{errorRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Timeline (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Most Active Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrations.slice(0, 5).map(int => (
              <div key={int.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{int.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{int.platform}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{int.success_count || 0}</div>
                  <div className="text-xs text-gray-500">requests</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}