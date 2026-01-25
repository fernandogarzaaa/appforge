import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Zap, Network } from 'lucide-react';

export default function RootCauseAnalysis({ anomalyId }) {
  const { data: correlation } = useQuery({
    queryKey: ['anomaly-correlation', anomalyId],
    queryFn: () => base44.entities.AnomalyCorrelation.filter({ primary_anomaly_id: anomalyId }).then(r => r[0])
  });

  if (!correlation) {
    return <div className="text-slate-600">Analyzing root cause...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Root Cause */}
      {correlation.root_cause_analysis?.identified && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Root Cause Identified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Primary Cause</p>
              <p className="text-lg font-semibold">{correlation.root_cause_analysis.primary_cause}</p>
              <Badge className="mt-2 bg-blue-600">{correlation.root_cause_analysis.confidence}% confidence</Badge>
            </div>
            {correlation.root_cause_analysis.contributing_factors?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Contributing Factors</p>
                <div className="space-y-1">
                  {correlation.root_cause_analysis.contributing_factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-slate-600" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {correlation.root_cause_analysis.analysis_details && (
              <div className="p-3 bg-white rounded border border-blue-200">
                <p className="text-sm text-slate-700">{correlation.root_cause_analysis.analysis_details}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cascade Risk */}
      {correlation.cascade_risk > 0 && (
        <Card className={`border-2 ${correlation.cascade_risk > 70 ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="w-5 h-5 text-orange-600" />
              Cascade Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-orange-600">{correlation.cascade_risk}%</div>
            {correlation.affected_systems?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Affected Systems</p>
                <div className="space-y-1">
                  {correlation.affected_systems.map((system, idx) => (
                    <Badge key={idx} variant="outline">{system}</Badge>
                  ))}
                </div>
              </div>
            )}
            {correlation.impact_chain?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Impact Chain</p>
                {correlation.impact_chain.map((impact, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm py-1">
                    <span className="font-medium">{impact.system}</span>
                    <span className="text-slate-600">→ {impact.impact_type}</span>
                    {impact.latency_ms && <span className="text-xs text-slate-500">({impact.latency_ms}ms)</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Related Anomalies */}
      {correlation.related_anomalies?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Anomalies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {correlation.related_anomalies.map((anomaly, idx) => (
              <div key={idx} className="p-2 bg-slate-50 rounded flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{anomaly.anomaly_id}</p>
                  <p className="text-xs text-slate-600">
                    {anomaly.time_delta_seconds ? `${Math.round(anomaly.time_delta_seconds / 60)}m before/after` : 'concurrent'}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{anomaly.correlation_score}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}