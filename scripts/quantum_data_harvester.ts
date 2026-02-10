
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QuantumEngine from '../QuantumEnginePortable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function harvest() {
    console.log('🌌 Quantum Data Harvester: Scanning the Multiverse (GitHub)...');

    const engine = new QuantumEngine();

    // 1. Harvest Raw Data (Simulated Fetch from GitHub API)
    // In a real run, this would be: await fetch('https://api.github.com/search/repositories?q=language:typescript+stars:>1000')
    console.log('📡 Intercepting signals from high-quality repositories...');

    // Mock Data: 5 Repositories with different characteristics
    const rawRepos = [
        { name: 'facebook/react', stars: 200000, complexity: 0.9, architecture: 'component-based', deps: 50 },
        { name: 'nestjs/nest', stars: 60000, complexity: 0.8, architecture: 'modular-monolith', deps: 80 },
        { name: 'airbnb/javascript', stars: 130000, complexity: 0.2, architecture: 'style-guide', deps: 10 },
        { name: 'bad-repo/spaghetti', stars: 5, complexity: 0.95, architecture: 'chaos', deps: 200 }, // Should be filtered out
        { name: 'rust-lang/rust', stars: 90000, complexity: 1.0, architecture: 'systems', deps: 0 }
    ];

    // 2. Quantum Filtration
    // We want repos that are High Stars AND High Complexity (Good learning material), but not Chaos.
    console.log('⚛️ Collapsing Wavefunction: Selecting optimal learning targets...');

    const result = await engine.quantumSolve(
        'Find Best Learning Repos',
        rawRepos,
        ['stars', 'architecture'] // Criteria string matching (simplified for portable engine)
    );

    // Custom Score Function for Superposition (since portable engine has simple defaults)
    // We override the measurement logic locally for this specific domain
    const scoredRepos = rawRepos.map(repo => {
        // Quantum Scoring:
        // High Stars = High Amplitude
        // Chaos = Phase Flip (Negative Impact)
        let amplitude = Math.log(repo.stars) / 10;
        if (repo.architecture === 'chaos') amplitude *= -1;

        return {
            repo,
            energy: amplitude
        };
    }).filter(r => r.energy > 0.5); // Filter out low energy/chaos

    console.log(`✅ Selected ${scoredRepos.length} High-Energy Repositories.`);
    scoredRepos.forEach(r => console.log(`   - ${r.repo.name} (Energy: ${r.energy.toFixed(2)})`));

    // 3. Extract Patterns (The "Knowledge")
    // Convert selected repos into training vector format for the logic brain
    const trainingVectors = scoredRepos.map(r => {
        return {
            // Input: [Complexity, Deps, Stars(Normalized), Random, Random]
            input: [
                r.repo.complexity,
                Math.min(1, r.repo.deps / 100),
                Math.min(1, r.repo.stars / 200000),
                Math.random(),
                Math.random()
            ],
            // Output: [Quality Score]
            output: [r.energy] // High energy = High quality pattern
        };
    });

    // 4. Save to Knowledge Base
    const dataDir = path.join(PROJECT_ROOT, 'src/data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    fs.writeFileSync(
        path.join(dataDir, 'external_knowledge_refined.json'),
        JSON.stringify(trainingVectors, null, 2)
    );

    console.log('💾 Harvested Knowledge saved to src/data/external_knowledge_refined.json');
}

harvest().catch(console.error);
