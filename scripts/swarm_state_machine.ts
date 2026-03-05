import { emitSwarmTelemetry } from './swarm_telemetry.js';
import { getRedisValue, setRedisValue } from './swarm_redis.js';

export type SwarmSystemState =
  | 'IDLE'
  | 'AUTONOMOUS_SWARM'
  | 'EVOLUTION'
  | 'BENCHMARK'
  | 'QA'
  | 'CURIOSITY';

export interface SwarmStateRecord {
  state: SwarmSystemState;
  updated_at: string;
  run_id: string;
}

export interface SwarmStateMeta {
  chain_length: number;
  last_workflow: string;
  same_workflow_streak: number;
}

export interface SwarmTransitionTelemetry {
  event: 'swarm_state_transition';
  from: SwarmSystemState;
  to: SwarmSystemState;
  run_id: string;
  timestamp: string;
}

const SWARM_STATE_KEY = 'appforge:swarm_state';
const SWARM_META_KEY = 'appforge:swarm_state_meta';
const MAX_CHAIN_LENGTH = 10;
const MAX_SAME_WORKFLOW_STREAK = 2;

export const validTransitions: Record<SwarmSystemState, SwarmSystemState[]> = {
  IDLE: ['AUTONOMOUS_SWARM', 'CURIOSITY'],
  AUTONOMOUS_SWARM: ['BENCHMARK', 'QA'],
  BENCHMARK: ['EVOLUTION', 'QA'],
  EVOLUTION: ['QA', 'IDLE'],
  QA: ['IDLE', 'AUTONOMOUS_SWARM'],
  CURIOSITY: ['AUTONOMOUS_SWARM', 'IDLE']
};

export const workflowToState: Record<string, SwarmSystemState> = {
  'Autonomous Swarm Cycle': 'AUTONOMOUS_SWARM',
  'Evolution Benchmark Gate': 'BENCHMARK',
  'Quantum Self-Evolution': 'EVOLUTION',
  'Frontend QA Swarm': 'QA',
  'Curiosity Engine Scan': 'CURIOSITY',
  'Iron Brain CI — Ghost Brain': 'IDLE'
};

export const actionToState: Record<string, SwarmSystemState> = {
  autonomous_swarm: 'AUTONOMOUS_SWARM',
  evolution_benchmark: 'BENCHMARK',
  quantum_evolution: 'EVOLUTION',
  frontend_qa_swarm: 'QA',
  curiosity_scan: 'CURIOSITY'
};

export const stateToAction: Record<SwarmSystemState, string> = {
  IDLE: 'none',
  AUTONOMOUS_SWARM: 'autonomous_swarm',
  BENCHMARK: 'evolution_benchmark',
  EVOLUTION: 'quantum_evolution',
  QA: 'frontend_qa_swarm',
  CURIOSITY: 'curiosity_scan'
};

function isValidState(input: string): input is SwarmSystemState {
  return input in validTransitions;
}

export function getDefaultSwarmState(runId = 'local'): SwarmStateRecord {
  return {
    state: 'IDLE',
    updated_at: new Date().toISOString(),
    run_id: runId
  };
}

export function getDefaultSwarmMeta(): SwarmStateMeta {
  return {
    chain_length: 0,
    last_workflow: '',
    same_workflow_streak: 0
  };
}

export async function readSwarmState(runId = 'local'): Promise<{ record: SwarmStateRecord; wasReset: boolean }> {
  try {
    const parsed = await getRedisValue<SwarmStateRecord>(SWARM_STATE_KEY);
    if (!parsed?.state || !isValidState(parsed.state)) {
      const resetRecord = getDefaultSwarmState(runId);
      await setRedisValue(SWARM_STATE_KEY, resetRecord);
      return { record: resetRecord, wasReset: !!parsed };
    }

    return { record: parsed, wasReset: false };
  } catch {
    return { record: getDefaultSwarmState(runId), wasReset: false };
  }
}

export async function readSwarmMeta(): Promise<SwarmStateMeta> {
  try {
    const parsed = await getRedisValue<SwarmStateMeta>(SWARM_META_KEY);
    if (!Number.isFinite(parsed?.chain_length) || typeof parsed?.last_workflow !== 'string') {
      return getDefaultSwarmMeta();
    }

    return {
      chain_length: parsed.chain_length,
      last_workflow: parsed.last_workflow,
      same_workflow_streak: Number.isFinite(parsed.same_workflow_streak) ? parsed.same_workflow_streak : 0
    };
  } catch {
    return getDefaultSwarmMeta();
  }
}

