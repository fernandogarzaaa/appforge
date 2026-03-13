/**
 * Analytics Dashboard Service
 * Usage metrics, A/B testing framework, and billing analytics
 */
class AnalyticsDashboard {
    events = [];
    metrics = new Map();
    abTests = new Map();
    billingData = new Map();
    eventAggregationInterval = 5000; // 5 seconds
    constructor() {
        this.initializeAggregation();
    }
    /**
     * Initialize periodic event aggregation
     */
    initializeAggregation() {
        setInterval(() => {
            this.aggregateEvents();
        }, this.eventAggregationInterval);
    }
    /**
     * Track analytics event
     */
    trackEvent(event) {
        this.events.push(event);
        console.log(`[Analytics] Tracked event: ${event.eventType} for user ${event.userId}`);
    }
    /**
     * Aggregate events into metrics
     */
    aggregateEvents() {
        if (this.events.length === 0)
            return;
        const grouped = new Map();
        // Group events by userId and date
        for (const event of this.events) {
            const key = `${event.userId}_${event.timestamp.toDateString()}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(event);
        }
        // Process grouped events
        for (const [key, events] of grouped.entries()) {
            const [userId, dateStr] = key.split('_');
            const date = new Date(dateStr);
            const metrics = {
                userId,
                date,
                totalRequests: events.filter(e => e.eventType === 'request').length,
                totalAnalyses: events.filter(e => e.eventType === 'quantum.analysis').length,
                totalDeployments: events.filter(e => e.eventType === 'deployment').length,
                successfulAnalyses: events.filter(e => e.eventType === 'quantum.analysis' && e.metadata.status === 'success').length,
                failedAnalyses: events.filter(e => e.eventType === 'quantum.analysis' && e.metadata.status === 'failed').length,
                totalCreditsUsed: events.reduce((sum, e) => sum + (e.metadata.creditsUsed || 0), 0),
                averageResponseTime: events.reduce((sum, e) => sum + (e.metadata.responseTime || 0), 0) / events.length,
                topEndpoints: this.calculateTopEndpoints(events)
            };
            // Store metrics
            if (!this.metrics.has(userId)) {
                this.metrics.set(userId, []);
            }
            this.metrics.get(userId).push(metrics);
        }
        // Clear processed events
        this.events = [];
    }
    /**
     * Calculate top endpoints from events
     */
    calculateTopEndpoints(events) {
        const endpoints = new Map();
        for (const event of events.filter(e => e.eventType === 'request')) {
            const endpoint = event.metadata.endpoint || 'unknown';
            if (!endpoints.has(endpoint)) {
                endpoints.set(endpoint, []);
            }
            endpoints.get(endpoint).push(event);
        }
        const metrics = Array.from(endpoints.entries())
            .map(([endpoint, events]) => ({
            endpoint,
            requests: events.length,
            averageResponseTime: events.reduce((sum, e) => sum + (e.metadata.responseTime || 0), 0) / events.length,
            errorRate: events.filter(e => e.metadata.status >= 400).length / events.length
        }))
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 10);
        return metrics;
    }
    /**
     * Get usage metrics for user
     */
    getUserMetrics(userId, days = 7) {
        const allMetrics = this.metrics.get(userId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return allMetrics.filter(m => m.date >= cutoffDate);
    }
    /**
     * Create A/B test
     */
    createABTest(config) {
        const testId = 'test_' + Date.now();
        const fullConfig = {
            ...config,
            id: testId,
            metrics: {
                variant_a_conversions: 0,
                variant_a_views: 0,
                variant_b_conversions: 0,
                variant_b_views: 0,
                confidence: 0
            }
        };
        this.abTests.set(testId, fullConfig);
        console.log(`[Analytics] Created A/B test: ${testId}`);
        return testId;
    }
    /**
     * Assign user to A/B test variant
     */
    assignABTestVariant(testId, userId) {
        const test = this.abTests.get(testId);
        if (!test || !test.active) {
            return 'none';
        }
        // Deterministic assignment based on userId hash
        const hash = userId
            .split('')
            .reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
        const percentage = Math.abs(hash) % 100;
        return percentage < test.splitPercentage ? 'a' : 'b';
    }
    /**
     * Track A/B test event
     */
    trackABTestEvent(testId, userId, eventType) {
        const test = this.abTests.get(testId);
        if (!test)
            return;
        const variant = this.assignABTestVariant(testId, userId);
        const key = `variant_${variant}_${eventType}s`;
        if (key in test.metrics) {
            test.metrics[key]++;
            this.updateABTestConfidence(test);
        }
    }
    /**
     * Update A/B test confidence score
     */
    updateABTestConfidence(test) {
        const { variant_a_conversions, variant_a_views, variant_b_conversions, variant_b_views } = test.metrics;
        const conversionRateA = variant_a_views > 0 ? variant_a_conversions / variant_a_views : 0;
        const conversionRateB = variant_b_views > 0 ? variant_b_conversions / variant_b_views : 0;
        // Simplified confidence calculation (chi-squared test)
        if (variant_a_views > 30 && variant_b_views > 30) {
            const pooled = (variant_a_conversions + variant_b_conversions) / (variant_a_views + variant_b_views);
            const se = Math.sqrt(pooled * (1 - pooled) * (1 / variant_a_views + 1 / variant_b_views));
            const z = Math.abs(conversionRateA - conversionRateB) / (se || 0.001);
            test.metrics.confidence = Math.min(100, Math.round((1 - Math.exp(-z * z / 2)) * 100));
        }
    }
    /**
     * Get A/B test results
     */
    getABTestResults(testId) {
        return this.abTests.get(testId);
    }
    /**
     * Update billing analytics
     */
    updateBillingAnalytics(userId, creditsUsed, costPerCredit = 0.01) {
        const key = `${userId}_${new Date().toISOString().split('T')[0]}`;
        if (!this.billingData.has(key)) {
            this.billingData.set(key, {
                userId,
                period: 'day',
                totalCreditsUsed: 0,
                estimatedCost: 0,
                creditsRemaining: 1000000,
                costByService: {},
                foreccastedMonthlyUsage: 0
            });
        }
        const analytics = this.billingData.get(key);
        analytics.totalCreditsUsed += creditsUsed;
        analytics.estimatedCost = analytics.totalCreditsUsed * costPerCredit;
        analytics.creditsRemaining -= creditsUsed;
    }
    /**
     * Get billing analytics
     */
    getBillingAnalytics(userId, period = 'month') {
        const keys = Array.from(this.billingData.keys()).filter(k => k.startsWith(userId));
        const data = keys.map(k => this.billingData.get(k));
        const totalCreditsUsed = data.reduce((sum, d) => sum + d.totalCreditsUsed, 0);
        const totalCost = data.reduce((sum, d) => sum + d.estimatedCost, 0);
        // Forecast monthly usage
        const dailyAverage = data.length > 0 ? totalCreditsUsed / data.length : 0;
        const foreccastedMonthlyUsage = dailyAverage * 30;
        return {
            userId,
            period,
            totalCreditsUsed,
            estimatedCost: totalCost,
            creditsRemaining: 1000000 - totalCreditsUsed,
            costByService: {
                'quantum-analysis': totalCost * 0.4,
                'api-calls': totalCost * 0.3,
                'storage': totalCost * 0.3
            },
            foreccastedMonthlyUsage
        };
    }
    /**
     * Generate analytics report
     */
    generateReport(userId) {
        const metrics = this.getUserMetrics(userId, 30);
        const billing = this.getBillingAnalytics(userId, 'month');
        const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
        const totalAnalyses = metrics.reduce((sum, m) => sum + m.totalAnalyses, 0);
        const successRate = totalAnalyses > 0
            ? (metrics.reduce((sum, m) => sum + m.successfulAnalyses, 0) / totalAnalyses) * 100
            : 0;
        return {
            period: 'last_30_days',
            totalRequests,
            totalAnalyses,
            successRate: Math.round(successRate),
            averageResponseTime: Math.round(metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / (metrics.length || 1)),
            topEndpoints: metrics.length > 0 ? metrics[metrics.length - 1].topEndpoints : [],
            billing,
            trends: {
                requestsUp: totalRequests > 1000,
                analysesUp: totalAnalyses > 100,
                successRateUp: successRate > 95
            }
        };
    }
}
// Export singleton instance
export const analyticsDashboard = new AnalyticsDashboard();
export default AnalyticsDashboard;
