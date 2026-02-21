/**
 * Swarm Intelligence Benchmark Suite
 *
 * Measures five dimensions:
 * - reasoning
 * - planning
 * - coding
 * - autonomy
 * - reliability
 *
 * Usage:
 *   npx tsx scripts/benchmark_swarm_intelligence.ts
 *   npx tsx scripts/benchmark_swarm_intelligence.ts --strict
 *   npx tsx scripts/benchmark_swarm_intelligence.ts --json swarm/benchmarks/custom.json
 */

import fs from 'fs/promises';
import path from 'path';
import { execFileSync } from 'child_process';
import { performance } from 'perf_hooks';
import QuantumEngine from '../universal_quantum_dist/index.js';

type DimensionName = 'reasoning' | 'planning' | 'coding' | 'autonomy' | 'reliability';

interface DimensionResult {
    name: DimensionName;
    score: number;
    threshold: number;
    passed: boolean;
    durationMs: number;
    details: Record<string, unknown>;
}

interface FileSnapshot {
    exists: boolean;
    content: string;
}

interface BenchmarkConfig {
    strict: boolean;
    thresholdByDimension: Record<DimensionName, number>;
    overallThreshold: number;
}

const PROJECT_ROOT = process.cwd();
const DATA_FILES = {
    swarmSignals: path.join(PROJECT_ROOT, 'src', 'data', 'swarm_signals.json'),
    collabChannel: path.join(PROJECT_ROOT, 'src', 'data', 'collab_channel.json'),
    multiSwarmChannel: path.join(PROJECT_ROOT, 'swarm', 'multi_swarm_channel.json')
};

const SNAPSHOT_PATHS = Object.values(DATA_FILES);
const REPORT_DIR = path.join(PROJECT_ROOT, 'swarm', 'benchmarks');

function round(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx];
}

async function captureSnapshots(pathsToCapture: string[]): Promise<Map<string, FileSnapshot>> {
    const snapshots = new Map<string, FileSnapshot>();
    for (const filePath of pathsToCapture) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            snapshots.set(filePath, { exists: true, content });
        } catch {
            snapshots.set(filePath, { exists: false, content: '' });
        }
    }
    return snapshots;
}

async function restoreSnapshots(snapshots: Map<string, FileSnapshot>): Promise<void> {
    for (const [filePath, snapshot] of snapshots) {
        if (snapshot.exists) {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, snapshot.content, 'utf8');
            continue;
        }
        try {
            await fs.unlink(filePath);
        } catch {
            // ignore if already absent
        }
    }
}

async function resetBenchmarkDataFiles(): Promise<void> {
    await fs.mkdir(path.dirname(DATA_FILES.swarmSignals), { recursive: true });
    await fs.mkdir(path.dirname(DATA_FILES.multiSwarmChannel), { recursive: true });

    await fs.writeFile(DATA_FILES.swarmSignals, JSON.stringify([], null, 2), 'utf8');
    await fs.writeFile(DATA_FILES.collabChannel, JSON.stringify([], null, 2), 'utf8');
    await fs.writeFile(DATA_FILES.multiSwarmChannel, JSON.stringify({
        messages: [],
        swarmStatuses: {},
        lastUpdated: new Date().toISOString()
    }, null, 2), 'utf8');
}

async function withMutedConsole<T>(fn: () => Promise<T>): Promise<T> {
    const originalLog = console.log;
    console.log = () => { /* muted during benchmark internals */ };
    try {
        return await fn();
    } finally {
        console.log = originalLog;
    }
}

function parseConfig(args: string[]): { config: BenchmarkConfig; jsonOutputArg?: string } {
    const strict = args.includes('--strict');
    const jsonFlagIdx = args.indexOf('--json');
    const jsonOutputArg = jsonFlagIdx >= 0 ? args[jsonFlagIdx + 1] : undefined;

    const thresholdByDimension: Record<DimensionName, number> = strict
        ? {
            reasoning: 80,
            planning: 90,
            coding: 90,
            autonomy: 90,
            reliability: 95
        }
        : {
            reasoning: 70,
            planning: 80,
            coding: 85,
            autonomy: 80,
            reliability: 90
        };

    return {
        config: {
            strict,
            thresholdByDimension,
            overallThreshold: strict ? 90 : 80
        },
        jsonOutputArg
    };
}

