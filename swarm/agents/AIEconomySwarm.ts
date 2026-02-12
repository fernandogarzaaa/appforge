/**
 * AIEconomySwarm - Self-sustaining AI economy orchestration.
 *
 * Multi-agent collective:
 * - revenue_aggregation_cell
 * - treasury_allocation_cell
 * - flywheel_execution_cell
 */

import * as fs from 'fs/promises';
import path from 'path';
import { QuantumSwarmCore } from '../core/quantum_core.js';
import { memory } from '../core/persistent_memory.js';
import { swarmCollaboration } from '../core/swarm_collaboration.js';
import {
    type AllocationStrategy,
    FlywheelExecutionCell,
    RevenueAggregationCell,
    TreasuryAllocationCell,
    type TreasuryAllocation
} from './internal/ai_economy_cells.js';

interface AIEconomyReport {
    timestamp: string;
    grossInflow: number;
    operatingCost: number;
    netInflow: number;
    reserveBefore: number;
    reserveAfter: number;
    activeSources: number;
    strategy: string;
    strategySource: 'oracle' | 'fallback_policy';
    oracleRecommendation: string;
    oracleConfidence: number;
    oracleMinConfidence: number;
    oracleAccepted: boolean;
    sustainabilityScore: number;
    allocation: TreasuryAllocation;
    milestones: string[];
}

