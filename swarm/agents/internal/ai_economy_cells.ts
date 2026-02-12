import * as fs from 'fs/promises';
import path from 'path';

export interface EconomySourceMetrics {
    recurringRevenue: number;
    pipelineRevenue: number;
    expansionRevenue: number;
    tradingRevenue: number;
    operatingCost: number;
    reserveBalance: number;
    activeSources: number;
}

export interface TreasuryAllocation {
    strategy: AllocationStrategy;
    reserveAmount: number;
    growthAmount: number;
    experimentationAmount: number;
    infrastructureAmount: number;
    percentages: Record<'reserve' | 'growth' | 'experimentation' | 'infrastructure', number>;
}

export type AllocationStrategy = 'defensive_compounding' | 'balanced_flywheel' | 'aggressive_expansion';

/**
 * revenue_aggregation_cell
 * Aggregates revenue signals from existing swarm artifacts.
 */
export class RevenueAggregationCell {
    private readonly dataDir: string;

    constructor(dataDir?: string) {
        this.dataDir = dataDir ?? path.join(process.cwd(), 'swarm', 'data');
    }

    async collectMetrics(): Promise<EconomySourceMetrics> {
        const [
            revenueStats,
            freelancePipeline,
            customerSuccess,
            experimentation,
            reserveState,
            devops
        ] = await Promise.all([
            this.readJson<Record<string, any>>('revenue_stats.json'),
            this.readJson<any[]>('freelance_pipeline.json'),
            this.readJson<Record<string, any>>('customer_success_swarm_report.json'),
            this.readJson<Record<string, any>>('experimentation_swarm_report.json'),
            this.readJson<Record<string, any>>('treasury_reserve.json'),
            this.readJson<Record<string, any>>('devops_swarm_report.json')
        ]);

        const subscriptions = Number(revenueStats?.subscriptionsActive ?? 0);
        const realizedRevenue = Number(revenueStats?.totalRevenue ?? 0);
        const recurringRevenue = this.clamp(
            (subscriptions * 99) + Math.max(realizedRevenue, 0),
            0,
            Number.MAX_SAFE_INTEGER
        );

        const pipelineRaw = Array.isArray(freelancePipeline)
            ? freelancePipeline.reduce((sum, item) => sum + Number(item?.value ?? 0), 0)
            : 0;
        const pipelineRevenue = Math.max(0, pipelineRaw * 0.2);

        const upsellTargets = Number(customerSuccess?.upsellTargets ?? 0);
        const experimentHandovers = Number(experimentation?.executedHandovers ?? 0);
        const expansionRevenue = Math.max(0, (upsellTargets * 149) + (experimentHandovers * 60));

        const tradingRevenue = this.estimateTradingRevenue(revenueStats);

        const warnings = Array.isArray(devops?.checks)
            ? devops.checks.filter((c: any) => String(c?.status) === 'warning').length
            : 0;
        const critical = Array.isArray(devops?.checks)
            ? devops.checks.filter((c: any) => String(c?.status) === 'critical').length
            : 0;
        const operatingCost = 900 + (warnings * 120) + (critical * 260);

        const reserveBalance = Number(reserveState?.reserveBalance ?? 0);
        const activeSources = [
            recurringRevenue,
            pipelineRevenue,
            expansionRevenue,
            tradingRevenue
        ].filter((value) => value > 0).length;

        return {
            recurringRevenue: Number(recurringRevenue.toFixed(2)),
            pipelineRevenue: Number(pipelineRevenue.toFixed(2)),
            expansionRevenue: Number(expansionRevenue.toFixed(2)),
            tradingRevenue: Number(tradingRevenue.toFixed(2)),
            operatingCost: Number(operatingCost.toFixed(2)),
            reserveBalance: Number(reserveBalance.toFixed(2)),
            activeSources
        };
    }

    private estimateTradingRevenue(revenueStats: Record<string, any> | null): number {
        const avgTx = Number(revenueStats?.averageTransactionValue ?? 0);
        const pending = Number(revenueStats?.pendingRevenue ?? 0);
        return Math.max(0, (avgTx * 3) + (pending * 0.1));
    }

    private async readJson<T>(fileName: string): Promise<T | null> {
        const targetPath = path.join(this.dataDir, fileName);
        try {
            const raw = await fs.readFile(targetPath, 'utf8');
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
    }
}

/**
 * treasury_allocation_cell
 * Converts strategy intent into budget allocations.
 */
export class TreasuryAllocationCell {
    resolveStrategy(recommendation: string): AllocationStrategy {
        const normalized = recommendation.toLowerCase();
        if (normalized.includes('aggressive')) return 'aggressive_expansion';
        if (normalized.includes('defensive')) return 'defensive_compounding';
        return 'balanced_flywheel';
    }

    allocate(strategy: AllocationStrategy, grossInflow: number): TreasuryAllocation {
        const percentages = strategy === 'defensive_compounding'
            ? { reserve: 0.45, growth: 0.2, experimentation: 0.15, infrastructure: 0.2 }
            : strategy === 'aggressive_expansion'
                ? { reserve: 0.2, growth: 0.4, experimentation: 0.25, infrastructure: 0.15 }
                : { reserve: 0.32, growth: 0.28, experimentation: 0.2, infrastructure: 0.2 };

        const reserveAmount = grossInflow * percentages.reserve;
        const growthAmount = grossInflow * percentages.growth;
        const experimentationAmount = grossInflow * percentages.experimentation;
        const infrastructureAmount = grossInflow * percentages.infrastructure;

        return {
            strategy,
            reserveAmount: Number(reserveAmount.toFixed(2)),
            growthAmount: Number(growthAmount.toFixed(2)),
            experimentationAmount: Number(experimentationAmount.toFixed(2)),
            infrastructureAmount: Number(infrastructureAmount.toFixed(2)),
            percentages
        };
    }
}

/**
 * flywheel_execution_cell
 * Builds concrete execution milestones from budget allocations.
 */
export class FlywheelExecutionCell {
    buildMilestones(allocation: TreasuryAllocation): string[] {
        return [
            `Reserve treasury to +$${allocation.reserveAmount.toFixed(2)} for runway extension`,
            `Fund retention and upsell execution with $${allocation.growthAmount.toFixed(2)}`,
            `Fund experiment velocity with $${allocation.experimentationAmount.toFixed(2)}`,
            `Harden reliability and deployment with $${allocation.infrastructureAmount.toFixed(2)}`
        ];
    }
}