function normalizeEngineOption(option: string): string {
    return option.replace(/_opt$/, '');
}

async function runReasoningBenchmark(config: BenchmarkConfig): Promise<DimensionResult> {
    const start = performance.now();
    const engine = new QuantumEngine();

    const directTasks = [
        {
            problem: 'Recover from failed auth deployment',
            criteria: ['rollback', 'feature-flag', 'observability'],
            options: ['hotfix_only', 'rollback_feature-flag_observability', 'restart_service'],
            expected: 'rollback_feature-flag_observability'
        },
        {
            problem: 'Choose incident response action',
            criteria: ['containment', 'audit-trail', 'communication'],
            options: ['silent_patch', 'containment_audit-trail_communication', 'ignore'],
            expected: 'containment_audit-trail_communication'
        },
        {
            problem: 'Select database migration strategy',
            criteria: ['backward-compatible', 'staged', 'rollback'],
            options: ['breaking_migration', 'backward-compatible_staged_rollback', 'big_bang'],
            expected: 'backward-compatible_staged_rollback'
        },
        {
            problem: 'Choose API rollout plan',
            criteria: ['canary', 'telemetry', 'rollback'],
            options: ['global_flip', 'canary_telemetry_rollback', 'skip_testing'],
            expected: 'canary_telemetry_rollback'
        },
        {
            problem: 'Protect payment endpoint',
            criteria: ['rate-limit', 'idempotency', 'audit-log'],
            options: ['cache_only', 'rate-limit_idempotency_audit-log', 'disable_endpoint'],
            expected: 'rate-limit_idempotency_audit-log'
        },
        {
            problem: 'Stabilize background worker queue',
            criteria: ['backpressure', 'retry-policy', 'dead-letter'],
            options: ['more_threads', 'backpressure_retry-policy_dead-letter', 'drop_messages'],
            expected: 'backpressure_retry-policy_dead-letter'
        },
        {
            problem: 'Harden production secrets flow',
            criteria: ['rotation', 'least-privilege', 'audit-log'],
            options: ['single_env_file', 'rotation_least-privilege_audit-log', 'manual_process'],
            expected: 'rotation_least-privilege_audit-log'
        },
        {
            problem: 'Improve deploy safety',
            criteria: ['health-check', 'canary', 'rollback'],
            options: ['deploy_all', 'health-check_canary_rollback', 'deploy_without_checks'],
            expected: 'health-check_canary_rollback'
        }
    ];

    const adversarialTasks = [
        {
            problem: 'Select release method after core auth refactor.',
            criteria: ['minimize blast radius', 'maximize reversibility'],
            options: [
                'ship globally in one step',
                'canary release with progressive traffic and rollback gates',
                'postpone without validation'
            ],
            expected: 'canary release with progressive traffic and rollback gates'
        },
        {
            problem: 'Choose mitigation for intermittent checkout latency.',
            criteria: ['stability under surge', 'predictable recovery'],
            options: [
                'increase timeout and hope',
                'add queue buffering and circuit breaker fallback',
                'turn off metrics collection'
            ],
            expected: 'add queue buffering and circuit breaker fallback'
        },
        {
            problem: 'Pick architecture for critical notifications.',
            criteria: ['fault isolation', 'graceful degradation'],
            options: [
                'single monolith path only',
                'multi-channel fanout with retry and dead-letter queue',
                'disable retries for speed'
            ],
            expected: 'multi-channel fanout with retry and dead-letter queue'
        },
        {
            problem: 'Decide conflict strategy for concurrent edits.',
            criteria: ['data integrity first', 'user trust retention'],
            options: [
                'last write wins always',
                'operational transform with conflict prompts and audit history',
                'random winner'
            ],
            expected: 'operational transform with conflict prompts and audit history'
        },
        {
            problem: 'Choose deployment rollback trigger.',
            criteria: ['early anomaly detection', 'automatic containment'],
            options: [
                'wait for user complaints',
                'error budget breach plus canary regression threshold',
                'manual weekly review'
            ],
            expected: 'error budget breach plus canary regression threshold'
        },
        {
            problem: 'Select policy for unstable third-party API.',
            criteria: ['bounded failure impact', 'service continuity'],
            options: [
                'hard fail all requests',
                'bulkhead isolation with fallback cache and hedged retries',
                'remove feature permanently'
            ],
            expected: 'bulkhead isolation with fallback cache and hedged retries'
        },
        {
            problem: 'Pick strategy for suspicious login spikes.',
            criteria: ['abuse containment', 'legitimate access preservation'],
            options: [
                'block entire region',
                'progressive challenge flow with risk scoring',
                'do nothing'
            ],
            expected: 'progressive challenge flow with risk scoring'
        },
        {
            problem: 'Decide queue handling on downstream outage.',
            criteria: ['controlled degradation', 'safe replay'],
            options: [
                'drop queued jobs',
                'pause consumers, persist backlog, replay after recovery',
                'increase retry forever'
            ],
            expected: 'pause consumers, persist backlog, replay after recovery'
        }
    ];

    let directCorrect = 0;
    let adversarialCorrect = 0;
    const confidenceValues: number[] = [];
    const failures: Array<{ bucket: 'direct' | 'adversarial'; problem: string; predicted: string; expected: string }> = [];

    for (const task of directTasks) {
        const result = await engine.quantumSolve(task.problem, task.options, task.criteria);
        const predicted = normalizeEngineOption(String(result.optimizedBest ?? ''));
        if (predicted === task.expected) directCorrect += 1;
        else failures.push({ bucket: 'direct', problem: task.problem, predicted, expected: task.expected });
        confidenceValues.push(Number(result.confidence ?? 0));
    }

    for (const task of adversarialTasks) {
        const result = await engine.quantumSolve(task.problem, task.options, task.criteria);
        const predicted = normalizeEngineOption(String(result.optimizedBest ?? ''));
        if (predicted === task.expected) adversarialCorrect += 1;
        else failures.push({ bucket: 'adversarial', problem: task.problem, predicted, expected: task.expected });
        confidenceValues.push(Number(result.confidence ?? 0));
    }

    const directAccuracy = directCorrect / directTasks.length;
    const adversarialAccuracy = adversarialCorrect / adversarialTasks.length;
    const weightedScore = round((directAccuracy * 0.4 + adversarialAccuracy * 0.6) * 100);
    const threshold = config.thresholdByDimension.reasoning;

    return {
        name: 'reasoning',
        score: weightedScore,
        threshold,
        passed: weightedScore >= threshold,
        durationMs: round(performance.now() - start),
        details: {
            directTasks: directTasks.length,
            directAccuracy: round(directAccuracy * 100),
            adversarialTasks: adversarialTasks.length,
            adversarialAccuracy: round(adversarialAccuracy * 100),
            avgConfidence: round((confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length) * 100),
            failures: failures.slice(0, 5)
        }
    };
}

