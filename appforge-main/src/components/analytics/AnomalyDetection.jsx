import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function AnomalyDetection({ projectId }) {
  const [anomalies, setAnomalies] = useState([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);

  useEffect(() => {
    detectAnomalies();
  }, [projectId]);

  const detectAnomalies = () => {
    // Simulated anomaly detection
    const detected = [
      {
        id: 1,
        type: 'spike',
        metric: 'Page Load Time',
        severity: 'high',
        detected_at: '2026-01-25 14:23:00',
        value: 4.2,
        baseline: 1.8,
        description: 'Unusual spike in page load time detected',
        impact: 'User experience degradation',
        suggestion: 'Check server resources and database query performance',
        data: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          value: i === 14 ? 4.2 : 1.5 + Math.random() * 0.8,
          baseline: 1.8
        }))
      },
      {
        id: 2,
        type: 'drop',
        metric: 'Active Users',
        severity: 'critical',
        detected_at: '2026-01-25 08:15:00',
        value: 342,
        baseline: 892,
        description: 'Significant drop in active users',
        impact: 'Potential service disruption',
        suggestion: 'Verify service availability and check for deployment issues',
        data: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          value: i >= 8 && i <= 12 ? 300 + Math.random() * 100 : 850 + Math.random() * 100,
          baseline: 892
        }))
      },
      {
        id: 3,
        type: 'spike',
        metric: 'API Error Rate',
        severity: 'medium',
        detected_at: '2026-01-25 16:45:00',
        value: 12.4,
        baseline: 2.1,
        description: 'Elevated API error rate',
        impact: 'Increased failure in API calls',
        suggestion: 'Review recent API changes and external service status',
        data: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          value: i === 16 ? 12.4 : 1.5 + Math.random() * 1.2,
          baseline: 2.1
        }))
      },
      {
        id: 4,
        type: 'pattern',
        metric: 'Login Success Rate',
        severity: 'low',
        detected_at: '2026-01-25 11:30:00',
        value: 89.2,
        baseline: 96.5,
        description: 'Unusual pattern in login success rate',
        impact: 'Users experiencing login difficulties',
        suggestion: 'Check authentication service and rate limiting',
        data: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          value: i >= 10 && i <= 13 ? 85 + Math.random() * 8 : 95 + Math.random() * 3,
          baseline: 96.5
        }))
      }
    ];

    setAnomalies(detected);
    setSelectedAnomaly(detected[0]);
  };

  const severityConfig = {
    critical: { color: 'red', icon: AlertTriangle, bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-600' },
    high: { color: 'orange', icon: AlertTriangle, bg: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-600' },
    medium: { color: 'yellow', icon: Info, bg: 'bg-yellow-100', text: 'text-yellow-800', badge: 'bg-yellow-600' },
    low: { color: 'blue', icon: Info, bg: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-600' }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Anomaly Detection</h2>
          <p className="text-gray-500">AI-powered monitoring of unusual patterns</p>
        </div>
        <Badge className="bg-green-600">
          <Activity className="w-3 h-3 mr-1" />
          Monitoring Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries({ critical: 1, high: 1, medium: 1, low: 1 }).map(([severity, count]) => {
          const config = severityConfig[severity];
          return (
            <Card key={severity}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <config.icon className={`w-5 h-5 text-${config.color}-600`} />
                  <span className="text-sm text-gray-600 capitalize">{severity}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Detected Anomalies</h3>
          {anomalies.map((anomaly) => {
            const config = severityConfig[anomaly.severity];
            const Icon = config.icon;
            return (
              <Card 
                key={anomaly.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedAnomaly?.id === anomaly.id ? 'ring-2 ring-indigo-600' : ''
                }`}
                onClick={() => setSelectedAnomaly(anomaly)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm truncate">{anomaly.metric}</span>
                        <Badge className={config.badge}>{anomaly.severity}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{anomaly.description}</p>
                      <span className="text-xs text-gray-500">{anomaly.detected_at}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Anomaly Details */}
        <div className="lg:col-span-2">
          {selectedAnomaly && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedAnomaly.metric}</CardTitle>
                  <Badge className={severityConfig[selectedAnomaly.severity].badge}>
                    {selectedAnomaly.severity} severity
                  </Badge>
                </div>
                <CardDescription>{selectedAnomaly.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={selectedAnomaly.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <ReferenceLine 
                        y={selectedAnomaly.baseline} 
                        stroke="#6b7280" 
                        strokeDasharray="3 3"
                        label="Baseline"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Current Value</span>
                    <div className="text-2xl font-bold mt-1">
                      {selectedAnomaly.value}
                      {selectedAnomaly.type === 'spike' ? (
                        <TrendingUp className="inline w-5 h-5 text-red-600 ml-2" />
                      ) : (
                        <TrendingDown className="inline w-5 h-5 text-orange-600 ml-2" />
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Baseline</span>
                    <div className="text-2xl font-bold mt-1">{selectedAnomaly.baseline}</div>
                  </div>
                </div>

                {/* Impact & Suggestion */}
                <div className="space-y-3">
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 mb-1">Impact</p>
                        <p className="text-sm text-gray-700">{selectedAnomaly.impact}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 mb-1">Suggested Action</p>
                        <p className="text-sm text-gray-700">{selectedAnomaly.suggestion}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1">Acknowledge</Button>
                  <Button variant="outline" className="flex-1">Create Ticket</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}