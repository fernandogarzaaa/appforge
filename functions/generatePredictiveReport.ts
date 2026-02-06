import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Predictive Analytics Report
 * Generates forecast and anomaly summary based on provided metrics.
 */

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { metrics = [], horizonDays = 30 } = await req.json();

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return Response.json({ error: 'metrics array required' }, { status: 400 });
    }

    const values = metrics.map((item: any) => Number(item.value) || 0);
    const baseline = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Linear trend via least squares
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = baseline;
    let num = 0;
    let den = 0;
    values.forEach((y, i) => {
      num += (i - xMean) * (y - yMean);
      den += (i - xMean) * (i - xMean);
    });
    const slope = den === 0 ? 0 : num / den;

    const forecast = Array.from({ length: Math.min(14, Number(horizonDays) || 30) }).map((_, index) => {
      const day = index + 1;
      const expected = Math.max(yMean + slope * (n + index - xMean), 0);
      return { day, expected: Number(expected.toFixed(4)) };
    });

    // Anomaly detection using z-score
    const variance = values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance) || 1;
    const anomalies = values
      .map((v, idx) => ({ index: idx, value: v, zScore: (v - yMean) / stdDev }))
      .filter((item) => Math.abs(item.zScore) >= 2.5)
      .map((item) => ({
        index: item.index,
        value: item.value,
        zScore: Number(item.zScore.toFixed(2))
      }));

    return Response.json({
      success: true,
      horizonDays,
      baseline: Number(baseline.toFixed(4)),
      slope: Number(slope.toFixed(6)),
      forecast,
      anomalies
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
