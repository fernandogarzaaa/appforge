import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Network, TrendingUp, AlertTriangle } from 'lucide-react';

export default function MultiDimensionalDetector() {
  const { data: multidimAnomalies } = useQuery({
    queryKey: ['multidimensional-anomalies'],
    queryFn: () => base44.entities.MultiDimensionalAnomaly.list('-created_at', 20)
  });

  if (!multidimAnomalies || multidimAnomalies.length === 0) {
    return <div className="p-4 text-slate-600">No multi-dimensional anomalies detected</div>;
  }

  const criticalAnomalies = multidimAnomalies.filter(a => a.anomaly_severity === 'critical');
  const correlatedPatterns = multidimAnomalies.filter(a => a.pattern_type === 'correlated');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Detected</p>
            <p className="text-2xl font-bold">{multidimAnomalies.length}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-xs text-red-600">Critical</p>
            <p className="text-2xl font-bold text-red-700">{criticalAnomalies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Patterns</p>
            <p className="text-2xl font-bold">{correlatedPatterns.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-3">
          {multidimAnomalies.slice(0, 5).map(anomaly => (
            <Card key={anomaly.id} className={`border-l-4 ${
              anomaly.anomaly_severity === 'critical' ? 'border-l-red-500' : 'border-l-orange-500'
            }`}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      {anomaly.title}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">{anomaly.description}</p>
                  </div>
                  <Badge className={
                    anomaly.anomaly_severity === 'critical' ? 'bg-red-600' : 'bg-orange-600'
                  }>
                    {anomaly.anomaly_severity}
                  </Badge>
                </div>

                {/* Sources Involved */}
                <div className="flex gap-1 flex-wrap mb-2">
                  {anomaly.affected_sources?.map(source => (
                    <Badge key={source} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>

                {/* Pattern Info */}
                <div className="text-sm text-slate-700">
                  <p>Pattern: <span className="font-semibold capitalize">{anomaly.pattern_type}</span></p>
                  <p>Correlation: <span className="font-semibold">{anomaly.correlation_strength}%</span></p>
                  <p>Confidence: <span className="font-semibold">{anomaly.confidence_score}%</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Patterns */}
        <TabsContent value="patterns" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Correlation Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 p-4 bg-slate-50 rounded">
                Correlations between {multidimAnomalies.reduce((acc, a) => acc + a.affected_sources?.length || 0, 0)} sources detected
              </div>
            </CardContent>
          </Card>

          {/* Pattern Details */}
          {multidimAnomalies.map(anomaly => (
            anomaly.temporal_relationship && (
              <Card key={anomaly.id}>
                <CardContent className="pt-4">
                  <p className="font-semibold text-sm mb-2">{anomaly.title}</p>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p><strong>{anomaly.temporal_relationship.source_a}</strong> → <strong>{anomaly.temporal_relationship.source_b}</strong></p>
                    <p>Time Delta: {anomaly.temporal_relationship.time_delta_seconds}s</p>
                    <p>Relationship: {anomaly.temporal_relationship.lead_lag_relationship}</p>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </TabsContent>

        {/* Dimensions */}
        <TabsContent value="dimensions" className="space-y-3">
          {multidimAnomalies.slice(0, 3).map(anomaly => (
            <Card key={anomaly.id}>
              <CardHeader>
                <CardTitle className="text-sm">{anomaly.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {anomaly.dimensions?.map((dim, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded">
                    <p className="font-semibold text-sm">{dim.source_name}: {dim.metric_name}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                      <div>
                        <p className="text-slate-600">Actual</p>
                        <p className="font-semibold">{dim.actual_value?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Expected</p>
                        <p className="font-semibold">{dim.expected_value?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Deviation</p>
                        <p className="font-semibold text-red-600">{dim.deviation_percent?.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}