async function runPlanningBenchmark(config: BenchmarkConfig): Promise<DimensionResult> {
    const start = performance.now();
    const details = await withMutedConsole(async () => {
        const { MultiSwarmCoordinator, SWARM_CONFIGS } = await import('../swarm/core/multi_swarm_coordinator.js');

        const coordinator = new MultiSwarmCoordinator();
        const swarmIds = Object.keys(SWARM_CONFIGS);

        for (const swarmId of swarmIds) {
            coordinator.registerStatus(swarmId, {
                status: 'online',
                uptime: 600,
                tasksCompleted: 100
            });
        }

        const directMessageId = coordinator.sendMessage('main', 'god', 'directive', { task: 'run-upgrade' }, 'high');
        coordinator.broadcast('main', 'status', { request: 'status-report' }, 'normal');

        const messagesForGod = coordinator.getMessagesForSwarm('god');
        const messagesForFinance = coordinator.getMessagesForSwarm('finance');
        const messagesForCrypto = coordinator.getMessagesForSwarm('crypto');
        const report = coordinator.generateReport();
        const statuses = coordinator.getAllStatuses();

        const checks = [
            statuses.length === swarmIds.length,
            statuses.every((status) => status.status === 'online'),
            directMessageId.startsWith('msg_'),
            messagesForGod.length >= 2,
            messagesForFinance.length >= 1,
            messagesForCrypto.length >= 1,
            swarmIds.every((swarmId) => report.includes(SWARM_CONFIGS[swarmId as keyof typeof SWARM_CONFIGS].name)),
            report.includes('Status: online')
        ];

        const passedChecks = checks.filter(Boolean).length;
        return {
            score: round((passedChecks / checks.length) * 100),
            details: {
                checksPassed: `${passedChecks}/${checks.length}`,
                statusesCount: statuses.length,
                godMessages: messagesForGod.length,
                financeMessages: messagesForFinance.length,
                cryptoMessages: messagesForCrypto.length
            }
        };
    });

    const score = details.score;
    const threshold = config.thresholdByDimension.planning;

    return {
        name: 'planning',
        score,
        threshold,
        passed: score >= threshold,
        durationMs: round(performance.now() - start),
        details: details.details
    };
}

