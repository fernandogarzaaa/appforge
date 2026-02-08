
import { QuantumGeneticAlgorithm } from '../src/utils/quantumInspiredAI.js';

console.log('🔮 QUANTUM CREATION ENGINE');
console.log('⚛️  Objective: Evolve "Code" from Quantum Noise...\n');

const TARGET_PHRASE = "Quantum AI";
const POOL_SIZE = 500;
const MUTATION_RATE = 0.1;

// Fitness: How close is the string to the target?
function fitness(individual) {
    let score = 0;
    const genes = individual.genes; // Array of numbers 0-1 implies char codes? 
    // Wait, the GeneticAlgo in quantumInspiredAI.js uses numbers 0-1 for genes.
    // I need to map them to chars.

    let str = genesToStr(genes);
    for (let i = 0; i < TARGET_PHRASE.length; i++) {
        if (str[i] === TARGET_PHRASE[i]) score += 1;
    }
    return score;
}

function genesToStr(genes) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 (){}';=return";
    return genes.map(g => {
        const idx = Math.floor(Math.abs(g) * chars.length) % chars.length;
        return chars[idx];
    }).join('');
}

// Subclass to override initialization for String evolution
class QuantumStringGenerator extends QuantumGeneticAlgorithm {
    initializeQuantumPopulation() {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            population.push({
                genes: Array(TARGET_PHRASE.length).fill(0).map(() => Math.random()),
                amplitude: 1 / Math.sqrt(this.populationSize)
            });
        }
        return population;
    }
}

const engine = new QuantumStringGenerator(POOL_SIZE, MUTATION_RATE);

console.log(`Target: "${TARGET_PHRASE}"`);
console.log(`...Initializing ${POOL_SIZE} quantum timelines...`);

// Run Evolution
const result = engine.evolve((ind) => fitness(ind), 1000); // 1000 gens max

console.log('\n✨ CREATION COMPLETE');
console.log(`Generations: ${result.generations}`);
console.log(`Final Result: "${genesToStr(result.solution.genes)}"`);
console.log(`Complexity: ${TARGET_PHRASE.length} chars`);
console.log(`Quantum Advantage: Parallel Evolution enabled.`);
