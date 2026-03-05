import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';

const SWARM_COMMAND_QUEUE = process.env.SWARM_COMMAND_QUEUE ?? 'appforge:swarm_commands';
const SWARM_TELEMETRY_QUEUE = process.env.SWARM_TELEMETRY_QUEUE ?? 'appforge:swarm_telemetry';
const SWARM_STATE_KEY = process.env.SWARM_STATE_KEY ?? 'appforge:swarm_node:state';
const SWARM_RESULTS_DIR = process.env.SWARM_RESULTS_DIR ?? 'runtime/swarm_node/results';
const POLL_INTERVAL_MS = Number(process.env.SWARM_NODE_POLL_INTERVAL_MS ?? 1500);
const MAX_CONCURRENT_AGENTS = Number(process.env.SWARM_NODE_MAX_CONCURRENT_AGENTS ?? 2);
const RETRY_LIMIT = Number(process.env.SWARM_NODE_RETRY_LIMIT ?? 2);
const AUTO_COMMIT_RESULTS = process.env.SWARM_NODE_AUTO_COMMIT === 'true';

interface SwarmCommand {
  command: 'run_agent';
  agent: string;
  run_id?: string;
  payload?: Record<string, unknown>;
  retry_count?: number;
  requested_at?: string;
}

interface AgentResult {
  ok: boolean;
  agent: string;
  runId: string;
  startedAt: string;
  endedAt: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: string;
  payload?: Record<string, unknown>;
}

class UpstashRestClient {
  constructor(private readonly url: string, private readonly token: string) {}

