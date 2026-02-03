/**
 * Observability Metrics
 * Collects request metrics, system stats, and route performance
 */

const os = require('os');
const { performance, monitorEventLoopDelay  } = require('perf_hooks');

const requests = {
  total: 0,
  byRoute: new Map(),
  byStatus: new Map(),
  byMethod: new Map()
};

const latencies = [];
const MAX_LATENCY_SAMPLES = 2000;

const eventLoopHistogram = monitorEventLoopDelay({ resolution: 20 });
let monitoringStarted = false;

function startMetrics() {
  if (monitoringStarted) return;
  monitoringStarted = true;
  eventLoopHistogram.enable();
}

function recordRequest({ route, method, statusCode, durationMs, tenantId, traceId }) {
  requests.total += 1;

  const routeKey = route || 'unknown';
  const methodKey = method || 'UNKNOWN';
  const statusKey = statusCode || 0;

  const routeStats = requests.byRoute.get(routeKey) || {
    count: 0,
    totalDuration: 0,
    maxDuration: 0,
    statusCounts: new Map(),
    tenantCounts: new Map()
  };

  routeStats.count += 1;
  routeStats.totalDuration += durationMs;
  routeStats.maxDuration = Math.max(routeStats.maxDuration, durationMs);
  routeStats.statusCounts.set(statusKey, (routeStats.statusCounts.get(statusKey) || 0) + 1);
  if (tenantId) {
    routeStats.tenantCounts.set(tenantId, (routeStats.tenantCounts.get(tenantId) || 0) + 1);
  }

  requests.byRoute.set(routeKey, routeStats);
  requests.byStatus.set(statusKey, (requests.byStatus.get(statusKey) || 0) + 1);
  requests.byMethod.set(methodKey, (requests.byMethod.get(methodKey) || 0) + 1);

  if (Number.isFinite(durationMs)) {
    latencies.push(durationMs);
    if (latencies.length > MAX_LATENCY_SAMPLES) {
      latencies.shift();
    }
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function getMetricsSnapshot() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  const latencySnapshot = {
    p50: percentile(latencies, 50),
    p90: percentile(latencies, 90),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    max: latencies.length ? Math.max(...latencies) : 0,
    min: latencies.length ? Math.min(...latencies) : 0
  };

  const routeStats = {};
  for (const [route, stats] of requests.byRoute.entries()) {
    routeStats[route] = {
      count: stats.count,
      avgDuration: stats.count ? stats.totalDuration / stats.count : 0,
      maxDuration: stats.maxDuration,
      statusCounts: Object.fromEntries(stats.statusCounts),
      tenantCounts: Object.fromEntries(stats.tenantCounts)
    };
  }

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: os.cpus().length,
      loadAvg: os.loadavg(),
      totalMem: os.totalmem(),
      freeMem: os.freemem()
    },
    process: {
      memoryUsage,
      cpuUsage,
      eventLoopDelayMs: {
        min: eventLoopHistogram.min / 1e6,
        max: eventLoopHistogram.max / 1e6,
        mean: eventLoopHistogram.mean / 1e6,
        p50: eventLoopHistogram.percentile(50) / 1e6,
        p95: eventLoopHistogram.percentile(95) / 1e6,
        p99: eventLoopHistogram.percentile(99) / 1e6
      }
    },
    requests: {
      total: requests.total,
      byStatus: Object.fromEntries(requests.byStatus),
      byMethod: Object.fromEntries(requests.byMethod),
      routes: routeStats
    },
    latency: latencySnapshot
  };
}

function resetMetrics() {
  requests.total = 0;
  requests.byRoute.clear();
  requests.byStatus.clear();
  requests.byMethod.clear();
  latencies.length = 0;
  eventLoopHistogram.reset();
}

function metricsMiddleware(req, res, next) {
  const start = performance.now();

  res.on('finish', () => {
    const durationMs = performance.now() - start;
    recordRequest({
      route: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      durationMs,
      tenantId: req.tenant?.id,
      traceId: req.context?.traceId
    });
  });

  next();
}

module.exports = {
  startMetrics,
  recordRequest,
  getMetricsSnapshot,
  resetMetrics,
  metricsMiddleware
};
