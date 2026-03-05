interface GoalState {
    goal: SwarmGoal;
    updated_at: string;
    priority: number;
}

export interface GoalTelemetryEvent {
    type: 'swarm_goal_selected' | 'swarm_action_selected' | 'swarm_action_executed';
    goal: SwarmGoal;
    selected_workflow?: string;
    timestamp: string;
    details?: Record<string, unknown>;
}

export interface GoalContext {
    ciStatus?: string;
    frontendQaStatus?: string;
    benchmarkTrend?: string;
    benchmarkScore?: number;
    previousBenchmarkScore?: number;
    lastUpdated?: string;
    recentCommits?: string[];
    telemetryEvents?: Array<{ type: string; level?: string; timestamp?: string }>;
}

export const GOALS = [
    'improve_code_quality',
    'increase_benchmark_score',
    'fix_failing_tests',
    'explore_new_features',
    'optimize_performance'
] as const;

export type SwarmGoal = (typeof GOALS)[number];

export const GOAL_WORKFLOW_MAP: Record<SwarmGoal, string[]> = {
    improve_code_quality: ['Frontend QA Swarm', 'Iron Brain CI — Ghost Brain'],
    increase_benchmark_score: ['Evolution Benchmark Gate', 'Quantum Self-Evolution'],
    fix_failing_tests: ['Frontend QA Swarm', 'Autonomous Swarm Cycle'],
    explore_new_features: ['Curiosity Engine Scan', 'Autonomous Swarm Cycle'],
    optimize_performance: ['Iron Brain CI — Ghost Brain', 'Quantum Self-Evolution']
};

const SWARM_GOAL_KEY = 'appforge:swarm_goal';

export async function determine_current_goal(context: GoalContext): Promise<SwarmGoal> {
    const telemetry = context.telemetryEvents || [];
    const commitMessages = context.recentCommits || [];

    const testsFailing =
        context.ciStatus === 'fail' ||
        context.frontendQaStatus === 'fail' ||
        telemetry.some((event) => event.type.includes('test') && event.level === 'error');

    if (testsFailing) {
        return 'fix_failing_tests';
    }

    const benchmarkDropped =
        context.benchmarkTrend === 'down' ||
        (typeof context.benchmarkScore === 'number' &&
            typeof context.previousBenchmarkScore === 'number' &&
            context.benchmarkScore < context.previousBenchmarkScore) ||
        telemetry.some((event) => event.type === 'benchmark_score_dropped');

    if (benchmarkDropped) {
        return 'increase_benchmark_score';
    }

    const hasPerfSignals =
        telemetry.some((event) => event.type.includes('latency') || event.type.includes('performance')) ||
        commitMessages.some((message) => /\b(perf|latency|optimiz(e|ation))\b/i.test(message));

    if (hasPerfSignals) {
        return 'optimize_performance';
    }

    const stableForLongTime = isStableForLongTime(context.lastUpdated, context.ciStatus, context.frontendQaStatus);

    if (stableForLongTime) {
        return 'explore_new_features';
    }

    return 'improve_code_quality';
}

export function selectWorkflowForGoal(
    goal: SwarmGoal,
    recentGoalActions: string[] = [],
    preferredWorkflow?: string
): string {
    const candidates = GOAL_WORKFLOW_MAP[goal];
    if (!candidates.length) return '';

    const preferred = preferredWorkflow && candidates.includes(preferredWorkflow) ? preferredWorkflow : undefined;
    const rankedCandidates = preferred ? [preferred, ...candidates.filter((c) => c !== preferred)] : candidates;

    const lastAction = recentGoalActions[recentGoalActions.length - 1];
    const sameActionStreak = countConsecutiveTail(recentGoalActions, lastAction);

    if (lastAction && sameActionStreak > 2) {
        const alternative = rankedCandidates.find((workflow) => workflow !== lastAction);
        if (alternative) return alternative;
    }

    return rankedCandidates[0];
}

export async function loadStoredGoal(): Promise<GoalState | null> {
    const response = await redisGet(SWARM_GOAL_KEY);
    if (!response) return null;

    try {
        return JSON.parse(response) as GoalState;
    } catch {
        return null;
    }
}

export async function saveGoalState(goal: SwarmGoal, priority = 1): Promise<GoalState> {
    const payload: GoalState = {
        goal,
        updated_at: new Date().toISOString(),
        priority
    };

    await redisSet(SWARM_GOAL_KEY, JSON.stringify(payload));
    return payload;
}

function isStableForLongTime(lastUpdated: string | undefined, ciStatus?: string, frontendQaStatus?: string): boolean {
    if (!lastUpdated) return false;
    if (ciStatus !== 'pass' || frontendQaStatus === 'fail') return false;

    const elapsedMs = Date.now() - new Date(lastUpdated).getTime();
    const stableThresholdMs = 6 * 60 * 60 * 1000;
    return Number.isFinite(elapsedMs) && elapsedMs > stableThresholdMs;
}

function countConsecutiveTail(items: string[], target?: string): number {
    if (!target) return 0;
    let streak = 0;
    for (let i = items.length - 1; i >= 0; i--) {
        if (items[i] === target) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

async function redisGet(key: string): Promise<string | null> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;

    try {
        const response = await fetch(`${url}/get/${key}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.result || null;
    } catch {
        return null;
    }
}

async function redisSet(key: string, value: string): Promise<void> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return;

    try {
        await fetch(`${url}/set/${key}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: value
        });
    } catch {
        // best-effort persistence
    }
}