  private async call(pathname: string, body?: unknown) {
    const response = await fetch(`${this.url}${pathname}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Upstash request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async lpush(key: string, value: unknown) {
    const encoded = encodeURIComponent(typeof value === 'string' ? value : JSON.stringify(value));
    await this.call(`/lpush/${encodeURIComponent(key)}/${encoded}`);
  }

  async rpop<T>(key: string): Promise<T | null> {
    const data = await this.call(`/rpop/${encodeURIComponent(key)}`);
    return (data?.result ?? null) as T | null;
  }

  async set(key: string, value: unknown) {
    const encoded = encodeURIComponent(typeof value === 'string' ? value : JSON.stringify(value));
    await this.call(`/set/${encodeURIComponent(key)}/${encoded}`);
  }
}

const AGENT_COMMANDS: Record<string, string[]> = {
  autonomous_swarm: ['npx', 'tsx', 'scripts/run_god_swarm.ts'],
  quantum_evolution: ['npx', 'tsx', 'scripts/quantum_self_improve.js'],
  curiosity_scan: ['npx', 'tsx', 'scripts/trigger_curiosity.ts'],
  frontend_qa_swarm: ['npx', 'tsx', 'scripts/run_frontend_qa_swarm.ts'],
  evolution_benchmark: ['npx', 'tsx', 'scripts/test_quantum_orchestration.ts']
};

class SwarmNode {
  private readonly redis: UpstashRestClient;
  private activeCount = 0;
  private shuttingDown = false;

  constructor() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    }

    this.redis = new UpstashRestClient(redisUrl, redisToken);
  }

  async start() {
    await fs.mkdir(SWARM_RESULTS_DIR, { recursive: true });
    this.registerSignalHandlers();

    await this.emitTelemetry('swarm_node_started', {
      maxConcurrentAgents: MAX_CONCURRENT_AGENTS,
      retryLimit: RETRY_LIMIT,
      pollIntervalMs: POLL_INTERVAL_MS
    });

    console.log('🟢 [SwarmNode] Runtime started. Waiting for commands...');

    while (!this.shuttingDown) {
      try {
        if (this.activeCount >= MAX_CONCURRENT_AGENTS) {
          await this.sleep(250);
          continue;
        }

        const next = await this.redis.rpop<string | SwarmCommand>(SWARM_COMMAND_QUEUE);
        if (!next) {
          await this.sleep(POLL_INTERVAL_MS);
          continue;
        }

        const command = this.parseCommand(next);
        this.activeCount += 1;
        void this.executeCommand(command).finally(() => {
          this.activeCount -= 1;
        });
      } catch (error) {
        console.error('❌ [SwarmNode] Polling error:', error);
        await this.emitTelemetry('swarm_polling_failed', { error: String(error) });
        await this.sleep(POLL_INTERVAL_MS);
      }
    }
  }

  private parseCommand(raw: string | SwarmCommand): SwarmCommand {
    if (typeof raw === 'string') {
      return JSON.parse(raw) as SwarmCommand;
    }
    return raw;
  }

  private async executeCommand(command: SwarmCommand) {
    const runId = command.run_id || `run-${Date.now()}`;

    await this.emitTelemetry('swarm_command_received', {
      runId,
      command: command.command,
      agent: command.agent,
      retryCount: command.retry_count ?? 0
    });

    if (command.command !== 'run_agent') {
      await this.emitTelemetry('agent_failed', {
        runId,
        agent: command.agent,
        error: `Unsupported command ${command.command}`
      });
      return;
    }

    try {
      const result = await this.runAgentWithRetry(command, runId);
      await this.recordResult(result);

      if (result.ok) {
        await this.emitTelemetry('agent_completed', {
          runId,
          agent: command.agent,
          exitCode: result.exitCode
        });
      } else {
        await this.emitTelemetry('agent_failed', {
          runId,
          agent: command.agent,
          exitCode: result.exitCode,
          error: result.error ?? result.stderr
        });
      }
    } catch (error) {
      await this.emitTelemetry('agent_failed', {
        runId,
        agent: command.agent,
        error: String(error)
      });
    } finally {
      await this.redis.set(SWARM_STATE_KEY, {
        lastRunId: runId,
        lastAgent: command.agent,
        updatedAt: new Date().toISOString(),
        activeCount: this.activeCount
      });
    }
  }

  private async runAgentWithRetry(command: SwarmCommand, runId: string): Promise<AgentResult> {
    const retryCount = command.retry_count ?? 0;

    await this.emitTelemetry('agent_started', {
      runId,
      agent: command.agent,
      retryCount
    });

    const result = await this.runAgent(command, runId);
    if (result.ok || retryCount >= RETRY_LIMIT) {
      return result;
    }

    await this.emitTelemetry('agent_retry_scheduled', {
      runId,
      agent: command.agent,
      retryCount: retryCount + 1
    });

    await this.redis.lpush(SWARM_COMMAND_QUEUE, {
      ...command,
      retry_count: retryCount + 1,
      requested_at: new Date().toISOString()
    });

    return result;
  }

  private async runAgent(command: SwarmCommand, runId: string): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    const mapped = AGENT_COMMANDS[command.agent] || this.resolveFallbackAgentCommand(command.agent);

    if (!mapped) {
      return {
        ok: false,
        agent: command.agent,
        runId,
        startedAt,
        endedAt: new Date().toISOString(),
        exitCode: 127,
        stdout: '',
        stderr: '',
        error: `Unknown agent '${command.agent}'. Add it to runtime/swarm_node/index.ts AGENT_COMMANDS.`
      };
    }

    const [exe, ...args] = mapped;
    return new Promise((resolve) => {
      const child = spawn(exe, args, {
        cwd: process.cwd(),
        env: {
          ...process.env,
          SWARM_NODE_RUN_ID: runId,
          SWARM_AGENT_NAME: command.agent,
          SWARM_AGENT_PAYLOAD: JSON.stringify(command.payload ?? {})
        }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });

      child.on('close', (exitCode) => {
        resolve({
          ok: exitCode === 0,
          agent: command.agent,
          runId,
          startedAt,
          endedAt: new Date().toISOString(),
          exitCode: exitCode ?? 1,
          stdout,
          stderr,
          payload: command.payload
        });
      });

      child.on('error', (error) => {
        resolve({
          ok: false,
          agent: command.agent,
          runId,
          startedAt,
          endedAt: new Date().toISOString(),
          exitCode: 1,
          stdout,
          stderr,
          error: String(error),
          payload: command.payload
        });
      });
    });
  }

  private resolveFallbackAgentCommand(agent: string): string[] | null {
    const normalized = agent.replace(/[^a-zA-Z0-9_-]/g, '');
    const candidate = path.resolve(process.cwd(), 'scripts', `run_${normalized}.ts`);
    return ['npx', 'tsx', candidate];
  }

  private async recordResult(result: AgentResult) {
    const filePath = path.join(SWARM_RESULTS_DIR, `${result.runId}-${result.agent}.json`);
    await fs.writeFile(filePath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

    await this.emitTelemetry('swarm_result_persisted', {
      runId: result.runId,
      agent: result.agent,
      filePath
    });

    if (AUTO_COMMIT_RESULTS) {
      await this.commitResult(filePath, result);
    }
  }

  private async commitResult(filePath: string, result: AgentResult) {
    const run = async (cmd: string, args: string[]) => {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(cmd, args, { cwd: process.cwd(), stdio: 'inherit' });
        child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
        child.on('error', reject);
      });
    };

    try {
      await run('git', ['add', filePath]);
      await run('git', ['commit', '-m', `chore(swarm-node): persist result ${result.runId} (${result.agent})`]);
      await this.emitTelemetry('swarm_result_committed', {
        runId: result.runId,
        agent: result.agent
      });
    } catch (error) {
      await this.emitTelemetry('swarm_result_commit_failed', {
        runId: result.runId,
        agent: result.agent,
        error: String(error)
      });
    }
  }

  private async emitTelemetry(event: string, payload: Record<string, unknown>) {
    const envelope = {
      event,
      timestamp: new Date().toISOString(),
      payload
    };

    console.log(`📡 [SwarmNode][Telemetry] ${event}`, payload);
    await this.redis.lpush(SWARM_TELEMETRY_QUEUE, envelope);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private registerSignalHandlers() {
    process.on('SIGINT', () => {
      this.shuttingDown = true;
      console.log('🛑 [SwarmNode] SIGINT received, shutting down...');
    });

    process.on('SIGTERM', () => {
      this.shuttingDown = true;
      console.log('🛑 [SwarmNode] SIGTERM received, shutting down...');
    });
  }
}

new SwarmNode().start().catch((error) => {
  console.error('❌ [SwarmNode] Fatal startup error:', error);
  process.exit(1);
});
