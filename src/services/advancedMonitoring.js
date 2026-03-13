const METRICS_KEY = 'advanced_metrics_v1';
const ALERTS_KEY = 'alert_policies_v1';
const load = (key, fallback) => {
    if (typeof window === 'undefined')
        return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch (error) {
        return fallback;
    }
};
const save = (key, value) => {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem(key, JSON.stringify(value));
};
const toPrometheus = (metric) => {
    const labelString = metric.labels
        ? `{${Object.entries(metric.labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',')}}`
        : '';
    const timestamp = metric.timestamp ? ` ${metric.timestamp}` : '';
    return `${metric.name}${labelString} ${metric.value}${timestamp}`;
};
export const AdvancedMonitoringService = {
    registerMetric(metric) {
        const metrics = load(METRICS_KEY, []);
        metrics.push({ ...metric, timestamp: metric.timestamp || Date.now() });
        save(METRICS_KEY, metrics);
    },
    listMetrics() {
        return load(METRICS_KEY, []);
    },
    exportPrometheus() {
        const metrics = load(METRICS_KEY, []);
        return metrics.map(toPrometheus).join('\n');
    },
    createAlertPolicy(input) {
        const policies = load(ALERTS_KEY, []);
        const policy = { ...input, id: `alert_${Date.now()}` };
        policies.push(policy);
        save(ALERTS_KEY, policies);
        return policy;
    },
    listAlertPolicies() {
        return load(ALERTS_KEY, []);
    },
    grafanaDashboardTemplate() {
        return {
            title: 'AppForge Advanced Monitoring',
            panels: [
                { title: 'Latency (p95)', type: 'timeseries', metric: 'app_latency_p95' },
                { title: 'Error Rate', type: 'timeseries', metric: 'app_error_rate' },
                { title: 'Quantum Success Rate', type: 'gauge', metric: 'quantum_success_rate' },
                { title: 'AI Accuracy', type: 'gauge', metric: 'ai_accuracy' },
            ],
        };
    },
};
