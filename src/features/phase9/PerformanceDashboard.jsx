import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { featureFlags } from '@/utils/featureFlags';

export const PerformanceDashboard = () => {
  const { analytics: analyticsEnabled } = featureFlags;

  if (!analyticsEnabled) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Performance metrics are not configured. Enable `VITE_ANALYTICS_ENABLED` after wiring a metrics backend.
        </div>
      </div>
    );
  }

  return (
    <Card className="m-6">
      <CardContent className="pt-6 text-sm text-gray-600">
        Performance telemetry is not yet connected. Connect a metrics pipeline to populate this dashboard.
      </CardContent>
    </Card>
  );
};
