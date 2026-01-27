import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Activity } from 'lucide-react';

export default function SystemHealth() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkSystemHealth', {});
      return response.data;
    },
    refetchInterval: 10000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const services = healthData?.services || [];
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const overallHealth = services.length > 0 ? (healthyCount / services.length * 100).toFixed(0) : 100;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">System Health</h1>
        <p className="text-gray-500">Monitor all system components and services</p>
      </div>

      {/* Overall Health */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="64" cy="64" r="56"
                  stroke={overallHealth >= 90 ? '#10b981' : overallHealth >= 70 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8" fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallHealth / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{overallHealth}%</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">System Operational</h3>
              <p className="text-gray-600">{healthyCount} of {services.length} services healthy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{service.name}</CardTitle>
                {service.status === 'healthy' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : service.status === 'degraded' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Response Time</span>
                  <span className="font-medium">{service.response_time || 0}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uptime</span>
                  <span className="font-medium">{service.uptime || 100}%</span>
                </div>
                <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                  {service.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}