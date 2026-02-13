import { EnhancedQuantumEngine } from '../swarm/core/enhanced_quantum_engine_v2.js';
import swarmKnowledge from '../swarm/core/knowledge.js';
import * as fs from 'fs';
import path from 'path';

async function performIntelligenceAudit() {
    console.log('🔮 [Quantum Engine] Initializing Intelligence Audit & Resonance Mapping...');

    const engine = new EnhancedQuantumEngine();

    // 1. Load Swarm Knowledge
    await swarmKnowledge.load();
    const stats = await swarmKnowledge.getStats();
    console.log(`📚 Found ${stats.total_learnings} past learnings with ${stats.success_rate} success rate.`);

    // 2. Extract Successful Patterns
    const learnings = swarmKnowledge.knowledge.learnings || [];
    const successfulLearnings = learnings.filter((l: any) => l.outcome === 'success');

    // Convert learnings to numeric vectors for the Quantum Pattern Recognizer
    const patternVectors = successfulLearnings.map((l: any) => {
        // Simple hash-based vectorization for demonstration
        const str = JSON.stringify(l);
        const vec = Array(10).fill(0);
        for (let i = 0; i < str.length; i++) vec[i % 10] += str.charCodeAt(i) / 1000;
        return vec;
    });

    console.log(`🌀 [Quantum Engine] Training Resonance Matrix on ${successfulLearnings.length} cognitive successes...`);
    patternVectors.forEach((vec, i) => engine.pat.learn(`success_${i}`, vec));

    // 3. Perform Resonance Audit on Current Objectives
    const auditObjectives = [
        "Optimize Sovereign Prompt for decentralized consensus",
        "Minimize dependency on central heuristics",
        "Maximize data sovereignty in swarm communications"
    ];

    console.log('🛰️ [Quantum Engine] Auditing current objectives against resonance matrix...');

    const auditResults: any[] = [];
    for (const obj of auditObjectives) {
        // Create a synthetic vector for the objective
        const objVec = Array(10).fill(0);
        for (let i = 0; i < obj.length; i++) objVec[i % 10] += obj.charCodeAt(i) / 1000;

        const resonance = engine.pat.recognize(objVec);
        auditResults.push({ objective: obj, resonance: resonance.conf, match: resonance.match });
    }

    // 4. Synthesize Final Report
    console.log('\n📊 [Quantum Intelligence Audit Report]\n' + '='.repeat(40));
    auditResults.forEach(res => {
        console.log(`🎯 Objective: ${res.objective}`);
        console.log(`📈 Resonance Score: ${(res.resonance * 100).toFixed(2)}%`);
        console.log(`🔗 Primary Match: ${res.match || 'None'}`);
        console.log('-'.repeat(20));
    });

    const status = engine.status();
    console.log(`🌊 Swarm Coherence: ${(status.coh * 100).toFixed(2)}%`);
    console.log(`🧠 Knowledge Base Size: ${learnings.length} nodes`);
    console.log('='.repeat(40));

    // Save report
    const reportPath = path.join(process.cwd(), 'swarm/data/quantum_intelligence_audit.json');
    if (!fs.existsSync(path.dirname(reportPath))) fs.mkdirSync(path.dirname(reportPath), { recursive: true });

    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        stats,
        audit_results: auditResults,
        quantum_status: status
    }, null, 2));

    console.log(`\n✅ Audit Complete. Resonance Mapping saved to: ${reportPath}`);
}

performIntelligenceAudit().catch(console.error);
