import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { featureFlags } from '@/utils/featureFlags';

export default function PredictiveAnalytics() {
  const { analytics: analyticsEnabled } = featureFlags;

  if (!analyticsEnabled) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-gray-600">
          Predictive analytics are not configured. Enable `VITE_ANALYTICS_ENABLED` after wiring a telemetry source.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predictive Analytics</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        Predictive analytics requires historical telemetry and model outputs. Connect analytics data to enable forecasts.
      </CardContent>
    </Card>
  );
}
