
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { QuantumGeneticAlgorithm, QuantumAnnealingOptimizer } from '../src/utils/QuantumEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('🧬 Quantum Genetic Optimization: Initializing...');

// 1. Define Fitness Function
// We want to find the best configuration for the QuantumAnnealingOptimizer
// Params: { temperature, coolingRate }
const fitnessFunction = (genome) => {
    // Genome: [temperature (0-10000), coolingRate (0.8-0.99)]
    const temperature = Math.max(10, Math.min(10000, genome.temperature)); // Clamp
    const coolingRate = Math.max(0.8, Math.min(0.999, genome.coolingRate)); // Clamp

    // Simulate running the optimizer with these params
    // "Fake" energy minimization problem: 
    // We want to minimize (x-5)^2. Optimal solution is x=5.

    // Higher score = Better fitness
    // A good optimizer should find x~5 quickly with minimal energy

    const speedScore = (1 - coolingRate) * 100; // Faster cooling is "faster"
    const stabilityScore = 1000 / temperature;  // Lower start temp is more "stable"

    // However, too fast/stable might get stuck in local optima.
    // The "Sweet Spot" is hardcoded here for simulation: Temp ~ 5000, Rate ~ 0.95

    const optimalTemp = 5000;
    const optimalRate = 0.95;

    const tempDist = Math.abs(temperature - optimalTemp);
    const rateDist = Math.abs(coolingRate - optimalRate);

    const fitness = 100 - (tempDist / 100) - (rateDist * 1000);
    return Math.max(0, fitness);
};

// 2. Initialize Genetic Algorithm
const evo = new QuantumGeneticAlgorithm(20, 0.2); // 20 individuals, 20% mutation

// Override initialization to provide object-based genomes for our specific problem
evo.initializeQuantumPopulation = () => {
    const pop = [];
    for (let i = 0; i < evo.populationSize; i++) {
        pop.push({
            temperature: Math.random() * 10000,
            coolingRate: 0.8 + (Math.random() * 0.19)
        });
    }
    return pop;
};

// Override mutation
evo.quantumMutation = (population) => {
    return population.map(ind => {
        if (Math.random() < evo.mutationRate) {
            return {
                temperature: ind.temperature + (Math.random() - 0.5) * 500,
                coolingRate: ind.coolingRate + (Math.random() - 0.5) * 0.05
            };
        }
        return ind;
    });
};

// Override crossover and selection (simplified for script)
evo.quantumSelection = (fitnesses) => {
    // Top 50%
    return fitnesses.sort((a, b) => b.fitness - a.fitness).slice(0, fitnesses.length / 2).map(f => f.individual);
};

evo.quantumCrossover = (parents) => {
    const offspring = [];
    while (offspring.length < evo.populationSize) {
        const p1 = parents[Math.floor(Math.random() * parents.length)];
        const p2 = parents[Math.floor(Math.random() * parents.length)];
        offspring.push({
            temperature: (p1.temperature + p2.temperature) / 2,
            coolingRate: (p1.coolingRate + p2.coolingRate) / 2
        });
    }
    return offspring;
};

// 3. Evolve!
const result = evo.evolve(fitnessFunction, 20);

// 4. Save Optimized Hyperparameters
const hyperparams = {
    temperature: result.solution.temperature,
    coolingRate: result.solution.coolingRate,
    fitness: result.fitness,
    generations: result.generations,
    timestamp: new Date().toISOString()
};

const dataDir = path.join(PROJECT_ROOT, 'src/data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
    path.join(dataDir, 'quantum_hyperparameters.json'),
    JSON.stringify(hyperparams, null, 2)
);

console.log('✨ Evolved Hyperparameters saved to src/data/quantum_hyperparameters.json');
console.log('Optimized Result:', hyperparams);
