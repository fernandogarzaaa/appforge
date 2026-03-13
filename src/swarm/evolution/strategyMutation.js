import { boundedGenome } from './strategyGenome.js';
function seededUnit(seed, salt) {
    const value = Math.sin((seed + salt) * 12_989.23) * 43_758.5453;
    return value - Math.floor(value);
}
function toggle(current, seedValue) {
    if (seedValue > 0.7)
        return !(current ?? false);
    return current ?? false;
}
export function mutateGenome(genome, intensity, seed) {
    const delta = (seededUnit(seed, 1) - 0.5) * intensity * 2;
    const next = {
        ...genome,
        parameters: {
            ...genome.parameters,
            treeDepth: genome.parameters.treeDepth !== undefined ? genome.parameters.treeDepth + delta * 2 : undefined,
            debateAgents: genome.parameters.debateAgents !== undefined ? genome.parameters.debateAgents + delta * 2 : undefined,
            reflectionRounds: genome.parameters.reflectionRounds !== undefined ? genome.parameters.reflectionRounds + delta * 2 : undefined,
            selfConsistencyK: genome.parameters.selfConsistencyK !== undefined ? genome.parameters.selfConsistencyK + delta * 3 : undefined,
            reasoningBudget: genome.parameters.reasoningBudget !== undefined ? genome.parameters.reasoningBudget + delta * 4 : undefined,
            usesRetrieval: toggle(genome.parameters.usesRetrieval, seededUnit(seed, 2)),
            usesStaticAnalysis: toggle(genome.parameters.usesStaticAnalysis, seededUnit(seed, 3)),
            usesTestLoop: toggle(genome.parameters.usesTestLoop, seededUnit(seed, 4)),
        },
        mutationIntensity: genome.mutationIntensity + delta * 0.2,
    };
    return boundedGenome(next);
}
export function crossover(genomeA, genomeB, seed) {
    const pickA = seededUnit(seed, 2) > 0.5;
    const child = {
        strategyType: pickA ? genomeA.strategyType : genomeB.strategyType,
        parameters: {
            treeDepth: seededUnit(seed, 3) > 0.5 ? genomeA.parameters.treeDepth : genomeB.parameters.treeDepth,
            debateAgents: seededUnit(seed, 4) > 0.5 ? genomeA.parameters.debateAgents : genomeB.parameters.debateAgents,
            reflectionRounds: seededUnit(seed, 5) > 0.5 ? genomeA.parameters.reflectionRounds : genomeB.parameters.reflectionRounds,
            selfConsistencyK: seededUnit(seed, 6) > 0.5 ? genomeA.parameters.selfConsistencyK : genomeB.parameters.selfConsistencyK,
            reasoningBudget: seededUnit(seed, 7) > 0.5 ? genomeA.parameters.reasoningBudget : genomeB.parameters.reasoningBudget,
            usesRetrieval: seededUnit(seed, 8) > 0.5 ? genomeA.parameters.usesRetrieval : genomeB.parameters.usesRetrieval,
            usesStaticAnalysis: seededUnit(seed, 9) > 0.5 ? genomeA.parameters.usesStaticAnalysis : genomeB.parameters.usesStaticAnalysis,
            usesTestLoop: seededUnit(seed, 10) > 0.5 ? genomeA.parameters.usesTestLoop : genomeB.parameters.usesTestLoop,
        },
        mutationIntensity: Number(((genomeA.mutationIntensity + genomeB.mutationIntensity) / 2).toFixed(4)),
    };
    return boundedGenome(child);
}
