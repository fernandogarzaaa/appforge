# Swarm Node Runtime

Swarm Node is a persistent control-plane worker that executes swarm agents outside GitHub Actions.

## Responsibilities

- Poll command queue: `appforge:swarm_commands`
- Execute agents in a long-running process
- Emit telemetry events to `appforge:swarm_telemetry`
- Persist execution results to `runtime/swarm_node/results/`
- Optionally commit result artifacts back to the repository

## Environment

Required:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional:

- `SWARM_COMMAND_QUEUE` (default: `appforge:swarm_commands`)
- `SWARM_TELEMETRY_QUEUE` (default: `appforge:swarm_telemetry`)
- `SWARM_STATE_KEY` (default: `appforge:swarm_node:state`)
- `SWARM_NODE_MAX_CONCURRENT_AGENTS` (default: `2`)
- `SWARM_NODE_RETRY_LIMIT` (default: `2`)
- `SWARM_NODE_POLL_INTERVAL_MS` (default: `1500`)
- `SWARM_NODE_AUTO_COMMIT=true` to auto-commit result files

## Command schema

```json
{
  "command": "run_agent",
  "agent": "autonomous_swarm",
  "run_id": "12345",
  "payload": {}
}
```

## Telemetry events

- `swarm_command_received`
- `agent_started`
- `agent_completed`
- `agent_failed`

Additional runtime telemetry is also emitted for retries and persistence.

## Run locally

```bash
npm run swarm:node
```
