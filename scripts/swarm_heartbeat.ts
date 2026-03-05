import fs from 'fs/promises';
import { getRedisValue, setRedisValue } from './swarm_redis.js';
import { emitSwarmTelemetry } from './swarm_telemetry.js';

export type HeartbeatDecision =
  | 'idle'
  | 'trigger_autonomous_swarm'
  | 'trigger_evolution'
  | 'trigger_qa'
  | 'trigger_curiosity';

const HEARTBEAT_KEY = 'appforge:swarm_heartbeat';
const LAST_ACTION_KEY = 'appforge:last_swarm_action';
const SAFETY_KEY = 'appforge:swarm_safety';
const MIN_SWARM_ACTION_INTERVAL_MS = 10 * 60 * 1000;
const MAX_SWARM_CYCLES_PER_HOUR = 4;

interface HeartbeatContext {
  failingTests: boolean;
  benchmarkRegression: boolean;
  hasRecentCommit: boolean;
  telemetrySpike: boolean;
  recentlyActed: boolean;
}

async function readRecentCommits(): Promise<boolean> {
  try {
    const commitLog = await fs.readFile('gh_runs.txt', 'utf8');
    return commitLog.trim().length > 0;
  } catch {
    return false;
  }
}

async function readFailingTests(): Promise<boolean> {
  try {
    const failed = await fs.readFile('failed.txt', 'utf8');
    return failed.trim().length > 0;
  } catch {
    return false;
  }
}

async function readBenchmarkRegression(): Promise<boolean> {
  try {
    const benchmarkRaw = await fs.readFile('swarm/benchmark_results.json', 'utf8');
    const benchmark = JSON.parse(benchmarkRaw);
    return benchmark?.regression === true || Number(benchmark?.score_delta || 0) < 0;
  } catch {
    return false;
  }
}

async function readTelemetrySpike(): Promise<boolean> {
  const events = await getRedisValue<any[]>('appforge:swarm_telemetry');
  if (!events || events.length < 20) {
    return false;
  }
  const recent = events.slice(-20);
  return recent.length >= 10;
}

async function canActNow(now: number): Promise<boolean> {
  const lastAction = await getRedisValue<{ timestamp?: string }>(LAST_ACTION_KEY);
  const safety = (await getRedisValue<{ hour_window_start?: string; cycles_this_hour?: number }>(SAFETY_KEY)) || {
    cycles_this_hour: 0
  };

  const lastActionTs = lastAction?.timestamp ? new Date(lastAction.timestamp).getTime() : 0;
  if (lastActionTs && now - lastActionTs < MIN_SWARM_ACTION_INTERVAL_MS) {
    return false;
  }

  const windowStart = safety.hour_window_start ? new Date(safety.hour_window_start).getTime() : 0;
  const isNewWindow = !windowStart || now - windowStart >= 60 * 60 * 1000;

  const cyclesThisHour = isNewWindow ? 0 : safety.cycles_this_hour || 0;
  if (cyclesThisHour >= MAX_SWARM_CYCLES_PER_HOUR) {
    return false;
  }

  return true;
}

export async function evaluateSwarmHeartbeat(): Promise<HeartbeatDecision> {
  const now = Date.now();
  const context: HeartbeatContext = {
    failingTests: await readFailingTests(),
    benchmarkRegression: await readBenchmarkRegression(),
    hasRecentCommit: await readRecentCommits(),
    telemetrySpike: await readTelemetrySpike(),
    recentlyActed: !(await canActNow(now))
  };

  let decision: HeartbeatDecision = 'idle';

  if (context.recentlyActed) {
    decision = 'idle';
  } else if (context.failingTests) {
    decision = 'trigger_autonomous_swarm';
  } else if (context.benchmarkRegression) {
    decision = 'trigger_evolution';
  } else if (context.telemetrySpike) {
    decision = 'trigger_qa';
  } else if (context.hasRecentCommit) {
    decision = 'trigger_curiosity';
  }

  const heartbeat = {
    timestamp: new Date(now).toISOString(),
    decision,
    context
  };

  await setRedisValue(HEARTBEAT_KEY, heartbeat);
  await emitSwarmTelemetry({
    event: 'swarm_heartbeat',
    timestamp: heartbeat.timestamp,
    decision,
    context
  });

  return decision;
}
