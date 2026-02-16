import { QuantumEngine } from '../src/utils/QuantumEngine.js';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);
const engine = new QuantumEngine();

async function runQuantumDiagnostic() {
    console.log("🏥 Quantum Engine: Initiating Deep Diagnostic Scan...");

    const report = {
        timestamp: new Date().toISOString(),
        buildStatus: 'PENDING',
        testStatus: 'PENDING',
        analysis: null
    };

    try {
        // 1. Quantum Integrity Check (Test Suite)
        console.log("\n🧪 Running Quantum Integrity Protocols (Tests)...");
        try {
            const { stdout, stderr } = await execPromise('npm run test');
            console.log(stdout); // Show test output
            report.testStatus = 'PASSED';
            console.log("   ✅ Quantum Integrity: STABLE");
        } catch (error) {
            console.error(error.stdout || error.message);
            report.testStatus = 'FAILED';
            console.error("   ❌ Quantum Integrity: UNSTABLE (Tests Failed)");
            // We continue even if tests fail to see build status
        }

        // 2. Structural Coherence Check (Build)
        console.log("\n🏗️ Verifying Structural Coherence (Build)...");
        try {
            // Using 'npm run build' - usually runs vite build
            const { stdout } = await execPromise('npm run build');
            report.buildStatus = 'PASSED';
            console.log("   ✅ Structural Coherence: OPTIMAL (Build Successful)");
        } catch (error) {
            console.error(error.stdout || error.message);
            report.buildStatus = 'FAILED';
            console.error("   ❌ Structural Coherence: COLLAPSED (Build Failed)");
        }

        // 3. Quantum-Inspired Pattern Recognition (Static Analysis)
        console.log("\n🔍 Running Quantum Pattern Recognition on Core Modules...");
        const coreFiles = [
            'src/store/useCausalStore.ts',
            'src/components/anomalies/CausalInferenceViewer.jsx',
            'QuantumEngine.js'
        ];

        const analysisResults = [];

        for (const file of coreFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                const coherence = engine.architect.analyzeCoherence(content);
                analysisResults.push({ file, ...coherence });
                console.log(`   > ${file}: Coherence ${coherence.coherence.toFixed(2)}`);
            }
        }
        report.analysis = analysisResults;

        // 4. Generate Quantum Health Report
        const reportPath = 'QUANTUM_HEALTH_REPORT.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📋 Verification Complete. report saved to ${reportPath}`);

        if (report.buildStatus === 'PASSED' && report.testStatus === 'PASSED') {
            console.log("\n✨ SYSTEM STATUS: READY FOR DIMENSIONAL JUMP (DEPLOYMENT) ✨");
        } else {
            console.log("\n⚠️ SYSTEM STATUS: QUANTUM FLUX DETECTED (FIX ERRORS BEFORE DEPLOYMENT)");
        }

    } catch (err) {
        console.error("🔥 Critical Quantum Failure:", err);
    }
}

runQuantumDiagnostic();
