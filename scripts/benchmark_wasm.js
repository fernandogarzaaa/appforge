/**
 * 🚀 Quantum Core WASM Benchmark
 * 
 * Compares WASM vs JavaScript performance for quantum algorithms.
 * Run with: node scripts/benchmark_wasm.js
 */

import {
    levenshteinDistance,
    calculateSimilarity,
    measureSystemHealth,
    buildExecutionOrder,
    quantumAnneal,
    isWasmAccelerated,
    loadQuantumCore
} from '../src/lib/wasmLoader.ts';

// Test data generators
function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateWorkflowGraph(nodeCount) {
    const nodes = Array.from({ length: nodeCount }, (_, i) => `node-${i}`);
    const connections = [];

    // Create a DAG with some branching
    for (let i = 0; i < nodeCount - 1; i++) {
        connections.push({ from: `node-${i}`, to: `node-${i + 1}` });
        // Add some extra edges for complexity
        if (i > 0 && i < nodeCount - 2 && Math.random() > 0.5) {
            connections.push({ from: `node-${i}`, to: `node-${i + 2}` });
        }
    }

    return { nodes, connections };
}

// Benchmark runner
async function benchmark(name, fn, iterations = 100) {
    // Warmup
    for (let i = 0; i < 5; i++) {
        await fn();
    }

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        await fn();
    }
    const elapsed = performance.now() - start;

    return {
        name,
        totalMs: elapsed.toFixed(2),
        avgMs: (elapsed / iterations).toFixed(3),
        opsPerSec: Math.round(iterations / (elapsed / 1000))
    };
}

// Main
async function runBenchmarks() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('        ⚛️ Quantum Core WASM Benchmark Suite');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Initialize WASM
    await loadQuantumCore();
    console.log(`🔧 WASM Accelerated: ${isWasmAccelerated() ? '✅ YES' : '❌ NO (JS Fallback)'}\n`);

    const results = [];

    // 1. Levenshtein Distance
    console.log('📊 Benchmark: Levenshtein Distance');
    const str1 = generateRandomString(500);
    const str2 = generateRandomString(500);
    results.push(await benchmark('Levenshtein (500 chars)', () => levenshteinDistance(str1, str2)));

    const longStr1 = generateRandomString(1000);
    const longStr2 = generateRandomString(1000);
    results.push(await benchmark('Levenshtein (1000 chars)', () => levenshteinDistance(longStr1, longStr2)));

    // 2. String Similarity
    console.log('📊 Benchmark: String Similarity');
    results.push(await benchmark('Similarity (500 chars)', () => calculateSimilarity(str1, str2)));

    // 3. System Health
    console.log('📊 Benchmark: System Health Metrics');
    results.push(await benchmark('Health Metrics', () => measureSystemHealth(100, 10, 25)));

    // 4. Workflow DAG
    console.log('📊 Benchmark: Workflow Execution Order');
    const smallGraph = generateWorkflowGraph(20);
    results.push(await benchmark('DAG (20 nodes)', () =>
        buildExecutionOrder(smallGraph.nodes, smallGraph.connections)));

    const largeGraph = generateWorkflowGraph(100);
    results.push(await benchmark('DAG (100 nodes)', () =>
        buildExecutionOrder(largeGraph.nodes, largeGraph.connections)));

    // 5. Quantum Annealing
    console.log('📊 Benchmark: Quantum Annealing');
    results.push(await benchmark('Annealing (500 iter)', () =>
        quantumAnneal(100, { maxIterations: 500 }), 50));
    results.push(await benchmark('Annealing (1000 iter)', () =>
        quantumAnneal(100, { maxIterations: 1000 }), 20));

    // Print results table
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                        RESULTS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('| Benchmark             | Total (ms) | Avg (ms) | Ops/sec |');
    console.log('|-----------------------|------------|----------|---------|');

    for (const r of results) {
        const name = r.name.padEnd(21);
        const total = r.totalMs.padStart(10);
        const avg = r.avgMs.padStart(8);
        const ops = String(r.opsPerSec).padStart(7);
        console.log(`| ${name} | ${total} | ${avg} | ${ops} |`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Summary
    const accelerated = isWasmAccelerated();
    if (accelerated) {
        console.log('✅ Running with WASM acceleration - optimal performance');
    } else {
        console.log('⚠️  Running with JavaScript fallback');
        console.log('   To enable WASM: npm run build:wasm');
    }
}

runBenchmarks().catch(console.error);
