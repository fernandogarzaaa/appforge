import { SwarmExperimentManager, type ExperimentRecord, type ExperimentExecutionContext } from './swarm_experiment_manager.js';

export interface StrategyCandidate {
    id: string;
    strategy: string;
    execute: (context: ExperimentExecutionContext) => Promise<void>;
}

export interface StrategyEngineResult {
    runId: string;
    experiments: ExperimentRecord[];
    successRates: Record<string, number>;
}

export class SwarmStrategyEngine {
    private readonly experimentManager: SwarmExperimentManager;
    private readonly successRates = new Map<string, number>();

    constructor(experimentManager?: SwarmExperimentManager) {
        this.experimentManager = experimentManager ?? new SwarmExperimentManager();
    }

    async testStrategies(runId: string, strategies: StrategyCandidate[]): Promise<StrategyEngineResult> {
        const experiments = await this.experimentManager.runExperimentsInParallel(
            strategies.map((candidate) => ({
                runId,
                experimentId: candidate.id,
                strategy: candidate.strategy,
                execute: candidate.execute
            }))
        );

        for (const experiment of experiments) {
            this.updateStrategySuccessRate(experiment.strategy, experiment.result === 'success');
        }

        return {
            runId,
            experiments,
            successRates: Object.fromEntries(this.successRates.entries())
        };
    }

    async cleanupOldExperiments(): Promise<string[]> {
        return this.experimentManager.cleanupStaleExperimentBranches(24);
    }

    private updateStrategySuccessRate(strategy: string, succeeded: boolean): void {
        const current = this.successRates.get(strategy) ?? 0;
        const alpha = 0.3;
        const next = current === 0 ? (succeeded ? 1 : 0) : current * (1 - alpha) + (succeeded ? 1 : 0) * alpha;
        this.successRates.set(strategy, Number(next.toFixed(4)));
    }
}
