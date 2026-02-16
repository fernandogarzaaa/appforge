
import quantumCore from '../swarm/core/quantum_core.js';

async function consultDiagnosticOracle() {
    console.log('🌌 [ORACLE DIAGNOSTIC] CONSULTING ON TEST INTEGRITY...');

    const diagnosticConsult = await quantumCore.consultOracle(
        'The vitest.config.js currently excludes many test directories, causing "No test files found" in automated diagnostics. What is the optimal resolution?',
        [
            'Peak: Refine exclude patterns to include core src/tests/ while keeping node_modules isolated.',
            'Nominal: Manually specify test files in the diagnostic command.',
            'Suboptimal: Remove all exclusions (risk of performance collapse).'
        ],
        ['integrity', 'performance', 'coherence']
    );

    console.log(`\n✨ Oracle Verdict: ${diagnosticConsult.recommendation}`);
    console.log(`📊 Confidence: ${(diagnosticConsult.confidence * 100).toFixed(1)}%`);
}

consultDiagnosticOracle().catch(console.error);
