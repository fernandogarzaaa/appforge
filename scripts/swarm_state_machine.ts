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

export const validTransitions: Record<SwarmSystemState, SwarmSystemState[]> = {
  IDLE: ['AUTONOMOUS_SWARM'],
  AUTONOMOUS_SWARM: ['BENCHMARK'],
  BENCHMARK: ['EVOLUTION'],
  EVOLUTION: ['QA'],
  QA: ['IDLE'],
  CURIOSITY: ['AUTONOMOUS_SWARM']
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

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  return { url, token };
}

async function getRedisValue(key: string): Promise<string | null> {
  const config = getRedisConfig();
  if (!config) {
    return null;
  }

  const response = await fetch(`${config.url}/get/${key}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Redis GET failed (${response.status}) for key ${key}`);
  }

  const payload = await response.json();
  return payload?.result ?? null;
}

async function setRedisValue(key: string, value: unknown): Promise<void> {
  const config = getRedisConfig();
  if (!config) {
    return;
  }

  const serialized = JSON.stringify(value);
  const response = await fetch(`${config.url}/set/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`
    },
    body: serialized
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Redis SET failed (${response.status}) for key ${key}: ${details}`);
  }
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
    last_workflow: ''
  };
}

export async function readSwarmState(runId = 'local'): Promise<{ record: SwarmStateRecord; wasReset: boolean }> {
  try {
    const raw = await getRedisValue(SWARM_STATE_KEY);
    if (!raw) {
      return { record: getDefaultSwarmState(runId), wasReset: false };
    }

    const parsed = JSON.parse(raw) as SwarmStateRecord;
    if (!parsed?.state || !isValidState(parsed.state)) {
      const resetRecord = getDefaultSwarmState(runId);
      await setRedisValue(SWARM_STATE_KEY, resetRecord);
      return { record: resetRecord, wasReset: true };
    }

    return { record: parsed, wasReset: false };
  } catch {
    return { record: getDefaultSwarmState(runId), wasReset: false };
  }
}

export async function readSwarmMeta(): Promise<SwarmStateMeta> {
  try {
    const raw = await getRedisValue(SWARM_META_KEY);
    if (!raw) {
      return getDefaultSwarmMeta();
    }

    const parsed = JSON.parse(raw) as SwarmStateMeta;
    if (!Number.isFinite(parsed?.chain_length) || typeof parsed?.last_workflow !== 'string') {
      return getDefaultSwarmMeta();
    }

    return parsed;
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
    const resetRecord = getDefaultSwarmState(runId);
    const resetMeta = getDefaultSwarmMeta();
    await persistSwarmState(resetRecord);
    await persistSwarmMeta(resetMeta);
    return { record: resetRecord, meta: resetMeta, status: 'rejected' };
  }

  const updatedMeta: SwarmStateMeta = {
    chain_length: nextState === 'IDLE' ? 0 : meta.chain_length + 1,
    last_workflow: workflowName
  };

  const updatedRecord: SwarmStateRecord = {
    state: nextState,
    updated_at: new Date().toISOString(),
    run_id: runId
  };

  if (updatedMeta.chain_length > MAX_CHAIN_LENGTH && !forceOverride) {
    const resetRecord = getDefaultSwarmState(runId);
    const resetMeta = getDefaultSwarmMeta();
    await persistSwarmState(resetRecord);
    await persistSwarmMeta(resetMeta);
    return { record: resetRecord, meta: resetMeta, status: 'rejected' };
  }

  await persistSwarmState(updatedRecord);
  await persistSwarmMeta(updatedMeta);

  return {
    record: updatedRecord,
    meta: updatedMeta,
    telemetry: buildTransitionTelemetry(record.state, nextState, runId),
    status: 'updated'
  };
}

export function canDispatchAction(options: {
  currentState: SwarmSystemState;
  requestedAction: string;
  lastWorkflow: string;
  forceOverride?: boolean;
}): { allowed: boolean; reason: string } {
  const { currentState, requestedAction, lastWorkflow, forceOverride = false } = options;
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
  if (!forceOverride && workflowName && lastWorkflow === workflowName) {
    return {
      allowed: false,
      reason: `Consecutive workflow blocked for '${workflowName}'`
    };
  }

  return { allowed: true, reason: 'Dispatch permitted by swarm state machine' };
}

export { MAX_CHAIN_LENGTH, SWARM_STATE_KEY };