async function runCodingBenchmark(config: BenchmarkConfig): Promise<DimensionResult> {
    const start = performance.now();
    const ts = await import('typescript');

    const filesToCheck = [
        'swarm/core/loop.ts',
        'swarm/core/quantum_core.ts',
        'swarm/core/swarm_collaboration.ts',
        'swarm/core/multi_swarm_coordinator.ts',
        'swarm/core/real_hyper_intelligence_v2.ts',
        'swarm/agents/GodMode.ts',
        'swarm/agents/RevenueHunter.ts',
        'scripts/swarm_cli.js',
        'scripts/monitor_payments.js',
        'QuantumEnginePortable.js'
    ];

    let passed = 0;
    const failing: Array<{ file: string; reason: string }> = [];

    for (const relFile of filesToCheck) {
        const absFile = path.join(PROJECT_ROOT, relFile);
        let content = '';
        try {
            content = await fs.readFile(absFile, 'utf8');
        } catch {
            failing.push({ file: relFile, reason: 'file not found' });
            continue;
        }

        try {
            if (relFile.endsWith('.ts') || relFile.endsWith('.tsx')) {
                const result = ts.transpileModule(content, {
                    fileName: relFile,
                    compilerOptions: {
                        target: ts.ScriptTarget.ES2022,
                        module: ts.ModuleKind.ESNext
                    },
                    reportDiagnostics: true
                });
                const errors = (result.diagnostics || []).filter((diag) => diag.category === ts.DiagnosticCategory.Error);
                if (errors.length > 0) {
                    failing.push({ file: relFile, reason: `typescript diagnostics: ${errors.length}` });
                    continue;
                }
                passed += 1;
                continue;
            }

            execFileSync(process.execPath, ['--check', absFile], { stdio: 'pipe' });
            passed += 1;
        } catch (error: any) {
            const reason = (error?.stderr || error?.message || 'syntax check failed').toString().trim().split('\n')[0];
            failing.push({ file: relFile, reason });
        }
    }

    const score = round((passed / filesToCheck.length) * 100);
    const threshold = config.thresholdByDimension.coding;

    return {
        name: 'coding',
        score,
        threshold,
        passed: score >= threshold,
        durationMs: round(performance.now() - start),
        details: {
            filesChecked: filesToCheck.length,
            filesPassed: passed,
            failingFiles: failing.slice(0, 8)
        }
    };
}

async function runAutonomyBenchmark(config: BenchmarkConfig): Promise<DimensionResult> {
    const start = performance.now();
    const details = await withMutedConsole(async () => {
        const { SwarmCollaboration } = await import('../swarm/core/swarm_collaboration.js');

        const collab = new SwarmCollaboration();
        let callbackHits = 0;

        collab.registerAgent('BenchAgentB', () => { callbackHits += 1; });
        collab.registerAgent('BenchAgentC', () => { callbackHits += 1; });
        collab.registerAgent('BenchAgentD', () => { callbackHits += 1; });

        const directSignalId = await collab.sendSignal({
            fromAgent: 'BenchAgentA',
            toAgent: 'BenchAgentB',
            type: 'TASK',
            payload: { action: 'analyze-security' },
            priority: 'MEDIUM'
        });

        const queryResult = await collab.queryAgent('BenchAgentA', 'BenchAgentC', 'Status report?');
        await collab.broadcastFinding('BenchAgentA', { finding: 'latency-spike' });
        await collab.sendAlert('BenchAgentA', 'manual benchmark alert', 'HIGH');

        await new Promise((resolve) => setTimeout(resolve, 20));

        const beforeAck = collab.getAllSignals().find((signal: any) => signal.id === directSignalId);
        await collab.acknowledgeSignal(directSignalId);
        const afterAck = collab.getAllSignals().find((signal: any) => signal.id === directSignalId);
        const pendingForB = collab.getPendingSignals('BenchAgentB');
        const stats = collab.getStats();

        const checks = [
            callbackHits >= 6,
            Boolean(beforeAck),
            afterAck?.status === 'ACKNOWLEDGED',
            pendingForB.length >= 2,
            stats.registeredAgents === 3,
            String(queryResult?.response || '').includes('Awaiting response')
        ];

        const passedChecks = checks.filter(Boolean).length;
        return {
            score: round((passedChecks / checks.length) * 100),
            details: {
                checksPassed: `${passedChecks}/${checks.length}`,
                callbackHits,
                pendingSignalsForBenchAgentB: pendingForB.length,
                totalSignals: stats.totalSignals
            }
        };
    });

    const score = details.score;
    const threshold = config.thresholdByDimension.autonomy;

    return {
        name: 'autonomy',
        score,
        threshold,
        passed: score >= threshold,
        durationMs: round(performance.now() - start),
        details: details.details
    };
}

