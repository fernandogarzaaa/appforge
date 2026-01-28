// @ts-ignore - Component uses runtime base44.functions.execute API
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Zap, TrendingUp, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function RateLimits() {
  const [testEndpoint, _setTestEndpoint] = useState('/api/test');
  const queryClient = useQueryClient();

  // Get rate limit info
  const { data: limits } = useQuery({
    queryKey: ['rate-limits'],
    queryFn: async () => {
      const response = await base44.functions.execute('rateLimitManager', {
        action: 'checkLimit',
        endpoint: testEndpoint
      });
      return response.data;
    },
    refetchInterval: 5000
  });

  // Get quota info
  const { data: quotas } = useQuery({
    queryKey: ['quotas'],
    queryFn: async () => {
      const response = await base44.functions.execute('rateLimitManager', {
        action: 'checkQuota',
        quotaType: 'api_calls'
      });
      return response.data;
    }
  });

  // Get usage analytics
  const { data: analytics } = useQuery({
    queryKey: ['usage-analytics'],
    queryFn: async () => {
      const response = await base44.functions.execute('rateLimitManager', {
        action: 'getUsageAnalytics',
        period: 'day'
      });
      return response.data;
    }
  });

  // Test rate limit
  const testLimit = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.execute('rateLimitManager', {
        action: 'checkLimit',
        endpoint: testEndpoint
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-limits'] });
    }
  });

  const getTierColor = (tier) => {
    const colors = {
      free: 'bg-gray-500',
      basic: 'bg-blue-500',
      pro: 'bg-purple-500',
      premium: 'bg-amber-500'
    };
    return colors[tier] || 'bg-gray-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Rate Limits & Quotas</h1>
        <p className="text-muted-foreground">
          Intelligent rate limiting with tier-based quotas and usage analytics.
        </p>
      </div>

      {/* Current Tier */}
      {limits && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge className={getTierColor(limits.tier)}>
                  {limits.tier.toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {limits.limit} requests per minute
                </p>
              </div>
              <Button onClick={() => testLimit.mutate()}>
                Test Limit
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Requests Used</span>
                  <span>{limits.remaining} / {limits.limit}</span>
                </div>
                <Progress 
                  value={((limits.limit - limits.remaining) / limits.limit) * 100} 
                />
              </div>

              {limits.resetTime && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Resets at {new Date(limits.resetTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotas */}
      {quotas && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Monthly Quotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>AI Requests</span>
                  <span>{quotas.used} / {quotas.limit}</span>
                </div>
                <Progress 
                  value={(quotas.used / quotas.limit) * 100} 
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Storage Used</span>
                  <span>2.4 GB / 10 GB</span>
                </div>
                <Progress value={24} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>API Calls</span>
                  <span>45,230 / 100,000</span>
                </div>
                <Progress value={45} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Webhooks</span>
                  <span>128 / 1,000</span>
                </div>
                <Progress value={12} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Usage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold">{analytics.totalRequests}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold">{analytics.averagePerHour}</div>
                <div className="text-sm text-muted-foreground">Avg per Hour</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold">{analytics.peakHour}</div>
                <div className="text-sm text-muted-foreground">Peak Hour</div>
              </div>
            </div>

            {analytics.topEndpoints && analytics.topEndpoints.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Top Endpoints</h4>
                <div className="space-y-2">
                  {analytics.topEndpoints.map((endpoint, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-mono">{endpoint.endpoint}</span>
                      <span className="text-muted-foreground">{endpoint.count} requests</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
