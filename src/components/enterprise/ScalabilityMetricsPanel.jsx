import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Globe } from 'lucide-react';

export default function ScalabilityMetricsPanel() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const data = await base44.entities.ScalabilityMetrics.list('-metric_date', 1);
      setMetrics(data?.[0] || null);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metrics) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Multi-Domain Scaling Proof
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-white border border-emerald-200">
              <p className="text-xs text-gray-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-emerald-600">{metrics.total_users}</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-emerald-200">
              <p className="text-xs text-gray-600 mb-1">Active Domains</p>
              <p className="text-2xl font-bold text-emerald-600">{metrics.domains_active}</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-emerald-200">
              <p className="text-xs text-gray-600 mb-1">Deployments</p>
              <p className="text-2xl font-bold text-emerald-600">
                {metrics.system_health?.concurrent_deployments || 0}
              </p>
            </div>
          </div>

          {/* Cross-Domain Usage */}
          {metrics.cross_domain_usage && metrics.cross_domain_usage.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600">Cross-Domain Performance</p>
              <div className="space-y-1">
                {metrics.cross_domain_usage.map((domain, idx) => (
                  <div key={idx} className="p-2 rounded bg-white border border-emerald-100">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-medium capitalize">{domain.domain}</span>
                      <span className="text-emerald-600 font-semibold">
                        {(domain.avg_performance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span>{domain.user_count} users</span>
                      <span className="text-gray-400">•</span>
                      <span>{domain.learning_samples} samples</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Health */}
          {metrics.system_health && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600">System Health</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-white border border-emerald-100">
                  <p className="text-xs text-gray-600">Uptime</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {metrics.system_health.uptime_percentage}%
                  </p>
                </div>
                <div className="p-2 rounded bg-white border border-emerald-100">
                  <p className="text-xs text-gray-600">Response Time</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {metrics.system_health.avg_response_time_ms}ms
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Adoption Curve */}
          {metrics.adoption_curve && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Growth Metrics
                </p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>MoM Growth</span>
                  <Badge className="bg-emerald-600 text-white">
                    {(metrics.adoption_curve.mom_growth * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Retention Rate</span>
                  <Badge variant="outline">
                    {(metrics.adoption_curve.retention_rate * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>New Domain Adoption</span>
                  <Badge variant="outline">
                    {(metrics.adoption_curve.new_domain_adoption_rate * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}