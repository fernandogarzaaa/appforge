import type { DetectedSignal, SignalType } from './swarm_signal_detector.ts';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface SwarmTask {
  id: string;
  signal: SignalType;
  description: string;
  priority: number;
  severity: number;
  signal_count: number;
  signal_details: string;
  urgency_score: number;
  retries: number;
  status: TaskStatus;
  failed_strategies: string[];
  created_at: string;
  updated_at: string;
}

const TASK_MAP: Record<SignalType, { description: string; priority: number; category_weight: number }> = {
  ci_failure: { description: 'repair CI pipeline', priority: 1, category_weight: 10 },
  failing_tests: { description: 'fix failing tests', priority: 1, category_weight: 9 },
  benchmark_regression: { description: 'optimize performance', priority: 2, category_weight: 7 },
  outdated_dependencies: { description: 'update dependencies', priority: 2, category_weight: 6 },
  missing_tests: { description: 'add missing tests', priority: 3, category_weight: 4 },
  low_code_coverage: { description: 'improve code coverage', priority: 3, category_weight: 5 }
};

interface AggregatedSignal {
  type: SignalType;
  severity: number;
  count: number;
  details: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function summarizeDetails(details: string[]): string {
  if (details.length === 0) {
    return 'No additional details provided.';
  }

  const normalized = details
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 3);

  return normalized.join(' | ').slice(0, 280);
}

function aggregateSignals(signals: DetectedSignal[]): AggregatedSignal[] {
  const byType = new Map<SignalType, AggregatedSignal>();

  for (const signal of signals) {
    const existing = byType.get(signal.type);
    if (!existing) {
      byType.set(signal.type, {
        type: signal.type,
        severity: signal.severity,
        count: 1,
        details: [signal.details]
      });
      continue;
    }

    existing.count += 1;
    existing.severity = Math.min(existing.severity, signal.severity);
    existing.details.push(signal.details);
  }

  return Array.from(byType.values());
}

function computeUrgency(signal: AggregatedSignal): number {
  const mapped = TASK_MAP[signal.type];
  const severityWeight = (6 - clamp(signal.severity, 1, 5)) * 12;
  const priorityWeight = (6 - mapped.priority) * 8;
  const repeatWeight = Math.min(signal.count, 4) * 5;
  return severityWeight + priorityWeight + mapped.category_weight + repeatWeight;
}

export function generateTasksFromSignals(signals: DetectedSignal[], maxTasks = 5): SwarmTask[] {
  const now = new Date().toISOString();
  const timestamp = Date.now();
  const aggregated = aggregateSignals(signals)
    .map((signal) => ({
      signal,
      urgency: computeUrgency(signal)
    }))
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, Math.max(1, maxTasks));

  return aggregated.map(({ signal, urgency }, index) => {
    const mapped = TASK_MAP[signal.type];
    const priority = clamp(Math.min(mapped.priority, signal.severity) - (signal.count > 1 ? 1 : 0), 1, 5);
    const signalDetails = summarizeDetails(signal.details);

    return {
      id: `task_${timestamp}_${signal.type}_${index + 1}`,
      signal: signal.type,
      description: `${mapped.description}: ${signalDetails}`,
      priority,
      severity: signal.severity,
      signal_count: signal.count,
      signal_details: signalDetails,
      urgency_score: urgency,
      retries: 0,
      status: 'pending',
      failed_strategies: [],
      created_at: now,
      updated_at: now
    };
  });
}
