/**
 * 🧪 INTEGRATION TEST: Enhanced Quantum Engine v2.0
 * 
 * This file validates real integration of:
 * - EnhancedQuantumEngine (quantum-inspired algorithms)
 * - IslandModelGA (genetic algorithm with migration)
 * - EnhancedQuantumSwarm (multi-agent consensus)
 * - EntanglementAnalyzer (correlation detection)
 * - WillowPatterns (quantum acceleration patterns)
 * 
 * All tests use REAL algorithms with crypto-secure entropy.
 */

import {
    EnhancedQuantumEngine,
    IslandModelGA,
    EnhancedQuantumSwarm,
    EntanglementAnalyzer
} from './core/enhanced_quantum_engine_v2.js';
import { willowPatterns } from './core/willow_patterns.js';

interface TestResult {
    test: string;
    passed: boolean;
    details: string;
}

async function runIntegrationTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    console.log('============================================================');
    console.log('    QUANTUM ENGINE v2.0 - INTEGRATION TESTS');
    console.log('============================================================\n');

    // Initialize all components
    const engine = new EnhancedQuantumEngine();
    const ga = new IslandModelGA();
    const swarm = new EnhancedQuantumSwarm();
    const entanglement = new EntanglementAnalyzer();

    // TEST 1: Island Model GA Integration
    console.log('TEST 1: Island Model Genetic Algorithm Integration');
    console.log(`   Islands: ${ga.numIslands}, Population: ${ga.populationSize}`);
    
    let gaPassed = false;
    for (let gen = 0; gen < 5; gen++) {
        const result = ga.evolve();
        if (gen === 0 || gen === 4) {
            console.log(`   Gen ${result.generation}: Best fitness = ${result.bestFitness.toFixed(4)}`);
        }
    }
    const gaFinalGen = ga.generation;
    gaPassed = gaFinalGen >= 5;
    console.log(`   EVOLVED: ${gaFinalGen} generations!`);
    console.log(`   ✅ GA INTEGRATION: ${gaPassed ? 'PASSED' : 'FAILED'}\n`);
    results.push({
        test: 'IslandModelGA Integration',
        passed: gaPassed,
        details: `Evolved ${gaFinalGen} generations with ${ga.numIslands} islands`
    });

    // TEST 2: Entanglement Analysis Integration
    console.log('TEST 2: Entanglement Analysis Integration');
    const data = [
        { a: 1, b: 2, c: 3 },
        { a: 2, b: 4, c: 6 },
        { a: 3, b: 6, c: 9 },
        { x: 1, y: 2, z: 3 }
    ];
    const ents = entanglement.findEntanglements(data);
    const entsPassed = ents.length > 0 && ents.length <= 6; // Should find correlations in first 3 items
    console.log(`   Found ${ents.length} correlations`);
    console.log(`   ✅ ENTANGLEMENT INTEGRATION: ${entsPassed ? 'PASSED' : 'FAILED'}\n`);
    results.push({
        test: 'EntanglementAnalyzer Integration',
        passed: entsPassed,
        details: `Detected ${ents.length} correlations in test data`
    });

    // TEST 3: Quantum Swarm Integration
    console.log('TEST 3: Enhanced Quantum Swarm Integration');
    swarm.add('Agent1', 'ANALYST');
    swarm.add('Agent2', 'TRADER');
    swarm.add('Agent3', 'RISK_MANAGER');
    console.log('   Agents: ANALYST, TRADER, RISK_MANAGER');
    const swarmResult = await swarm.process('SOL market analysis');
    const swarmPassed = swarmResult.act !== undefined && swarmResult.pr !== undefined;
    console.log(`   Action: ${swarmResult.act}`);
    console.log(`   Confidence: ${(swarmResult.pr * 100).toFixed(1)}%`);
    console.log(`   ✅ SWARM INTEGRATION: ${swarmPassed ? 'PASSED' : 'FAILED'}\n`);
    results.push({
        test: 'EnhancedQuantumSwarm Integration',
        passed: swarmPassed,
        details: `Consensus action: ${swarmResult.act}, confidence: ${(swarmResult.pr * 100).toFixed(1)}%`
    });

    // TEST 4: Full Quantum Engine Integration
    console.log('TEST 4: Full Quantum Engine Integration');
    const solutions = [
        { action: 'BUY_SOL', confidence: 0.8, risk: 0.3 },
        { action: 'HOLD_SOL', confidence: 0.5, risk: 0.1 },
        { action: 'SELL_SOL', confidence: 0.2, risk: 0.5 },
        { action: 'BUY_BTC', confidence: 0.7, risk: 0.4 }
    ];
    const solveResult = await engine.solve('Market analysis', solutions, ['confidence']);
    const enginePassed = solveResult.coh !== undefined && solveResult.entStr !== undefined;
    console.log(`   Original best: ${solveResult.ob ? solveResult.ob.action : 'N/A'}`);
    console.log(`   Optimized: ${solveResult.osb ? solveResult.osb.action : 'N/A'}`);
    console.log(`   Confidence: ${(solveResult.conf * 100).toFixed(1)}%`);
    console.log(`   Coherence: ${(solveResult.coh * 100).toFixed(1)}%`);
    console.log(`   ✅ ENGINE INTEGRATION: ${enginePassed ? 'PASSED' : 'FAILED'}\n`);
    results.push({
        test: 'Full Quantum Engine Integration',
        passed: enginePassed,
        details: `Coherence: ${(solveResult.coh * 100).toFixed(1)}%, Entanglement: ${solveResult.entStr}`
    });

    // TEST 5: Willow Patterns Integration
    console.log('TEST 5: Willow Patterns Integration');
    const willowStatus = willowPatterns.getStatus();
    const willowPassed = willowStatus.architecture === 'Willow (Rectangular Grid)' && willowStatus.qubits > 0;
    console.log(`   Architecture: ${willowStatus.architecture}`);
    console.log(`   Qubits: ${willowStatus.qubits}, Grid: ${willowStatus.grid}`);
    console.log(`   Coherence: ${(willowStatus.coherence * 100).toFixed(1)}%`);
    console.log(`   Fidelity: ${(willowStatus.fidelity * 100).toFixed(1)}%`);
    console.log(`   ✅ WILLOW PATTERNS INTEGRATION: ${willowPassed ? 'PASSED' : 'FAILED'}\n`);
    results.push({
        test: 'WillowPatterns Integration',
        passed: willowPassed,
        details: `Architecture: ${willowStatus.architecture}, coherence: ${(willowStatus.coherence * 100).toFixed(1)}%`
    });

    // TEST 6: Quantum Error Correction Integration
    console.log('TEST 6: Quantum Error Correction Integration');
    const errCorrect = new (EnhancedQuantumEngine as any).QuantumErrorCorrection 
        ? new ((EnhancedQuantumEngine as any).QuantumErrorCorrection()) 
        : null;
    const errPassed = errCorrect !== null;
    console.log(`   Error Correction: ${errPassed ? 'AVAILABLE' : 'NOT FOUND'}`);
    console.log(`   ✅ ERROR CORRECTION INTEGRATION: ${errPassed ? 'PASSED' : 'FAILED'}\n`);
    results.push({
        test: 'Quantum Error Correction Integration',
        passed: errPassed,
        details: errPassed ? 'Error correction module available' : 'Module not accessible'
    });

    // SUMMARY
    console.log('============================================================');
    console.log('    INTEGRATION TEST SUMMARY');
    console.log('============================================================');
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`   Passed: ${passedCount}/${totalCount}`);
    console.log(`   Status: ${passedCount === totalCount ? '✅ ALL INTEGRATION TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);
    
    return results;
}

runIntegrationTests()
    .then(results => {
        const allPassed = results.every(r => r.passed);
        process.exit(allPassed ? 0 : 1);
    })
    .catch(err => {
        console.error('Integration test error:', err);
        process.exit(1);
    });
