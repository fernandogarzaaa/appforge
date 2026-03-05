import fs from 'fs/promises';
import path from 'path';
import type { AgentRegistry, CapabilityGapProposal, RegistryAgent } from './swarm_capability_analyzer.js';
import { readAgentRegistry } from './swarm_capability_analyzer.js';

export interface AgentCreationResult {
    created: boolean;
    agent?: RegistryAgent;
    workflowPath?: string;
    telemetry?: AgentCreatedTelemetry;
    reason?: string;
}

interface AgentCreationLogEntry {
    capability: string;
    agent: string;
    timestamp: string;
}

export interface AgentCreatedTelemetry {
    event: 'agent_created';
    agent: string;
    reason: string;
    timestamp: string;
}

const REGISTRY_PATH = path.resolve(process.cwd(), 'swarm/agent_registry.json');
const CREATION_LOG_PATH = path.resolve(process.cwd(), 'swarm/data/agent_creation_log.json');
const TELEMETRY_LOG_PATH = path.resolve(process.cwd(), 'swarm/data/agent_telemetry_events.jsonl');

const MAX_NEW_AGENTS_PER_DAY = 2;

function slugifyName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

async function readCreationLog(): Promise<AgentCreationLogEntry[]> {
    try {
        const raw = await fs.readFile(CREATION_LOG_PATH, 'utf8');
        const parsed = JSON.parse(raw) as AgentCreationLogEntry[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function writeCreationLog(entries: AgentCreationLogEntry[]): Promise<void> {
    await fs.mkdir(path.dirname(CREATION_LOG_PATH), { recursive: true });
    await fs.writeFile(CREATION_LOG_PATH, JSON.stringify(entries, null, 2));
}

function createdToday(entries: AgentCreationLogEntry[]): number {
    const today = new Date().toISOString().slice(0, 10);
    return entries.filter((entry) => entry.timestamp.slice(0, 10) === today).length;
}

async function writeRegistry(registry: AgentRegistry): Promise<void> {
    await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export function buildGeneratedWorkflow(agent: RegistryAgent): string {
    const workflowFileHint = `agent_${slugifyName(agent.name)}`;

    return `name: ${agent.name}\n\n` +
        `on:\n` +
        `  workflow_dispatch:\n` +
        `  schedule:\n` +
        `    - cron: \"15 */6 * * *\"\n\n` +
        `jobs:\n` +
        `  run-agent:\n` +
        `    runs-on: ubuntu-latest\n` +
        `    timeout-minutes: 20\n` +
        `    steps:\n` +
        `      - name: Checkout repository\n` +
        `        uses: actions/checkout@v4\n\n` +
        `      - name: Setup Node.js\n` +
        `        uses: actions/setup-node@v4\n` +
        `        with:\n` +
        `          node-version: \"22\"\n` +
        `          cache: npm\n\n` +
        `      - name: Install dependencies\n` +
        `        run: npm ci --legacy-peer-deps\n\n` +
        `      - name: Analyze repository state\n` +
        `        run: npx tsx scripts/ci_manager.ts REPORT\n\n` +
        `      - name: Run specialized agent task\n` +
        `        run: npx tsx scripts/real_swarm_executor.ts \"${agent.name}\"\n\n` +
        `      - name: Upload artifacts\n` +
        `        uses: actions/upload-artifact@v4\n` +
        `        with:\n` +
        `          name: ${workflowFileHint}_output.json\n` +
        `          path: agent_outputs/**/*.json\n`;
}

async function appendTelemetryEvent(event: AgentCreatedTelemetry): Promise<void> {
    await fs.mkdir(path.dirname(TELEMETRY_LOG_PATH), { recursive: true });
    await fs.appendFile(TELEMETRY_LOG_PATH, `${JSON.stringify(event)}\n`);

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        return;
    }

    const endpoint = `${redisUrl}/lpush/appforge:telemetry:events/${encodeURIComponent(JSON.stringify(event))}`;
    try {
        await fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${redisToken}` }
        });
    } catch {
        // best-effort telemetry emission
    }
}

export async function generateAndRegisterAgent(proposal: CapabilityGapProposal): Promise<AgentCreationResult> {
    const registry = await readAgentRegistry();
    const creationLog = await readCreationLog();

    if (createdToday(creationLog) >= MAX_NEW_AGENTS_PER_DAY) {
        return { created: false, reason: 'Daily new-agent limit reached (2).' };
    }

    const capabilityExists = registry.agents.some((agent) => (agent.capabilities || []).includes(proposal.missing_capability));
    if (capabilityExists) {
        return { created: false, reason: `Capability already registered: ${proposal.missing_capability}` };
    }

    const workflowBasename = `agent_${slugifyName(proposal.proposed_agent)}.yml`;
    const workflowPath = path.resolve(process.cwd(), '.github/workflows', workflowBasename);

    const workflowExists = await fs.stat(workflowPath).then(() => true).catch(() => false);
    if (workflowExists) {
        return { created: false, reason: `Workflow already exists: ${workflowBasename}` };
    }

    const agent: RegistryAgent = {
        name: proposal.proposed_agent,
        purpose: `Autogenerated agent for ${proposal.missing_capability}`,
        workflow: proposal.proposed_agent,
        capabilities: [proposal.missing_capability]
    };

    await fs.mkdir(path.dirname(workflowPath), { recursive: true });
    await fs.writeFile(workflowPath, buildGeneratedWorkflow(agent));

    registry.agents.push(agent);
    await writeRegistry(registry);

    const timestamp = new Date().toISOString();
    creationLog.push({
        capability: proposal.missing_capability,
        agent: proposal.proposed_agent,
        timestamp
    });
    await writeCreationLog(creationLog);

    const telemetry: AgentCreatedTelemetry = {
        event: 'agent_created',
        agent: proposal.proposed_agent,
        reason: proposal.reason,
        timestamp
    };
    await appendTelemetryEvent(telemetry);

    return { created: true, agent, workflowPath, telemetry };
}
