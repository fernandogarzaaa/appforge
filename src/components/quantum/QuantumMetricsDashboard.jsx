import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuantumMetricsDashboard() {
  return (
    <Card className="border-dashed border-slate-700 bg-slate-900/40">
      <CardHeader>
        <CardTitle className="text-slate-200">Quantum Metrics</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-300">
        Quantum telemetry is not connected. Configure a metrics pipeline to enable real-time quantum health dashboards.
      </CardContent>
    </Card>
  );
}
