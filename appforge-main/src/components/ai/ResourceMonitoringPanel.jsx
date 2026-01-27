import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Zap, HardDrive, Wifi, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResourceMonitoringPanel() {
  const [metrics, setMetrics] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('monitorResourceUsage');
      if (response.data.metrics) {
        setMetrics(response.data.metrics);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    if (!metrics) return;
    setPredicting(true);
    try {
      const response = await base44.functions.invoke('predictResourceSpikes', {
        resource_metrics: metrics
      });
      if (response.data.analysis) {
        setPredictions(response.data.analysis);
      }
    } catch (err) {
      console.error('Error generating predictions:', err);
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-2">
        <Button 
          onClick={fetchMetrics}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh Metrics
        </Button>
        <Button 
          onClick={generatePredictions}
          disabled={predicting || !metrics}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {predicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          Predict Spikes & Optimize
        </Button>
      </div>

      {/* System Summary */}
      {metrics?.system_summary && (
        <Card>
          <CardHeader>
            <CardTitle>System Resource Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Total CPU</span>
                </div>
                <p className="text-2xl font-bold">{metrics.system_summary.total_cpu_percent.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Total Memory</span>
                </div>
                <p className="text-2xl font-bold">{metrics.system_summary.total_memory_mb.toFixed(0)} MB</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Network I/O</span>
                </div>
                <p className="text-2xl font-bold">{metrics.system_summary.total_network_io_kb.toFixed(0)} KB</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Active Processes</span>
                </div>
                <p className="text-2xl font-bold">{metrics.system_summary.active_processes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Resource Alerts ({metrics.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.alerts.map((alert, idx) => (
              <div key={idx} className="p-3 bg-white border border-red-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{alert.type}</p>
                    <p className="text-sm text-gray-600">{alert.automation_name}</p>
                  </div>
                  <Badge className="bg-red-600">{alert.current_usage.toFixed(1)}/{alert.threshold}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Automations */}
      {metrics?.automations && Object.keys(metrics.automations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Automation Resource Usage</CardTitle>
            <CardDescription>Real-time resource consumption by active automations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(metrics.automations).map((automation, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{automation.name}</p>
                    <p className="text-xs text-gray-500">24h Executions: {automation.execution_count_24h}</p>
                  </div>
                  <Badge className={cn(
                    automation.health_score >= 80 ? 'bg-green-100 text-green-800' : 
                    automation.health_score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  )}>
                    Health: {automation.health_score.toFixed(0)}%
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">CPU</p>
                    <div className="w-full bg-gray-200 rounded h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded"
                        style={{ width: `${Math.min(automation.cpu_percent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium mt-1">{automation.cpu_percent.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Memory</p>
                    <div className="w-full bg-gray-200 rounded h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded"
                        style={{ width: `${Math.min((automation.memory_mb / 500) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium mt-1">{automation.memory_mb.toFixed(0)} MB</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Network I/O</p>
                    <div className="w-full bg-gray-200 rounded h-2">
                      <div 
                        className="bg-green-500 h-2 rounded"
                        style={{ width: `${Math.min((automation.network_io_kb / 100) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium mt-1">{automation.network_io_kb.toFixed(0)} KB</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Predictions & Recommendations */}
      {predictions && (
        <div className="space-y-4">
          {/* Spike Predictions */}
          {predictions.predictions && predictions.predictions.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Predicted Resource Spikes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictions.predictions.map((pred, idx) => (
                  <div key={idx} className="p-3 bg-white border border-orange-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium capitalize">{pred.resource_type} Spike</p>
                      <Badge className={cn(
                        pred.severity === 'critical' ? 'bg-red-600' :
                        pred.severity === 'high' ? 'bg-orange-600' :
                        pred.severity === 'medium' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      )}>
                        {pred.probability}% probability
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Predicted peak: {pred.predicted_usage.toFixed(0)} at {pred.predicted_peak_time}
                    </p>
                    <p className="text-xs text-gray-600">
                      Affected: {pred.affected_processes.join(', ')}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Scaling Strategies */}
          {predictions.scaling_strategies && predictions.scaling_strategies.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle>Scaling & Optimization Strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictions.scaling_strategies.map((strategy, idx) => (
                  <div key={idx} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{strategy.target}</p>
                      <Badge variant="outline" className="capitalize">{strategy.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{strategy.recommendation}</p>
                    <p className="text-xs text-gray-600">
                      Expected: {strategy.expected_improvement} | Cost Impact: {strategy.estimated_cost_impact}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optimizations */}
          {predictions.optimizations && predictions.optimizations.length > 0 && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle>Code & Configuration Optimizations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictions.optimizations.map((opt, idx) => (
                  <div key={idx} className="p-3 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{opt.process}</p>
                      <Badge variant="outline">{opt.resource_savings_percent}% savings</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Issue:</span> {opt.issue}</p>
                    <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Fix:</span> {opt.optimization}</p>
                    <p className="text-xs text-gray-600 capitalize">Difficulty: {opt.implementation_difficulty}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Cost Analysis */}
          {predictions.cost_analysis && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle>Cost Analysis & ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Monthly Cost</p>
                    <p className="text-2xl font-bold">{predictions.cost_analysis.current_monthly_estimate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Optimized Monthly Cost</p>
                    <p className="text-2xl font-bold text-green-600">{predictions.cost_analysis.optimized_monthly_estimate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Potential Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {predictions.cost_analysis.potential_savings_percent}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      ROI in {predictions.cost_analysis.roi_timeline_days} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}