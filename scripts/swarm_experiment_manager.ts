import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { EventEmitter } from 'node:events';

const exec = promisify(execCb);

export type ExperimentTelemetryEvent =
    | 'experiment_started'
    | 'experiment_completed'
    | 'experiment_success'
    | 'experiment_failed';

export interface ExperimentRecord {
    run_id: string;
    branch: string;
    strategy: string;
    result: 'success' | 'failed';
    benchmark_score: number;
    timestamp: string;
}

export interface ExperimentExecutionContext {
    branch: string;
    runId: string;
    experimentId: string;
    strategy: string;
}

export interface ExperimentOutcome {
    success: boolean;
    benchmarkScore: number;
    checks: Array<{ command: string; ok: boolean; output: string }>;
}

export interface RunExperimentRequest {
    runId: string;
    experimentId: string;
    strategy: string;
    execute: (context: ExperimentExecutionContext) => Promise<void>;
}

interface SwarmExperimentManagerOptions {
    repoPath?: string;
    baseBranch?: string;
    maxConcurrentExperiments?: number;
    testCommand?: string;
    benchmarkCommand?: string;
    buildCommand?: string;
}

const DEFAULT_TEST_COMMAND = 'npm run test -- --run';
const DEFAULT_BENCHMARK_COMMAND = 'npm run swarm:benchmark';
const DEFAULT_BUILD_COMMAND = 'npm run build';

export class SwarmExperimentManager extends EventEmitter {
    readonly repoPath: string;
    readonly baseBranch: string;
    readonly maxConcurrentExperiments: number;

    private readonly testCommand: string;
    private readonly benchmarkCommand: string;
    private readonly buildCommand: string;

    constructor(options: SwarmExperimentManagerOptions = {}) {
        super();
        this.repoPath = options.repoPath ?? process.cwd();
        this.baseBranch = options.baseBranch ?? 'main';
        this.maxConcurrentExperiments = options.maxConcurrentExperiments ?? 5;
        this.testCommand = options.testCommand ?? DEFAULT_TEST_COMMAND;
        this.benchmarkCommand = options.benchmarkCommand ?? DEFAULT_BENCHMARK_COMMAND;
        this.buildCommand = options.buildCommand ?? DEFAULT_BUILD_COMMAND;
    }

    buildExperimentBranch(runId: string, experimentId: string): string {
        return `experiment/${runId}/${experimentId}`;
    }

    async createExperimentBranch(runId: string, experimentId: string): Promise<string> {
        const branch = this.buildExperimentBranch(runId, experimentId);
        await this.runGit(`checkout ${this.baseBranch}`);
        await this.runGit(`checkout -B ${branch} ${this.baseBranch}`);
        return branch;
    }

    async runExperiment(request: RunExperimentRequest): Promise<ExperimentRecord> {
        const branch = await this.createExperimentBranch(request.runId, request.experimentId);
        await this.emitTelemetry('experiment_started', request, branch);

        let outcome: ExperimentOutcome = { success: false, benchmarkScore: 0, checks: [] };

        try {
            await request.execute({
                branch,
                runId: request.runId,
                experimentId: request.experimentId,
                strategy: request.strategy
            });
            outcome = await this.evaluateExperiment();

            if (outcome.success) {
                await this.mergeExperimentBranch(branch);
                await this.emitTelemetry('experiment_success', request, branch, outcome);
            } else {
                await this.deleteExperimentBranch(branch);
                await this.emitTelemetry('experiment_failed', request, branch, outcome);
            }
        } catch {
            await this.deleteExperimentBranch(branch);
            await this.emitTelemetry('experiment_failed', request, branch, outcome);
        }

        const record: ExperimentRecord = {
            run_id: request.runId,
            branch,
            strategy: request.strategy,
            result: outcome.success ? 'success' : 'failed',
            benchmark_score: outcome.benchmarkScore,
            timestamp: new Date().toISOString()
        };

        await this.trackExperiment(record);
        await this.emitTelemetry('experiment_completed', request, branch, outcome);
        return record;
    }

    async runExperimentsInParallel(requests: RunExperimentRequest[]): Promise<ExperimentRecord[]> {
        const limit = Math.max(1, Math.min(this.maxConcurrentExperiments, 5));
        const queue = [...requests];
        const results: ExperimentRecord[] = [];

        const worker = async (): Promise<void> => {
            while (queue.length > 0) {
                const next = queue.shift();
                if (!next) {
                    return;
                }
                const result = await this.runExperiment(next);
                results.push(result);
            }
        };

        await Promise.all(Array.from({ length: Math.min(limit, queue.length || 1) }, worker));
        return results;
    }

