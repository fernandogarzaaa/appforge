import { setRedisValue } from './swarm_redis.js';
import { emitSwarmTelemetry } from './swarm_telemetry.js';

export type SwarmGoal =
  | 'improve_code_quality'
  | 'increase_benchmark_score'
  | 'fix_failing_tests'
  | 'explore_new_features'
  | 'optimize_performance';

const SWARM_GOAL_KEY = 'appforge:swarm_goal';

export function selectGoal(options: {
  testsFailing: boolean;
  benchmarkRegression: boolean;
  idle: boolean;
  perfIssues?: boolean;
}): SwarmGoal {
  if (options.testsFailing) {
    return 'fix_failing_tests';
  }

  if (options.benchmarkRegression) {
    return 'increase_benchmark_score';
  }

  if (options.perfIssues) {
    return 'optimize_performance';
  }

  if (options.idle) {
    return 'explore_new_features';
  }

  return 'improve_code_quality';
}

export async function persistSwarmGoal(goal: SwarmGoal, reason: string): Promise<void> {
  await setRedisValue(SWARM_GOAL_KEY, {
    goal,
    reason,
    selected_at: new Date().toISOString()
  });

  await emitSwarmTelemetry({
    event: 'swarm_goal_selected',
    timestamp: new Date().toISOString(),
    goal,
    reason
  });
}

export function goalToAction(goal: SwarmGoal): string {
  switch (goal) {
    case 'fix_failing_tests':
      return 'autonomous_swarm';
    case 'increase_benchmark_score':
      return 'evolution_benchmark';
    case 'optimize_performance':
      return 'quantum_evolution';
    case 'explore_new_features':
      return 'curiosity_scan';
    case 'improve_code_quality':
    default:
      return 'frontend_qa_swarm';
  }
}
