import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { featureFlags } from '@/utils/featureFlags';

export default function AnomalyDetection() {
  const { analytics: analyticsEnabled } = featureFlags;

  if (!analyticsEnabled) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-gray-600">
          Anomaly detection is not configured. Enable `VITE_ANALYTICS_ENABLED` after wiring a telemetry source.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Detection</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        No telemetry anomalies detected yet. Connect analytics data to enable automated detection.
      </CardContent>
    </Card>
  );
}
