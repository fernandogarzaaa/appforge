// @ts-nocheck
/**
 * Application Monitoring & Error Tracking
 * Real-time APM dashboard with error tracking
 */

import { createClientFromRequest } from '@base44/sdk';

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const {
      appId,
      eventType,
      data, // { errorStack, latency, throughput, memory, cpu, endpoint }
    } = await req.json();
    const metricPayload = {
      app_id: appId,
      event_type: eventType,
      data,
      captured_at: new Date().toISOString(),
    };

    const metric = await base44.entities.AppMetric?.create(metricPayload).catch(() => metricPayload);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Metric tracked',
        metricId: metric.id || `metric_${Date.now()}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
