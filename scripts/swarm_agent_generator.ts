import fs from 'fs/promises';
import path from 'path';
import { getRedisValue, setRedisValue } from './swarm_redis.js';
import { emitSwarmTelemetry } from './swarm_telemetry.js';

const AGENT_REGISTRY = path.resolve(process.cwd(), 'swarm/agent_registry.json');
const MAX_AGENTS_PER_DAY = 2;

interface AgentRecord {
  name: string;
  workflow: string;
  capabilities: string[];
  created_at: string;
}

async function loadRegistry(): Promise<AgentRecord[]> {
  const raw = await fs.readFile(AGENT_REGISTRY, 'utf8').catch(() => '[]');
  return JSON.parse(raw) as AgentRecord[];
}

async function saveRegistry(records: AgentRecord[]): Promise<void> {
  await fs.writeFile(AGENT_REGISTRY, JSON.stringify(records, null, 2));
}

async function canCreateAgentToday(): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const counter = (await getRedisValue<{ date: string; count: number }>('appforge:agent_creation_counter')) || {
    date: today,
    count: 0
  };

  if (counter.date !== today) {
    await setRedisValue('appforge:agent_creation_counter', { date: today, count: 0 });
    return true;
  }

  return counter.count < MAX_AGENTS_PER_DAY;
}

async function incrementAgentCounter(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const counter = (await getRedisValue<{ date: string; count: number }>('appforge:agent_creation_counter')) || {
    date: today,
    count: 0
  };

  const next = counter.date === today ? counter.count + 1 : 1;
  await setRedisValue('appforge:agent_creation_counter', { date: today, count: next });
}

export async function generateAgent(capability: string): Promise<AgentRecord | null> {
  const allowed = await canCreateAgentToday();
  if (!allowed) {
    return null;
  }

  const name = capability.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const workflowFile = `.github/workflows/agent_${name}.yml`;

  const workflowBody = `name: Agent ${capability}\n\non:\n  workflow_dispatch:\n\njobs:\n  run-agent:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Execute ${capability}\n        run: echo \"Running auto-generated agent for ${capability}\"\n`;

  await fs.writeFile(workflowFile, workflowBody);

  const registry = await loadRegistry();
  const record: AgentRecord = {
    name: `agent_${name}`,
    workflow: workflowFile,
    capabilities: [capability],
    created_at: new Date().toISOString()
  };

  registry.push(record);
  await saveRegistry(registry);
  await incrementAgentCounter();

  await emitSwarmTelemetry({
    event: 'agent_created',
    timestamp: new Date().toISOString(),
    agent: record.name,
    capability
  });

  return record;
}
