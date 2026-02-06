import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { featureFlags } from '@/utils/featureFlags';

export default function UsageInsights({ projectId }) {
  const { analytics: analyticsEnabled } = featureFlags;
  if (!analyticsEnabled) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-gray-600">
          Usage analytics are not configured. Enable `VITE_ANALYTICS_ENABLED` after wiring a telemetry source.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Insights</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        Usage telemetry is not yet connected. Connect an analytics data source to populate usage insights.
      </CardContent>
    </Card>
  );
}
