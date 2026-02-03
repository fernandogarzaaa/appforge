type MetricSample = {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
};

type AlertPolicy = {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  runbookUrl?: string;
};

const METRICS_KEY = 'advanced_metrics_v1';
const ALERTS_KEY = 'alert_policies_v1';

const load = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    return fallback;
  }
};

const save = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const toPrometheus = (metric: MetricSample) => {
  const labelString = metric.labels
    ? `{${Object.entries(metric.labels)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',')}}`
    : '';
  const timestamp = metric.timestamp ? ` ${metric.timestamp}` : '';
  return `${metric.name}${labelString} ${metric.value}${timestamp}`;
};

export const AdvancedMonitoringService = {
  registerMetric(metric: MetricSample) {
    const metrics = load<MetricSample[]>(METRICS_KEY, []);
    metrics.push({ ...metric, timestamp: metric.timestamp || Date.now() });
    save(METRICS_KEY, metrics);
  },

  listMetrics() {
    return load<MetricSample[]>(METRICS_KEY, []);
  },

  exportPrometheus() {
    const metrics = load<MetricSample[]>(METRICS_KEY, []);
    return metrics.map(toPrometheus).join('\n');
  },

  createAlertPolicy(input: Omit<AlertPolicy, 'id'>) {
    const policies = load<AlertPolicy[]>(ALERTS_KEY, []);
    const policy: AlertPolicy = { ...input, id: `alert_${Date.now()}` };
    policies.push(policy);
    save(ALERTS_KEY, policies);
    return policy;
  },

  listAlertPolicies() {
    return load<AlertPolicy[]>(ALERTS_KEY, []);
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
