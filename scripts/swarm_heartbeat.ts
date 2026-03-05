import { sovereignStorage } from '../swarm/core/storage.js';
import { readSwarmMeta, readSwarmState } from './swarm_state_machine.js';

const HEARTBEAT_KEY = 'appforge:swarm_heartbeat';
const MIN_ACTION_INTERVAL_MS = 10 * 60 * 1000;
const MAX_CYCLES_PER_HOUR = 4;
const MAX_IDENTICAL_ACTIONS = 2;
const INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000;

interface SwarmState {
  last_updated: string;
  ci: { status: string; last_green_sha?: string; last_fail_reason?: string; build_duration?: string };
  curiosity: { findings: any[]; last_scan: string };
  evolution: { last_score: number; trend: string; greenlit: boolean };
  frontend_qa: { status: string; failures: any[] };
  swarm: { last_commit_sha: string; last_task: string; status: string };
  orchestrator: { next_action: string; reason: string };
}

interface HeartbeatState {
  last_run: string;
  last_action: string;
  status: 'idle' | 'action_triggered';
  last_benchmark_score?: number;
  action_timestamps?: string[];
  recent_actions?: string[];
}

export interface HeartbeatDecision {
  action: 'frontend_qa_swarm' | 'quantum_evolution' | 'curiosity_scan' | 'idle';
  reason: string;
  telemetryEvents: Array<'swarm_heartbeat' | 'swarm_idle' | 'swarm_action_triggered'>;
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function getRedisValue(key: string): Promise<string | null> {
  const config = getRedisConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/get/${key}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${config.token}` }
  });

  if (!response.ok) {
    throw new Error(`Redis GET failed (${response.status}) for key ${key}`);
  }

  const payload = await response.json();
  return payload?.result ?? null;
}

async function setRedisValue(key: string, value: unknown): Promise<void> {
  const config = getRedisConfig();
  if (!config) return;

  const response = await fetch(`${config.url}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}` },
    body: JSON.stringify(value)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Redis SET failed (${response.status}) for key ${key}: ${details}`);
  }
}

function emitTelemetry(event: 'swarm_heartbeat' | 'swarm_idle' | 'swarm_action_triggered', data: Record<string, unknown>) {
  console.log(JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }));
}

async function readHeartbeatState(): Promise<HeartbeatState> {
  try {
    const raw = await getRedisValue(HEARTBEAT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HeartbeatState;
      return {
        last_run: parsed.last_run || new Date(0).toISOString(),
        last_action: parsed.last_action || 'none',
        status: parsed.status || 'idle',
        last_benchmark_score: parsed.last_benchmark_score,
        action_timestamps: parsed.action_timestamps || [],
        recent_actions: parsed.recent_actions || []
      };
    }
  } catch (error) {
    console.warn('⚠️ [Swarm Heartbeat] Failed to read Redis heartbeat state, continuing with defaults.', error);
  }

  return {
    last_run: new Date(0).toISOString(),
    last_action: 'none',
    status: 'idle',
    action_timestamps: [],
    recent_actions: []
  };
}

async function persistHeartbeatState(state: HeartbeatState): Promise<void> {
  try {
    await setRedisValue(HEARTBEAT_KEY, state);
  } catch (error) {
    console.warn('⚠️ [Swarm Heartbeat] Failed to persist Redis heartbeat state.', error);
  }
}

export async function evaluateSwarmHeartbeat(): Promise<HeartbeatDecision> {
  const now = Date.now();
  const wrapper = await sovereignStorage.load();
  const state = (wrapper?.state || {}) as Partial<SwarmState>;
  const heartbeat = await readHeartbeatState();
  const { record } = await readSwarmState();
  const swarmMeta = await readSwarmMeta();

  const decision: HeartbeatDecision = {
    action: 'idle',
    reason: 'system stable',
    telemetryEvents: ['swarm_heartbeat']
  };

  const ciFailed = state.ci?.status === 'fail' || state.frontend_qa?.status === 'fail';
  const benchmarkDropped =
    state.evolution?.trend === 'down' ||
    (typeof heartbeat.last_benchmark_score === 'number' && typeof state.evolution?.last_score === 'number'
      ? state.evolution.last_score < heartbeat.last_benchmark_score
      : false);

  const lastActivityIso = state.last_updated || record.updated_at;
  const inactivityMs = Math.max(0, now - Date.parse(lastActivityIso || new Date(0).toISOString()));
  const noActivity = inactivityMs >= INACTIVITY_THRESHOLD_MS;

  if (ciFailed) {
    decision.action = 'frontend_qa_swarm';
    decision.reason = 'failing tests detected';
  } else if (benchmarkDropped) {
    decision.action = 'quantum_evolution';
    decision.reason = 'benchmark regression detected';
  } else if (noActivity) {
    decision.action = 'curiosity_scan';
    decision.reason = 'no recent activity detected';
  }

  const recentActionTimes = (heartbeat.action_timestamps || [])
    .map((ts) => Date.parse(ts))
    .filter((ts) => Number.isFinite(ts))
    .filter((ts) => now - ts <= 60 * 60 * 1000);

  const recentActions = [...(heartbeat.recent_actions || [])];
  const lastActionEpoch = Date.parse(heartbeat.last_run || new Date(0).toISOString());

  if (decision.action !== 'idle') {
    if (Number.isFinite(lastActionEpoch) && now - lastActionEpoch < MIN_ACTION_INTERVAL_MS) {
      decision.action = 'idle';
      decision.reason = 'minimum action interval active (10 minutes)';
    } else if (recentActionTimes.length >= MAX_CYCLES_PER_HOUR) {
      decision.action = 'idle';
      decision.reason = 'maximum swarm cycles per hour reached (4)';
    } else {
      const lastTwo = recentActions.slice(-2);
      if (lastTwo.length === MAX_IDENTICAL_ACTIONS && lastTwo.every((a) => a === decision.action)) {
        decision.action = 'idle';
        decision.reason = 'identical workflow repetition guard triggered';
      }
    }
  }

  if (swarmMeta.last_workflow) {
    const recentWorkflow = swarmMeta.last_workflow;
    emitTelemetry('swarm_heartbeat', {
      current_state: record.state,
      recent_workflow: recentWorkflow,
      chain_length: swarmMeta.chain_length
    });
  } else {
    emitTelemetry('swarm_heartbeat', { current_state: record.state, chain_length: swarmMeta.chain_length });
  }

  if (decision.action === 'idle') {
    decision.telemetryEvents.push('swarm_idle');
    emitTelemetry('swarm_idle', { reason: decision.reason });
  } else {
    decision.telemetryEvents.push('swarm_action_triggered');
    emitTelemetry('swarm_action_triggered', { action: decision.action, reason: decision.reason });
    recentActionTimes.push(now);
    recentActions.push(decision.action);
  }

  const nextHeartbeatState: HeartbeatState = {
    last_run: new Date(now).toISOString(),
    last_action: decision.action === 'idle' ? heartbeat.last_action : decision.action,
    status: decision.action === 'idle' ? 'idle' : 'action_triggered',
    last_benchmark_score: state.evolution?.last_score ?? heartbeat.last_benchmark_score,
    action_timestamps: recentActionTimes.map((ts) => new Date(ts).toISOString()),
    recent_actions: recentActions.slice(-8)
  };

  await persistHeartbeatState(nextHeartbeatState);
  return decision;
}

async function run() {
  const decision = await evaluateSwarmHeartbeat();
  console.log(JSON.stringify({ action: decision.action, reason: decision.reason }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error('❌ [Swarm Heartbeat] Fatal error', error);
    process.exit(1);
  });
}