    async evaluateExperiment(): Promise<ExperimentOutcome> {
        const checks: ExperimentOutcome['checks'] = [];

        for (const command of [this.testCommand, this.benchmarkCommand, this.buildCommand]) {
            const check = await this.runCheck(command);
            checks.push(check);
            if (!check.ok) {
                return {
                    success: false,
                    benchmarkScore: this.extractBenchmarkScore(checks),
                    checks
                };
            }
        }

        return {
            success: true,
            benchmarkScore: this.extractBenchmarkScore(checks),
            checks
        };
    }

    async cleanupStaleExperimentBranches(maxAgeHours = 24): Promise<string[]> {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const maxAgeSeconds = maxAgeHours * 60 * 60;

        const { stdout } = await exec(
            `git for-each-ref --format="%(refname:short) %(committerdate:unix)" refs/heads/experiment`,
            { cwd: this.repoPath }
        );

        const staleBranches = stdout
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const [branch, commitTimestamp] = line.split(/\s+/);
                return { branch, commitTimestamp: Number(commitTimestamp) };
            })
            .filter((entry) => Number.isFinite(entry.commitTimestamp) && nowSeconds - entry.commitTimestamp > maxAgeSeconds)
            .map((entry) => entry.branch);

        for (const branch of staleBranches) {
            await this.deleteExperimentBranch(branch);
        }

        return staleBranches;
    }

    private async runCheck(command: string): Promise<{ command: string; ok: boolean; output: string }> {
        try {
            const { stdout, stderr } = await exec(command, { cwd: this.repoPath });
            return { command, ok: true, output: `${stdout}${stderr}` };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { command, ok: false, output: message };
        }
    }

    private extractBenchmarkScore(checks: Array<{ command: string; output: string }>): number {
        const benchmark = checks.find((check) => check.command === this.benchmarkCommand);
        if (!benchmark) {
            return 0;
        }

        const scoreMatch = benchmark.output.match(/(?:score|benchmark(?:_score)?)\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i);
        return scoreMatch ? Number(scoreMatch[1]) : 0;
    }

    private async mergeExperimentBranch(branch: string): Promise<void> {
        await this.runGit(`checkout ${this.baseBranch}`);
        await this.runGit(`merge --no-ff ${branch} -m "merge(${branch}): promote successful swarm experiment"`);
        await this.runGit(`branch -D ${branch}`);
    }

    private async deleteExperimentBranch(branch: string): Promise<void> {
        await this.runGit(`checkout ${this.baseBranch}`);
        await this.runGit(`branch -D ${branch}`).catch(async () => {
            await this.runGit(`branch -d ${branch}`).catch(() => undefined);
        });
    }

    private async runGit(command: string): Promise<void> {
        await exec(`git ${command}`, { cwd: this.repoPath });
    }

    private async trackExperiment(record: ExperimentRecord): Promise<void> {
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!redisUrl || !redisToken) {
            return;
        }

        const endpoint = `${redisUrl}/lpush/appforge:swarm_experiments/${encodeURIComponent(JSON.stringify(record))}`;

        try {
            await fetch(endpoint, {
                method: 'POST',
                headers: { Authorization: `Bearer ${redisToken}` }
            });
        } catch {
            // best-effort tracking
        }
    }

    private async emitTelemetry(
        event: ExperimentTelemetryEvent,
        request: Pick<RunExperimentRequest, 'runId' | 'experimentId' | 'strategy'>,
        branch: string,
        outcome?: ExperimentOutcome
    ): Promise<void> {
        const payload = {
            event,
            run_id: request.runId,
            experiment_id: request.experimentId,
            strategy: request.strategy,
            branch,
            benchmark_score: outcome?.benchmarkScore ?? 0,
            result: outcome?.success === undefined ? 'running' : outcome.success ? 'success' : 'failed',
            timestamp: new Date().toISOString()
        };

        this.emit(event, payload);

        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!redisUrl || !redisToken) {
            return;
        }

        const endpoint = `${redisUrl}/lpush/appforge:telemetry:events/${encodeURIComponent(JSON.stringify(payload))}`;
        try {
            await fetch(endpoint, {
                method: 'POST',
                headers: { Authorization: `Bearer ${redisToken}` }
            });
        } catch {
            // best-effort telemetry
        }
    }
}
