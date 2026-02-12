import * as fs from 'fs/promises';
import path from 'path';

export interface BenchmarkSnapshot {
    overallScore: number;
    verdict: string;
    weakestDimension: string;
    weakestScore: number;
}

export interface ReasoningDrill {
    id: string;
    question: string;
    options: string[];
    criteria: string[];
    expectedKeywords: string[];
}

export interface DrillResult {
    id: string;
    recommendation: string;
    success: boolean;
    confidence: number;
}

/**
 * benchmark_review_cell
 * Reads benchmark artifacts and extracts weakest dimensions.
 */
export class BenchmarkReviewCell {
    private readonly reportPath: string;

    constructor(reportPath?: string) {
        this.reportPath = reportPath
            ?? path.join(process.cwd(), 'swarm', 'benchmarks', 'latest_intelligence_report.json');
    }

    async loadBenchmarkSnapshot(): Promise<BenchmarkSnapshot | null> {
        try {
            const raw = await fs.readFile(this.reportPath, 'utf8');
            const report = JSON.parse(raw) as {
                overall?: { score?: number; verdict?: string };
                dimensions?: Array<{ name?: string; score?: number }>;
            };

            const dimensions = report.dimensions || [];
            const weakest = [...dimensions].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

            return {
                overallScore: report.overall?.score ?? 0,
                verdict: report.overall?.verdict ?? 'UNKNOWN',
                weakestDimension: weakest?.name ?? 'reasoning',
                weakestScore: weakest?.score ?? 0
            };
        } catch {
            return null;
        }
    }
}

/**
 * drill_execution_cell
 * Generates and scores adversarial reasoning drills.
 */
export class DrillExecutionCell {
    buildReasoningDrills(): ReasoningDrill[] {
        return [
            {
                id: 'deploy_safety',
                question: 'Production deploy shows rising 5xx and timeout errors. Best immediate action?',
                options: [
                    'Canary rollback, feature-flag disable, and error-budget alerting',
                    'Restart services repeatedly and wait for customer complaints',
                    'Disable monitoring to reduce noise during rollout'
                ],
                criteria: ['containment', 'rollback', 'observability'],
                expectedKeywords: ['rollback', 'feature', 'alert']
            },
            {
                id: 'queue_stability',
                question: 'Worker queue is saturated and retries are cascading. Best recovery strategy?',
                options: [
                    'Apply backpressure, bounded retries, and dead-letter queue',
                    'Increase worker threads indefinitely and drop old messages',
                    'Pause alerts and let queue drain without intervention'
                ],
                criteria: ['stability', 'recoverability', 'data_integrity'],
                expectedKeywords: ['backpressure', 'retries', 'dead']
            },
            {
                id: 'api_rollout',
                question: 'A core API refactor is ready. Which rollout plan reduces blast radius?',
                options: [
                    'Canary deployment with telemetry gates and automated rollback',
                    'Global rollout in one step during peak traffic',
                    'Ship immediately and patch issues afterward'
                ],
                criteria: ['blast_radius', 'reversibility', 'confidence'],
                expectedKeywords: ['canary', 'telemetry', 'rollback']
            },
            {
                id: 'auth_incident',
                question: 'Suspicious auth activity is detected. What is the strongest response?',
                options: [
                    'Contain suspicious sessions, rotate secrets, and preserve audit trail',
                    'Ignore anomaly until daily incident review',
                    'Disable auth checks temporarily to reduce friction'
                ],
                criteria: ['security', 'auditability', 'containment'],
                expectedKeywords: ['contain', 'rotate', 'audit']
            },
            {
                id: 'data_conflict',
                question: 'Concurrent edits cause conflicts in shared documents. Preferred strategy?',
                options: [
                    'Operational transform plus conflict prompts and immutable history',
                    'Randomly select winner writes and discard others',
                    'Always use last-write-wins with no user feedback'
                ],
                criteria: ['data_integrity', 'user_trust', 'recoverability'],
                expectedKeywords: ['operational', 'conflict', 'history']
            },
            {
                id: 'vendor_outage',
                question: 'Third-party payments API is unstable. Most resilient architecture?',
                options: [
                    'Circuit breaker with queue fallback and replay pipeline',
                    'Block all checkouts until provider recovery',
                    'Retry endlessly in-line on user requests'
                ],
                criteria: ['resilience', 'latency_control', 'failure_isolation'],
                expectedKeywords: ['circuit', 'fallback', 'replay']
            }
        ];
    }

    evaluateRecommendation(recommendation: string, expectedKeywords: string[]): boolean {
        const normalized = recommendation.toLowerCase();
        const hits = expectedKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase())).length;
        const threshold = Math.max(1, Math.ceil(expectedKeywords.length * 0.6));
        return hits >= threshold;
    }
}

/**
 * adaptation_cell
 * Summarizes drill outcomes into cycle-level learning metrics.
 */
export class AdaptationCell {
    summarize(drillResults: DrillResult[]): {
        drillsPassed: number;
        failedDrills: string[];
        successRate: number;
    } {
        const drillsPassed = drillResults.filter((result) => result.success).length;
        const failedDrills = drillResults.filter((result) => !result.success).map((result) => result.id);
        const successRate = drillResults.length > 0 ? drillsPassed / drillResults.length : 0;

        return {
            drillsPassed,
            failedDrills,
            successRate
        };
    }
}
