import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { featureFlags } from '@/utils/featureFlags';

export default function RateLimitDashboard() {
  const { security } = featureFlags;

  if (!security) {
    return (
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Rate limit monitoring is disabled. Enable `VITE_SECURITY_ENABLED` after wiring your rate-limit backend.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Limit Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        Rate limit telemetry is not yet connected. Connect a backend metrics source to populate this dashboard.
      </CardContent>
    </Card>
  );
}