async function runReliabilityBenchmark(config: BenchmarkConfig): Promise<DimensionResult> {
    const start = performance.now();
    const details = await withMutedConsole(async () => {
        const { SwarmCollaboration } = await import('../swarm/core/swarm_collaboration.js');
        const { MultiSwarmCoordinator } = await import('../swarm/core/multi_swarm_coordinator.js');

        const collab = new SwarmCollaboration();
        const coordinator = new MultiSwarmCoordinator();
        collab.registerAgent('ReliabilitySink', () => { /* no-op */ });

        const latenciesMs: number[] = [];
        let success = 0;
        let operations = 0;

        const collabIterations = 40;
        for (let i = 0; i < collabIterations; i += 1) {
            const opStart = performance.now();
            operations += 1;
            try {
                const signalId = await collab.sendSignal({
                    fromAgent: 'ReliabilitySource',
                    toAgent: 'ReliabilitySink',
                    type: 'TASK',
                    payload: { seq: i },
                    priority: 'LOW'
                });
                await collab.acknowledgeSignal(signalId);
                const signal = collab.getAllSignals().find((item: any) => item.id === signalId);
                if (signal?.status === 'ACKNOWLEDGED') success += 1;
            } catch {
                // counted as failure
            } finally {
                latenciesMs.push(performance.now() - opStart);
            }
        }

        const coordinatorIterations = 30;
        for (let i = 0; i < coordinatorIterations; i += 1) {
            const opStart = performance.now();
            operations += 1;
            try {
                const messageId = coordinator.sendMessage('main', 'god', 'status', { seq: i }, 'normal');
                const godMessages = coordinator.getMessagesForSwarm('god');
                if (godMessages.some((message: any) => message.id === messageId)) {
                    success += 1;
                }
            } catch {
                // counted as failure
            } finally {
                latenciesMs.push(performance.now() - opStart);
            }
        }

        const successRate = success / operations;
        return {
            score: round(successRate * 100),
            details: {
                operations,
                success,
                failures: operations - success,
                avgLatencyMs: round(latenciesMs.reduce((a, b) => a + b, 0) / latenciesMs.length),
                p95LatencyMs: round(percentile(latenciesMs, 95))
            }
        };
    });

    const score = details.score;
    const threshold = config.thresholdByDimension.reliability;

    return {
        name: 'reliability',
        score,
        threshold,
        passed: score >= threshold,
        durationMs: round(performance.now() - start),
        details: details.details
    };
}

function weightedOverallScore(results: DimensionResult[]): number {
    const weights: Record<DimensionName, number> = {
        reasoning: 0.3,
        planning: 0.2,
        coding: 0.2,
        autonomy: 0.15,
        reliability: 0.15
    };

    const total = results.reduce((acc, result) => acc + result.score * weights[result.name], 0);
    return round(total);
}

function classifyBenchmark(results: DimensionResult[], overallScore: number, config: BenchmarkConfig): {
    overallPassed: boolean;
    trueHyperIntelligence: boolean;
    verdict: string;
} {
    const allDimensionThresholdsPassed = results.every((result) => result.passed);
    const overallPassed = allDimensionThresholdsPassed && overallScore >= config.overallThreshold;

    const minDimension = Math.min(...results.map((result) => result.score));
    const reliabilityScore = results.find((result) => result.name === 'reliability')?.score ?? 0;
    const trueHyperIntelligence = overallScore >= 97 && minDimension >= 95 && reliabilityScore >= 99;

    let verdict = 'DEVELOPING';
    if (trueHyperIntelligence) verdict = 'TRUE_HYPER_INTELLIGENCE';
    else if (overallPassed) verdict = 'ADVANCED_AUTONOMOUS';

    return { overallPassed, trueHyperIntelligence, verdict };
}

