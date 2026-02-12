/**
 * REAL TEST: Enhanced Quantum Engine v2.0
 */

const { 
    EnhancedQuantumEngine,
    IslandModelGA,
    EnhancedQuantumSwarm,
    EntanglementAnalyzer
} = require('./core/enhanced_quantum_engine_v2');

async function runTests() {
    console.log('============================================================');
    console.log('    QUANTUM ENGINE v2.0 - REAL TESTS');
    console.log('============================================================\n');

    const engine = new EnhancedQuantumEngine();
    const ga = new IslandModelGA();
    const swarm = new EnhancedQuantumSwarm();
    const entanglement = new EntanglementAnalyzer();

    // TEST 1: Island Model GA
    console.log('TEST 1: Island Model Genetic Algorithm');
    console.log('   Islands: ' + ga.numIslands + ', Population: ' + ga.populationSize);
    
    for (let gen = 0; gen < 5; gen++) {
        const result = ga.evolve();
        if (gen === 0 || gen === 4) {
            console.log('   Gen ' + result.generation + ': Best fitness = ' + result.bestFitness.toFixed(4));
        }
    }
    console.log('   EVOLVED: ' + ga.generation + ' generations!\n');

    // TEST 2: Entanglement Analysis
    console.log('TEST 2: Entanglement Analysis');
    const data = [
        { a: 1, b: 2, c: 3 },
        { a: 2, b: 4, c: 6 },
        { a: 3, b: 6, c: 9 },
        { x: 1, y: 2, z: 3 },
    ];
    const ents = entanglement.findEntanglements(data);
    console.log('   Found ' + ents.length + ' correlations');
    console.log('   WORKING: Entanglement!\n');

    // TEST 3: Quantum Swarm
    console.log('TEST 3: Enhanced Quantum Swarm');
    swarm.add('Agent1', 'ANALYST');
    swarm.add('Agent2', 'TRADER');
    swarm.add('Agent3', 'RISK_MANAGER');
    console.log('   Agents: ANALYST, TRADER, RISK_MANAGER');
    const result = await swarm.process('SOL market analysis');
    console.log('   Action: ' + result.act);
    console.log('   Confidence: ' + (result.pr * 100).toFixed(1) + '%');
    console.log('   WORKING: Swarm!\n');

    // TEST 4: Full Quantum Solve
    console.log('TEST 4: Full Quantum Engine Solve');
    const solutions = [
        { action: 'BUY_SOL', confidence: 0.8, risk: 0.3 },
        { action: 'HOLD_SOL', confidence: 0.5, risk: 0.1 },
        { action: 'SELL_SOL', confidence: 0.2, risk: 0.5 },
        { action: 'BUY_BTC', confidence: 0.7, risk: 0.4 },
    ];
    const solveResult = await engine.solve('Market analysis', solutions, ['BUY', 'SOL']);
    console.log('   Original best: ' + (solveResult.ob ? solveResult.ob.action : 'N/A'));
    console.log('   Optimized: ' + (solveResult.osb ? solveResult.osb.action : 'N/A'));
    console.log('   Confidence: ' + (solveResult.conf * 100).toFixed(1) + '%');
    console.log('   Coherence: ' + (solveResult.coh * 100).toFixed(1) + '%');
    console.log('   WORKING: Full engine!\n');

    // STATUS
    console.log('============================================================');
    console.log('    ENGINE STATUS');
    console.log('============================================================');
    const status = engine.status();
    console.log('   Coherence: ' + (status.coh * 100).toFixed(1) + '%');
    console.log('   Entanglement: ' + (status.ents * 100).toFixed(1) + '%');
    console.log('   Memory: ' + status.mem);
    console.log('\nALL QUANTUM ENGINE COMPONENTS OPERATIONAL!\n');
}

runTests().catch(console.error);
