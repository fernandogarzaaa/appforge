import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Clock } from 'lucide-react';

export default function SLAMonitoringDashboard() {
  const { data: slas } = useQuery({
    queryKey: ['sla-breaches'],
    queryFn: () => base44.entities.SLABreach.list('-breach_probability', 50)
  });

  if (!slas || slas.length === 0) {
    return <div className="p-4 text-center text-slate-600">All SLAs are healthy</div>;
  }

  const criticalSLAs = slas.filter(s => s.status === 'critical' || s.breach_probability > 80);
  const atRiskSLAs = slas.filter(s => s.status === 'at_risk');
  const breachedSLAs = slas.filter(s => s.status === 'breached');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-xs text-red-600 font-semibold">BREACHED</p>
            <p className="text-2xl font-bold text-red-700">{breachedSLAs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <p className="text-xs text-orange-600 font-semibold">CRITICAL</p>
            <p className="text-2xl font-bold text-orange-700">{criticalSLAs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <p className="text-xs text-yellow-600 font-semibold">AT RISK</p>
            <p className="text-2xl font-bold text-yellow-700">{atRiskSLAs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Breached SLAs */}
      {breachedSLAs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Breached SLAs
          </h4>
          {breachedSLAs.map(sla => (
            <Card key={sla.id} className="border-l-4 border-l-red-500 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{sla.service_name}</p>
                    <p className="text-sm text-slate-600">{sla.sla_metric}</p>
                  </div>
                  <Badge className="bg-red-600">BREACHED</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                  <div>
                    <p className="text-xs text-slate-600">Target</p>
                    <p className="font-semibold">{sla.sla_target}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Current</p>
                    <p className="font-semibold text-red-600">{sla.current_value}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Penalty</p>
                    <p className="font-semibold">${sla.penalty_amount?.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Critical SLAs */}
      {criticalSLAs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-orange-600 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Critical Risk
          </h4>
          {criticalSLAs.map(sla => (
            <Card key={sla.id} className="border-l-4 border-l-orange-500 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{sla.service_name}</p>
                    <p className="text-sm text-slate-600">{sla.sla_metric}</p>
                  </div>
                  <Badge className="bg-orange-600">{sla.breach_probability}% risk</Badge>
                </div>
                <p className="text-sm text-slate-700 mb-2">{sla.required_action}</p>
                <div className="text-xs text-slate-600">
                  Breach in: <span className="font-semibold">{sla.time_until_breach} minutes</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* At Risk SLAs */}
      {atRiskSLAs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-700">At Risk</h4>
          {atRiskSLAs.slice(0, 3).map(sla => (
            <Card key={sla.id}>
              <CardContent className="pt-4 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{sla.service_name}</p>
                  <p className="text-xs text-slate-600">{sla.sla_metric}</p>
                </div>
                <Badge variant="outline">{sla.breach_probability}%</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}