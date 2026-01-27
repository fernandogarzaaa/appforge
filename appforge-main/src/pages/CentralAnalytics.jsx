import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, TrendingUp, AlertTriangle, Zap, Clock, 
  CheckCircle2, XCircle, BarChart3, LineChart as LineChartIcon
} from 'lucide-react';
import PerformanceMonitor from '@/components/analytics/PerformanceMonitor';
import ErrorTracker from '@/components/analytics/ErrorTracker';
import UsageStatistics from '@/components/analytics/UsageStatistics';
import TrendAnalysis from '@/components/analytics/TrendAnalysis';

export default function CentralAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['centralAnalytics', timeRange],
    queryFn: async () => {
      const response = await base44.functions.invoke('aggregateAnalytics', { time_range: timeRange });
      return response.data;
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.ExternalBotIntegration.list()
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.BotTemplate.list()
  });

  const { data: webhookLogs = [] } = useQuery({
    queryKey: ['recentLogs'],
    queryFn: () => base44.entities.WebhookLog.list('-created_date', 100)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const stats = analyticsData?.overview || {
    totalExecutions: webhookLogs.length,
    successRate: webhookLogs.length > 0 ? (webhookLogs.filter(l => l.status === 'success').length / webhookLogs.length * 100).toFixed(1) : 0,
    errorRate: webhookLogs.length > 0 ? (webhookLogs.filter(l => l.status === 'failed').length / webhookLogs.length * 100).toFixed(1) : 0,
    avgResponseTime: webhookLogs.length > 0 ? Math.round(webhookLogs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / webhookLogs.length) : 0,
    activeIntegrations: integrations.filter(i => i.is_active).length,
    totalTemplates: templates.length
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics Dashboard</h1>
          <p className="text-gray-500">Centralized insights across all bots and integrations</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Executions</div>
                <div className="text-2xl font-bold">{stats.totalExecutions}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Success Rate</div>
                <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Error Rate</div>
                <div className="text-2xl font-bold text-red-600">{stats.errorRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg Response</div>
                <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Active Integrations</div>
                <div className="text-3xl font-bold">{stats.activeIntegrations}</div>
              </div>
              <Zap className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Published Templates</div>
                <div className="text-3xl font-bold">{stats.totalTemplates}</div>
              </div>
              <BarChart3 className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="performance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="errors">
            <XCircle className="w-4 h-4 mr-2" />
            Errors
          </TabsTrigger>
          <TabsTrigger value="usage">
            <BarChart3 className="w-4 h-4 mr-2" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="trends">
            <LineChartIcon className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <PerformanceMonitor timeRange={timeRange} data={analyticsData} />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <ErrorTracker timeRange={timeRange} logs={webhookLogs} />
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <UsageStatistics 
            timeRange={timeRange} 
            integrations={integrations}
            templates={templates}
            logs={webhookLogs}
          />
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <TrendAnalysis timeRange={timeRange} data={analyticsData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}