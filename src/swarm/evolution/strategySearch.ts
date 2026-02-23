import fs from 'fs/promises';
import path from 'path';
import { mutateGenome, crossover } from './strategyMutation.js';
import { boundedGenome, type StrategyGenome } from './strategyGenome.js';

export interface GenomeEvaluation {
  genome: StrategyGenome;
  score: number;
  trainScore: number;
  validationScore: number;
}

export interface StrategySearchResult {
  population: StrategyGenome[];
  bestGenome: StrategyGenome;
  bestScore: number;
  trainScore: number;
  validationScore: number;
  evaluations: GenomeEvaluation[];
}

const POPULATION_PATH = path.join(process.cwd(), 'swarm', 'benchmarks', 'strategy_population.json');

function seededShuffle<T>(items: T[], seed: number): T[] {
  const list = [...items];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const j = (seed * (index + 3)) % (index + 1);
    [list[index], list[j]] = [list[j], list[index]];
  }
  return list;
}

function scoreGenome(genome: StrategyGenome, benchmarkIds: string[]): number {
  const toolBoost = (genome.parameters.usesRetrieval ? 0.015 : 0)
    + (genome.parameters.usesStaticAnalysis ? 0.02 : 0)
    + (genome.parameters.usesTestLoop ? 0.02 : 0);
  const budgetPenalty = Math.max(0, ((genome.parameters.reasoningBudget ?? 5) - 6) * 0.005);

  const base = genome.mutationIntensity * 0.2;
  const complexity = (genome.parameters.treeDepth ?? 2) * 0.02 + (genome.parameters.debateAgents ?? 2) * 0.015;
  const workload = benchmarkIds.length * 0.01;
  return Number((0.52 + base + complexity + workload + toolBoost - budgetPenalty).toFixed(4));
}

async function loadPopulation(): Promise<StrategyGenome[]> {
  try {
    const data = await fs.readFile(POPULATION_PATH, 'utf8');
    return JSON.parse(data) as StrategyGenome[];
  } catch {
    return [];
  }
}

async function savePopulation(population: StrategyGenome[]): Promise<void> {
  await fs.mkdir(path.dirname(POPULATION_PATH), { recursive: true });
  await fs.writeFile(POPULATION_PATH, JSON.stringify(population, null, 2), 'utf8');
}

export async function runStrategySearch(
  benchmarkIds: string[],
  seed: number,
  plateaued: boolean,
  previousBest?: number,
): Promise<StrategySearchResult> {
  const prior = await loadPopulation();
  const basePopulation = prior.length > 0 ? prior : [
    { strategyType: 'direct', parameters: { reasoningBudget: 4, usesRetrieval: false, usesStaticAnalysis: false, usesTestLoop: false }, mutationIntensity: 0.2 },
    { strategyType: 'reflection', parameters: { reflectionRounds: 2, reasoningBudget: 5, usesRetrieval: false, usesStaticAnalysis: true, usesTestLoop: true }, mutationIntensity: 0.25 },
    { strategyType: 'tree_of_thought', parameters: { treeDepth: 3, reasoningBudget: 6, usesRetrieval: true, usesStaticAnalysis: true, usesTestLoop: true }, mutationIntensity: 0.3 },
    { strategyType: 'debate', parameters: { debateAgents: 2, reasoningBudget: 5, usesRetrieval: false, usesStaticAnalysis: true, usesTestLoop: false }, mutationIntensity: 0.25 },
    { strategyType: 'self_consistency', parameters: { selfConsistencyK: 5, reasoningBudget: 6, usesRetrieval: true, usesStaticAnalysis: false, usesTestLoop: true }, mutationIntensity: 0.25 },
  ].map(boundedGenome);

  const populationSize = plateaued ? Math.min(10, basePopulation.length + 2) : Math.max(5, basePopulation.length);
  const shuffledBenchmarks = seededShuffle(benchmarkIds, seed);
  const splitIdx = Math.max(1, Math.floor(shuffledBenchmarks.length * 0.7));
  const train = shuffledBenchmarks.slice(0, splitIdx);
  const validation = shuffledBenchmarks.slice(splitIdx);

  const evaluated: GenomeEvaluation[] = basePopulation.map((genome) => {
    const trainScore = scoreGenome(genome, train);
    const validationScore = scoreGenome(genome, validation.length > 0 ? validation : train);
    const score = Number(((trainScore + validationScore) / 2).toFixed(4));
    return { genome, score, trainScore, validationScore };
  }).sort((a, b) => b.score - a.score);

  const survivorCount = Math.max(1, Math.ceil(evaluated.length * 0.3));
  const survivors = evaluated.slice(0, survivorCount);
  const nextPopulation: StrategyGenome[] = survivors.map((candidate) => candidate.genome);

  while (nextPopulation.length < populationSize) {
    const a = survivors[nextPopulation.length % survivors.length].genome;
    const b = survivors[(nextPopulation.length + 1) % survivors.length].genome;
    const child = crossover(a, b, seed + nextPopulation.length);
    const intensity = plateaued
      ? Math.min(1, child.mutationIntensity + 0.1)
      : previousBest !== undefined && survivors[0].score > previousBest
        ? Math.max(0.05, child.mutationIntensity - 0.05)
        : child.mutationIntensity;

    nextPopulation.push(mutateGenome(child, intensity, seed + nextPopulation.length * 13));
  }

  await savePopulation(nextPopulation);

  const best = survivors[0];
  return {
    population: nextPopulation,
    bestGenome: best.genome,
    bestScore: best.score,
    trainScore: best.trainScore,
    validationScore: best.validationScore,
    evaluations: evaluated,
  };
}
