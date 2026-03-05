import { appendRedisList } from './swarm_redis.js';

const TELEMETRY_KEY = 'appforge:swarm_telemetry';

export interface SwarmTelemetryEvent {
  event:
    | 'swarm_heartbeat'
    | 'swarm_goal_selected'
    | 'swarm_state_transition'
    | 'strategy_selected'
    | 'strategy_success'
    | 'strategy_failure'
    | 'agent_created'
    | 'agent_started'
    | 'agent_completed';
  timestamp: string;
  [key: string]: unknown;
}

export async function emitSwarmTelemetry(event: SwarmTelemetryEvent): Promise<void> {
  await appendRedisList(TELEMETRY_KEY, event);
  console.log(JSON.stringify(event));
}