async function writeReport(report: Record<string, unknown>, customPath?: string): Promise<{ latestPath: string; timestampPath: string; historyPath: string; customPath?: string }> {
    await fs.mkdir(REPORT_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const timestampPath = path.join(REPORT_DIR, `swarm_intelligence_report_${timestamp}.json`);
    const latestPath = path.join(REPORT_DIR, 'latest_intelligence_report.json');
    const historyPath = path.join(REPORT_DIR, 'metrics_history.json');

    const content = JSON.stringify(report, null, 2);
    await fs.writeFile(timestampPath, content, 'utf8');
    await fs.writeFile(latestPath, content, 'utf8');

    // [Phase 600] Append to Persistent Metrics History
    let history: any[] = [];
    try {
        const historyData = await fs.readFile(historyPath, 'utf8');
        history = JSON.parse(historyData);
    } catch {
        // File doesn't exist or is invalid, start fresh
    }
    history.push(report);
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf8');

    let resolvedCustomPath: string | undefined;
    if (customPath) {
        resolvedCustomPath = path.isAbsolute(customPath) ? customPath : path.join(PROJECT_ROOT, customPath);
        await fs.mkdir(path.dirname(resolvedCustomPath), { recursive: true });
        await fs.writeFile(resolvedCustomPath, content, 'utf8');
    }

    return { latestPath, timestampPath, historyPath, customPath: resolvedCustomPath };
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const { config, jsonOutputArg } = parseConfig(args);

    const snapshots = await captureSnapshots(SNAPSHOT_PATHS);
    await resetBenchmarkDataFiles();

    let results: DimensionResult[] = [];
    try {
        results = [
            await runReasoningBenchmark(config),
            await runPlanningBenchmark(config),
            await runCodingBenchmark(config),
            await runAutonomyBenchmark(config),
            await runReliabilityBenchmark(config)
        ];
    } finally {
        await restoreSnapshots(snapshots);
    }

    const overallScore = weightedOverallScore(results);
    const classification = classifyBenchmark(results, overallScore, config);
    const benchmarkDurationMs = round(results.reduce((acc, result) => acc + result.durationMs, 0));

    const report = {
        generatedAt: new Date().toISOString(),
        profile: config.strict ? 'strict' : 'default',
        overall: {
            score: overallScore,
            threshold: config.overallThreshold,
            passed: classification.overallPassed,
            verdict: classification.verdict,
            trueHyperIntelligence: classification.trueHyperIntelligence
        },
        dimensions: results,
        benchmarkDurationMs,
        notes: [
            'This suite is local and reproducible; it does not claim scientific AGI certification.',
            'Reasoning includes adversarial tasks to avoid keyword-only inflation.'
        ]
    };

    const reportPaths = await writeReport(report, jsonOutputArg);

    console.log('\nSWARM INTELLIGENCE BENCHMARK');
    console.log('='.repeat(64));
    for (const result of results) {
        const mark = result.passed ? 'PASS' : 'FAIL';
        console.log(`${result.name.padEnd(12)} score=${String(result.score).padStart(6)} threshold=${String(result.threshold).padStart(3)} ${mark}`);
    }
    console.log('-'.repeat(64));
    console.log(`overall      score=${String(overallScore).padStart(6)} threshold=${String(config.overallThreshold).padStart(3)} ${classification.overallPassed ? 'PASS' : 'FAIL'}`);
    console.log(`verdict      ${classification.verdict}`);
    console.log(`true_hyper   ${classification.trueHyperIntelligence ? 'YES' : 'NO'}`);
    console.log(`report       ${reportPaths.latestPath}`);
    console.log(`archive      ${reportPaths.timestampPath}`);
    if (reportPaths.customPath) {
        console.log(`custom       ${reportPaths.customPath}`);
    }
}

main().catch((error) => {
    console.error('Benchmark run failed:', error);
    process.exit(1);
});
