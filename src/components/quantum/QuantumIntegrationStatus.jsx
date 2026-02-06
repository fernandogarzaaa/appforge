import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuantumIntegrationStatus() {
  return (
    <Card className="border-dashed border-slate-700 bg-slate-900/40">
      <CardHeader>
        <CardTitle className="text-slate-200">Quantum Integration Status</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-300">
        Quantum integration telemetry is not configured. Connect quantum service providers to surface live status.
      </CardContent>
    </Card>
  );
}
