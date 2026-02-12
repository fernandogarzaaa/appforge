/**
 * LearningSwarm - Autonomous reasoning hardening and continuous improvement.
 *
 * Focus:
 * - Run adversarial reasoning drills
 * - Feed outcomes back into Oracle learning state
 * - Persist cycle summaries for cross-session improvement
 */

import path from 'path';
import * as fs from 'fs/promises';
import { QuantumSwarmCore } from '../core/quantum_core.js';
import { memory } from '../core/persistent_memory.js';
import { swarmCollaboration } from '../core/swarm_collaboration.js';
import {
    AdaptationCell,
    BenchmarkReviewCell,
    type BenchmarkSnapshot,
    DrillExecutionCell,
    type DrillResult
} from './internal/learning_cells.js';

interface LearningCycleReport {
    timestamp: string;
    benchmark: BenchmarkSnapshot | null;
    focus: string;
    strategicRecommendation: string;
    drillsExecuted: number;
    drillsPassed: number;
    successRate: number;
    failedDrills: string[];
}

interface LearningConfig {
    drillsPerCycle: number;
    reportFilePath: string;
    memoryTtlSeconds: number;
}

export class LearningSwarm {
    private quantumCore: QuantumSwarmCore;
    private config: LearningConfig;
    private latestReport: LearningCycleReport | null;
    private benchmarkReviewCell: BenchmarkReviewCell;
    private drillExecutionCell: DrillExecutionCell;
    private adaptationCell: AdaptationCell;

    constructor(config?: Partial<LearningConfig>) {
        this.quantumCore = new QuantumSwarmCore();
        this.config = {
            drillsPerCycle: config?.drillsPerCycle ?? 5,
            reportFilePath: config?.reportFilePath
                ?? path.join(process.cwd(), 'swarm', 'data', 'learning_swarm_report.json'),
            memoryTtlSeconds: config?.memoryTtlSeconds ?? 60 * 60 * 24 * 7
        };
        this.latestReport = null;
        this.benchmarkReviewCell = new BenchmarkReviewCell();
        this.drillExecutionCell = new DrillExecutionCell();
        this.adaptationCell = new AdaptationCell();
    }

    /**
     * Run one learning cycle.
     */
    async runCycle(): Promise<LearningCycleReport> {
        console.log('🧠 [LearningSwarm] Starting learning cycle...');
        console.log('   🧩 Internal cells: benchmark_review_cell -> drill_execution_cell -> adaptation_cell');

        const benchmark = await this.benchmarkReviewCell.loadBenchmarkSnapshot();
        const focus = await this.selectFocus(benchmark);
        const drills = this.drillExecutionCell.buildReasoningDrills().slice(0, this.config.drillsPerCycle);
        const drillResults: DrillResult[] = [];

        for (const drill of drills) {
            const decision = await this.quantumCore.consultOracle(
                drill.question,
                drill.options,
                drill.criteria
            );

            const success = this.drillExecutionCell.evaluateRecommendation(
                decision.recommendation,
                drill.expectedKeywords
            );
            await this.quantumCore.reportOutcome(decision.predictionId, success, {
                source: 'learning_swarm_reasoning_drill',
                drillId: drill.id,
                recommendation: decision.recommendation,
                expectedKeywords: drill.expectedKeywords
            });

            await memory.learn('LearningSwarm', `drill:${drill.id}`, success, success ? 10 : -8);

            drillResults.push({
                id: drill.id,
                recommendation: decision.recommendation,
                success,
                confidence: decision.confidence
            });
        }

        const strategicRecommendation = await this.generateStrategicRecommendation(
            benchmark,
            focus,
            drillResults
        );

        const summary = this.adaptationCell.summarize(drillResults);

        const report: LearningCycleReport = {
            timestamp: new Date().toISOString(),
            benchmark,
            focus,
            strategicRecommendation,
            drillsExecuted: drillResults.length,
            drillsPassed: summary.drillsPassed,
            successRate: summary.successRate,
            failedDrills: summary.failedDrills
        };

        await this.persistReport(report);
        await memory.set('learning_swarm:last_report', report, this.config.memoryTtlSeconds);

        await swarmCollaboration.sendSignal({
            fromAgent: 'LearningSwarm',
            toAgent: 'GodMode',
            type: 'FINDING',
            payload: {
                type: 'LEARNING_SWARM_REPORT',
                focus,
                successRate: Number((summary.successRate * 100).toFixed(1)),
                strategicRecommendation
            },
            priority: 'MEDIUM'
        });

        this.latestReport = report;

        console.log(
            `✅ [LearningSwarm] Cycle complete | Focus: ${focus} | Success Rate: ${(summary.successRate * 100).toFixed(1)}%`
        );

        return report;
    }

    getLatestReport(): LearningCycleReport | null {
        return this.latestReport;
    }

    private async selectFocus(benchmark: BenchmarkSnapshot | null): Promise<string> {
        const weakest = benchmark?.weakestDimension ?? 'reasoning';
        const overallScore = benchmark?.overallScore ?? 0;

        const decision = await this.quantumCore.consultOracle(
            `LearningSwarm focus selection. Current weakest dimension: ${weakest}. Overall score: ${overallScore}/100.`,
            [
                'Reasoning hardening with adversarial drills and outcome feedback',
                'Planning/autonomy orchestration and multi-agent dependency checks',
                'Reliability stress checks and latency regression detection',
                'Revenue optimization execution before intelligence expansion'
            ],
            ['reasoning', 'risk_reduction', 'execution_speed', 'long_term_capability']
        );

        await this.quantumCore.reportOutcome(decision.predictionId, true, {
            source: 'learning_swarm_focus_selection',
            benchmark
        });

        return decision.recommendation;
    }

    private async generateStrategicRecommendation(
        benchmark: BenchmarkSnapshot | null,
        focus: string,
        drillResults: DrillResult[]
    ): Promise<string> {
        const failed = drillResults.filter((result) => !result.success).map((result) => result.id);

        const decision = await this.quantumCore.consultOracle(
            `LearningSwarm next action. Focus: ${focus}. Failed drills: ${failed.join(', ') || 'none'}. Benchmark weakest dimension: ${benchmark?.weakestDimension || 'unknown'}.`,
            [
                'Increase adversarial drill frequency and expand failure-mode coverage',
                'Run cross-swarm postmortems and push targeted recommendations',
                'Prioritize reliability chaos tests under concurrent load',
                'Shift cycles toward revenue-only automations'
            ],
            ['reasoning', 'execution_speed', 'risk_reduction', 'system_stability']
        );

        await this.quantumCore.reportOutcome(decision.predictionId, true, {
            source: 'learning_swarm_strategy',
            benchmark,
            failedDrills: failed
        });

        return decision.recommendation;
    }

    private async persistReport(report: LearningCycleReport): Promise<void> {
        await fs.mkdir(path.dirname(this.config.reportFilePath), { recursive: true });
        await fs.writeFile(this.config.reportFilePath, JSON.stringify(report, null, 2), 'utf8');
    }
}