export async function persistSwarmState(record: SwarmStateRecord): Promise<void> {
  await setRedisValue(SWARM_STATE_KEY, record);
}

export async function persistSwarmMeta(meta: SwarmStateMeta): Promise<void> {
  await setRedisValue(SWARM_META_KEY, meta);
}

export function isValidTransition(current: SwarmSystemState, next: SwarmSystemState): boolean {
  return validTransitions[current]?.includes(next) ?? false;
}

export function getAllowedNextStates(current: SwarmSystemState): SwarmSystemState[] {
  return validTransitions[current] ?? [];
}

export function buildTransitionTelemetry(from: SwarmSystemState, to: SwarmSystemState, runId: string): SwarmTransitionTelemetry {
  return {
    event: 'swarm_state_transition',
    from,
    to,
    run_id: runId,
    timestamp: new Date().toISOString()
  };
}

export async function applyWorkflowCompletion(options: {
  workflowName: string;
  runId: string;
  wasSuccessful: boolean;
  forceOverride?: boolean;
}): Promise<{ record: SwarmStateRecord; meta: SwarmStateMeta; telemetry?: SwarmTransitionTelemetry; status: 'updated' | 'ignored' | 'rejected' }> {
  const { workflowName, runId, wasSuccessful, forceOverride = false } = options;
  const { record } = await readSwarmState(runId);
  const meta = await readSwarmMeta();

  if (!wasSuccessful || !workflowToState[workflowName]) {
    return { record, meta, status: 'ignored' };
  }

  const nextState = workflowToState[workflowName];

  if (!forceOverride && !isValidTransition(record.state, nextState)) {
    return { record, meta, status: 'rejected' };
  }

  const nextStreak = meta.last_workflow === workflowName ? meta.same_workflow_streak + 1 : 1;
  if (!forceOverride && nextStreak > MAX_SAME_WORKFLOW_STREAK) {
    return { record, meta, status: 'rejected' };
  }

  const updatedMeta: SwarmStateMeta = {
    chain_length: nextState === 'IDLE' ? 0 : meta.chain_length + 1,
    last_workflow: workflowName,
    same_workflow_streak: nextStreak
  };

  if (!forceOverride && updatedMeta.chain_length > MAX_CHAIN_LENGTH) {
    return { record, meta, status: 'rejected' };
  }

  const updatedRecord: SwarmStateRecord = {
    state: nextState,
    updated_at: new Date().toISOString(),
    run_id: runId
  };

  await persistSwarmState(updatedRecord);
  await persistSwarmMeta(updatedMeta);

  const telemetry = buildTransitionTelemetry(record.state, nextState, runId);
  await emitSwarmTelemetry(telemetry);

  return {
    record: updatedRecord,
    meta: updatedMeta,
    telemetry,
    status: 'updated'
  };
}

export function canDispatchAction(options: {
  currentState: SwarmSystemState;
  requestedAction: string;
  lastWorkflow: string;
  sameWorkflowStreak?: number;
  forceOverride?: boolean;
}): { allowed: boolean; reason: string } {
  const { currentState, requestedAction, lastWorkflow, sameWorkflowStreak = 0, forceOverride = false } = options;
  const targetState = actionToState[requestedAction];

  if (!targetState) {
    return { allowed: false, reason: `No target state mapping for action '${requestedAction}'` };
  }

  if (!forceOverride && !isValidTransition(currentState, targetState)) {
    return {
      allowed: false,
      reason: `Invalid state transition ${currentState} -> ${targetState}`
    };
  }

  const workflowName = Object.entries(workflowToState).find(([, state]) => state === targetState)?.[0] ?? '';
  if (!forceOverride && workflowName && lastWorkflow === workflowName && sameWorkflowStreak >= MAX_SAME_WORKFLOW_STREAK) {
    return {
      allowed: false,
      reason: `Workflow '${workflowName}' exceeded consecutive limit (${MAX_SAME_WORKFLOW_STREAK})`
    };
  }

  return { allowed: true, reason: 'Dispatch permitted by swarm state machine' };
}

export { MAX_CHAIN_LENGTH, SWARM_STATE_KEY };
