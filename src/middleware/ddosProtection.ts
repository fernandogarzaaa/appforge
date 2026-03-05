type RequestMetric = {
  ip: string;
  timestamp: number;
  method: string;
  endpoint: string;
  statusCode: number;
  size: number;
  latency: number;
  userAgent?: string;
  country?: string;
};

const blockedIPs = new Set<string>();
const metrics: RequestMetric[] = [];

export const ddosProtection = {
  isIPBlocked(ip: string): boolean {
    return blockedIPs.has(ip);
  },
  recordRequest(metric: RequestMetric): void {
    metrics.push(metric);
    if (metrics.length > 5000) {
      metrics.splice(0, metrics.length - 5000);
    }
  },
  getStatistics() {
    return {
      blockedIPCount: blockedIPs.size,
      requestCount: metrics.length,
      recentRequests: metrics.slice(-100)
    };
  }
};

export default ddosProtection;