export class AIEconomySwarm {
    private quantumCore: QuantumSwarmCore;
    private reportPath: string;
    private reservePath: string;
    private latestReport: AIEconomyReport | null;
    private oracleMinConfidence: number;
    private fallbackStrategy: AllocationStrategy;
    private revenueAggregationCell: RevenueAggregationCell;
    private treasuryAllocationCell: TreasuryAllocationCell;
    private flywheelExecutionCell: FlywheelExecutionCell;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
        this.reportPath = path.join(process.cwd(), 'swarm', 'data', 'ai_economy_swarm_report.json');
        this.reservePath = path.join(process.cwd(), 'swarm', 'data', 'treasury_reserve.json');
        this.latestReport = null;
        this.oracleMinConfidence = this.parseConfidence(
            process.env.AI_ECONOMY_ORACLE_MIN_CONFIDENCE,
            0.55
        );
        this.fallbackStrategy = 'defensive_compounding';
        this.revenueAggregationCell = new RevenueAggregationCell();
        this.treasuryAllocationCell = new TreasuryAllocationCell();
        this.flywheelExecutionCell = new FlywheelExecutionCell();
    }

    async runCycle(): Promise<AIEconomyReport> {
        console.log('🏛️ [AIEconomySwarm] Building self-sustaining AI economy cycle...');
        console.log('   🧩 Internal cells: revenue_aggregation_cell -> treasury_allocation_cell -> flywheel_execution_cell');

        const metrics = await this.revenueAggregationCell.collectMetrics();
        const grossInflow = Number(
            (
                metrics.recurringRevenue
                + metrics.pipelineRevenue
                + metrics.expansionRevenue
                + metrics.tradingRevenue
            ).toFixed(2)
        );
        const netInflow = Number((grossInflow - metrics.operatingCost).toFixed(2));

        const decision = await this.quantumCore.consultOracle(
            `AIEconomySwarm planning for a self-sustaining AI economy. Sourced inflow=$${grossInflow.toFixed(2)}, operatingCost=$${metrics.operatingCost.toFixed(2)}, activeSources=${metrics.activeSources}, reserveBalance=$${metrics.reserveBalance.toFixed(2)}. As a multi-agent collective, which treasury strategy should execute now?`,
            [
                'DEFENSIVE_COMPOUNDING - prioritize reserve runway and stable compounding',
                'BALANCED_FLYWHEEL - balance reserve, growth reinvestment, and reliability',
                'AGGRESSIVE_EXPANSION - maximize growth and experimentation despite lower reserve'
            ],
            ['runway_safety', 'revenue_growth', 'system_resilience', 'long_term_sustainability']
        );

        const oracleConfidence = this.clamp(decision.confidence, 0, 1);
        const oracleAccepted = oracleConfidence >= this.oracleMinConfidence;
        const strategy = oracleAccepted
            ? this.treasuryAllocationCell.resolveStrategy(decision.recommendation)
            : this.fallbackStrategy;
        const strategySource: 'oracle' | 'fallback_policy' = oracleAccepted ? 'oracle' : 'fallback_policy';

        if (!oracleAccepted) {
            console.warn(
                `⚠️ [AIEconomySwarm] Oracle recommendation rejected (${(oracleConfidence * 100).toFixed(1)}% < ${(this.oracleMinConfidence * 100).toFixed(1)}%). Using fallback strategy: ${this.fallbackStrategy}`
            );
        }

        await this.quantumCore.reportOutcome(decision.predictionId, oracleAccepted, {
            source: 'ai_economy_swarm_strategy',
            grossInflow,
            netInflow,
            operatingCost: metrics.operatingCost,
            oracleConfidence,
            oracleMinConfidence: this.oracleMinConfidence,
            oracleAccepted,
            strategy,
            strategySource
        });

        const allocation = this.treasuryAllocationCell.allocate(strategy, Math.max(grossInflow, 0));
        const reserveAfter = Number(
            Math.max(0, metrics.reserveBalance + allocation.reserveAmount - metrics.operatingCost).toFixed(2)
        );
        const sustainabilityScore = this.computeSustainabilityScore(
            reserveAfter,
            metrics.operatingCost,
            metrics.activeSources,
            grossInflow,
            allocation
        );
        const milestones = this.flywheelExecutionCell.buildMilestones(allocation);

        const report: AIEconomyReport = {
            timestamp: new Date().toISOString(),
            grossInflow,
            operatingCost: metrics.operatingCost,
            netInflow,
            reserveBefore: metrics.reserveBalance,
            reserveAfter,
            activeSources: metrics.activeSources,
            strategy,
            strategySource,
            oracleRecommendation: decision.recommendation,
            oracleConfidence: Number(oracleConfidence.toFixed(3)),
            oracleMinConfidence: Number(this.oracleMinConfidence.toFixed(3)),
            oracleAccepted,
            sustainabilityScore,
            allocation,
            milestones
        };

        await this.persistReport(report);
        await this.persistReserveState(report);
        await memory.set('ai_economy_swarm:last_report', report, 60 * 60 * 24 * 7);
        await this.dispatchBudgets(report);

        await swarmCollaboration.sendSignal({
            fromAgent: 'AIEconomySwarm',
            toAgent: 'ProductOwner',
            type: 'FINDING',
            payload: {
                type: 'AI_ECONOMY_REPORT',
                strategy: report.strategy,
                sustainabilityScore: report.sustainabilityScore,
                reserveAfter: report.reserveAfter,
                milestones: report.milestones
            },
            priority: 'HIGH'
        });

        this.latestReport = report;
        console.log(
            `✅ [AIEconomySwarm] Cycle complete | Strategy: ${report.strategy} | Sustainability ${(report.sustainabilityScore * 100).toFixed(1)}%`
        );

        return report;
    }

    getLatestReport(): AIEconomyReport | null {
        return this.latestReport;
    }

    private computeSustainabilityScore(
        reserveAfter: number,
        operatingCost: number,
        activeSources: number,
        grossInflow: number,
        allocation: TreasuryAllocation
    ): number {
        const runwayMonths = operatingCost > 0 ? reserveAfter / operatingCost : 0;
        const runwayScore = this.clamp(runwayMonths / 6, 0, 1);
        const diversificationScore = this.clamp(activeSources / 4, 0, 1);
        const reinvestRatio = grossInflow > 0
            ? (allocation.growthAmount + allocation.experimentationAmount) / grossInflow
            : 0;
        const reinvestScore = this.clamp(reinvestRatio, 0, 1);
        return Number(this.clamp(
            (runwayScore * 0.4) + (diversificationScore * 0.3) + (reinvestScore * 0.3),
            0,
            1
        ).toFixed(3));
    }

    private async dispatchBudgets(report: AIEconomyReport): Promise<void> {
        await Promise.all([
            swarmCollaboration.sendSignal({
                fromAgent: 'AIEconomySwarm',
                toAgent: 'CustomerSuccessSwarm',
                type: 'TASK',
                payload: {
                    type: 'RETENTION_GROWTH_BUDGET',
                    budget: report.allocation.growthAmount,
                    target: 'expansion_revenue'
                },
                priority: 'MEDIUM'
            }),
            swarmCollaboration.sendSignal({
                fromAgent: 'AIEconomySwarm',
                toAgent: 'ExperimentationSwarm',
                type: 'TASK',
                payload: {
                    type: 'EXPERIMENT_BUDGET',
                    budget: report.allocation.experimentationAmount,
                    target: 'conversion_uplift'
                },
                priority: 'MEDIUM'
            }),
            swarmCollaboration.sendSignal({
                fromAgent: 'AIEconomySwarm',
                toAgent: 'DevOpsSwarm',
                type: 'TASK',
                payload: {
                    type: 'RELIABILITY_BUDGET',
                    budget: report.allocation.infrastructureAmount,
                    target: 'operating_cost_efficiency'
                },
                priority: 'MEDIUM'
            }),
            swarmCollaboration.sendSignal({
                fromAgent: 'AIEconomySwarm',
                toAgent: 'RevenueHunter',
                type: 'TASK',
                payload: {
                    type: 'TREASURY_RESERVE_TARGET',
                    reserveTarget: report.reserveAfter
                },
                priority: 'HIGH'
            })
        ]);
    }

    private async persistReport(report: AIEconomyReport): Promise<void> {
        await fs.mkdir(path.dirname(this.reportPath), { recursive: true });
        await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2), 'utf8');
    }

    private async persistReserveState(report: AIEconomyReport): Promise<void> {
        await fs.mkdir(path.dirname(this.reservePath), { recursive: true });
        await fs.writeFile(this.reservePath, JSON.stringify({
            updatedAt: report.timestamp,
            reserveBalance: report.reserveAfter,
            strategy: report.strategy
        }, null, 2), 'utf8');
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
    }

    private parseConfidence(rawValue: string | undefined, fallback: number): number {
        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }
        return this.clamp(parsed, 0, 1);
    }
}
