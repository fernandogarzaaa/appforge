const blockedIPs = new Set();
const metrics = [];
export const ddosProtection = {
    isIPBlocked(ip) {
        return blockedIPs.has(ip);
    },
    recordRequest(metric) {
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
