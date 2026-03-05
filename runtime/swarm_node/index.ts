import { popRedisList } from '../../scripts/swarm_redis.js';
import { emitSwarmTelemetry } from '../../scripts/swarm_telemetry.js';

interface SwarmCommand {
  command: 'run_agent';
  agent: string;
  run_id: string;
  payload?: Record<string, unknown>;
}

const COMMAND_QUEUE_KEY = 'appforge:swarm_commands';
const POLL_INTERVAL_MS = Number(process.env.SWARM_NODE_POLL_MS || 5000);

async function executeCommand(command: SwarmCommand): Promise<void> {
  if (command.command !== 'run_agent') {
    return;
  }

  await emitSwarmTelemetry({
    event: 'agent_started',
    timestamp: new Date().toISOString(),
    agent: command.agent,
    run_id: command.run_id
  });

  console.log(`🤖 [Swarm Node] Executing agent '${command.agent}' for run ${command.run_id}`);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await emitSwarmTelemetry({
    event: 'agent_completed',
    timestamp: new Date().toISOString(),
    agent: command.agent,
    run_id: command.run_id
  });
}

async function pollLoop(): Promise<void> {
  console.log('🚀 [Swarm Node] Runtime started. Polling command queue...');

  while (true) {
    try {
      const command = await popRedisList<SwarmCommand>(COMMAND_QUEUE_KEY);
      if (command) {
        await executeCommand(command);
      }
    } catch (error) {
      console.error('❌ [Swarm Node] Polling failure:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

pollLoop();
