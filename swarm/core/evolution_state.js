import * as fs from 'fs/promises';
import * as path from 'path';
const DEFAULT_STATE = {
    totalCycles: 0,
    totalPRsCreated: 0,
    totalMerges: 0,
    lastMutationScore: 0,
    mutationHistory: [],
    benchmarkHistory: [],
    lastBenchmarkScore: 0,
    consecutiveNoImprovementCycles: 0,
    bestHistoricalScore: 0,
    plateaued: false,
    mutationIntensity: 'normal',
    mutationScope: 'standard',
    strategyPerformance: {},
    seedVariance: 0,
    stabilityIndex: 1,
    nonDominatedGenomes: [],
    dominatedCount: 0,
    frontierChangesPerCycle: 0,
    datasetVersion: 0,
    checkpointVersion: 0,
    learningCycles: 0,
};
export class EvolutionState {
    static STATE_PATH = path.join(process.cwd(), 'swarm', 'evolution_state.json');
    static async load() {
        try {
            const data = await fs.readFile(this.STATE_PATH, 'utf8');
            const parsed = JSON.parse(data);
            return {
                ...DEFAULT_STATE,
                ...parsed,
                mutationHistory: parsed.mutationHistory ?? [],
                benchmarkHistory: parsed.benchmarkHistory ?? [],
                strategyPerformance: parsed.strategyPerformance ?? {},
                nonDominatedGenomes: parsed.nonDominatedGenomes ?? [],
            };
        }
        catch {
            return { ...DEFAULT_STATE };
        }
    }
    static async save(state) {
        const dir = path.dirname(this.STATE_PATH);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
    }
    static async recordBenchmarkCycle(entry) {
        const state = await this.load();
        const improved = entry.scoreDelta > 0;
        const consecutiveNoImprovementCycles = improved ? 0 : state.consecutiveNoImprovementCycles + 1;
        const bestHistoricalScore = Math.max(state.bestHistoricalScore, entry.finalScore);
        const plateaued = consecutiveNoImprovementCycles >= 5;
        const mutationIntensity = plateaued ? 'elevated' : 'normal';
        const mutationScope = plateaued ? 'expanded' : 'standard';
        const historyEntry = {
            ...entry,
            plateaued,
            noImprovementCycles: consecutiveNoImprovementCycles,
            mutationIntensity,
            mutationScope,
        };
        const nextState = {
            ...state,
            totalCycles: state.totalCycles + 1,
            lastBenchmarkScore: entry.finalScore,
            benchmarkHistory: [...state.benchmarkHistory, historyEntry],
            totalPRsCreated: entry.prEligible ? state.totalPRsCreated + 1 : state.totalPRsCreated,
            consecutiveNoImprovementCycles,
            bestHistoricalScore,
            plateaued,
            mutationIntensity,
            mutationScope,
            seedVariance: entry.seedVariance,
            stabilityIndex: entry.stabilityIndex,
            nonDominatedGenomes: state.nonDominatedGenomes,
            dominatedCount: state.dominatedCount,
            frontierChangesPerCycle: state.frontierChangesPerCycle,
            datasetVersion: entry.datasetVersion,
            checkpointVersion: entry.checkpointVersion,
            learningCycles: entry.learningCycles,
        };
        await this.save(nextState);
        return nextState;
    }
}
