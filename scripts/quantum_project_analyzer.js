import { QuantumEngine, QuantumArchitect, QuantumInspiredAI, EntanglementAnalyzer, SuperpositionProcessor } from '../src/utils/QuantumEngine.js';
import fs from 'fs';
import path from 'path';

/**
 * 🔬 Quantum Project Analyzer
 * Uses the full Quantum Engine suite to analyze the entire codebase
 */

const PROJECT_ROOT = path.resolve('.');
const IGNORE_DIRS = ['node_modules', '.git', 'dist', '.next', '.vercel', 'coverage'];
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Quantum Subsystems
const engine = new QuantumEngine();
const architect = new QuantumArchitect();
const entanglement = new EntanglementAnalyzer();
const superposition = new SuperpositionProcessor();

// Results Accumulator
const analysisReport = {
    timestamp: new Date().toISOString(),
    projectPath: PROJECT_ROOT,
    summary: {},
    files: [],
    entanglements: [],
    quantumOptimizations: [],
    superpositionStates: []
};

/**
 * Recursively find all code files
 */
function findCodeFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(item)) {
                findCodeFiles(fullPath, files);
            }
        } else if (EXTENSIONS.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
        }
    }
    return files;
}

/**
 * Analyze a single file using Quantum Architect
 */
function analyzeFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    // Quantum Coherence Analysis
    const coherenceAnalysis = architect.analyzeCoherence(code);

    // Count quantum-relevant metrics
    const metrics = {
        lines: code.split('\n').length,
        functions: (code.match(/function\s+\w+|=>\s*{|async\s+\w+/g) || []).length,
        imports: (code.match(/import\s+/g) || []).length,
        exports: (code.match(/export\s+/g) || []).length,
        quantumRefs: (code.match(/quantum|Quantum|QUANTUM/gi) || []).length
    };

    return {
        path: relativePath,
        ...coherenceAnalysis,
        ...metrics,
        optimizations: architect.suggestOptimizations(coherenceAnalysis)
    };
}

/**
 * Find code entanglements (cross-file dependencies)
 */
function findEntanglements(fileAnalyses) {
    // Create dependency map
    const deps = fileAnalyses.map(f => ({
        file: f.path,
        complexity: f.complexity,
        imports: f.imports
    }));

    // Use Quantum Entanglement Analyzer
    const correlations = entanglement.findEntanglements(deps);

    return correlations.slice(0, 10); // Top 10 entanglements
}

/**
 * Create Superposition of possible project states
 */
function analyzeProjectSuperposition(fileAnalyses) {
    const possibleStates = [
        { name: 'Current State', entropy: calculateTotalEntropy(fileAnalyses) },
        { name: 'Refactored', entropy: calculateTotalEntropy(fileAnalyses) * 0.7 },
        { name: 'Optimized', entropy: calculateTotalEntropy(fileAnalyses) * 0.5 },
        { name: 'Quantum-Enhanced', entropy: calculateTotalEntropy(fileAnalyses) * 0.3 }
    ];

    const states = superposition.createSuperposition(possibleStates);

    // Amplify best states
    superposition.amplifyGoodSolutions(state => 1 - (state.entropy / 100));

    return superposition.measure();
}

function calculateTotalEntropy(files) {
    const avgCoherence = files.reduce((sum, f) => sum + f.coherence, 0) / files.length;
    const totalComplexity = files.reduce((sum, f) => sum + f.complexity, 0);
    return Math.min(100, (1 - avgCoherence) * 50 + (totalComplexity / files.length));
}

/**
 * Main Analysis Pipeline
 */
async function runQuantumAnalysis() {
    console.log("🔬 Quantum Project Analyzer v1.0");
    console.log("================================\n");
    console.log("⚛️ Initializing Quantum Engine...");

    // Phase 1: File Discovery
    console.log("\n📁 Phase 1: Scanning project files...");
    const files = findCodeFiles(PROJECT_ROOT);
    console.log(`   Found ${files.length} code files.`);

    // Phase 2: Individual Analysis
    console.log("\n🔍 Phase 2: Quantum Coherence Analysis...");
    for (const file of files) {
        try {
            const analysis = analyzeFile(file);
            analysisReport.files.push(analysis);
        } catch (e) {
            // Skip unreadable files
        }
    }
    console.log(`   Analyzed ${analysisReport.files.length} files.`);

    // Phase 3: Entanglement Detection
    console.log("\n🔗 Phase 3: Detecting Code Entanglements...");
    analysisReport.entanglements = findEntanglements(analysisReport.files);
    console.log(`   Found ${analysisReport.entanglements.length} strong correlations.`);

    // Phase 4: Superposition Analysis
    console.log("\n🌌 Phase 4: Quantum Superposition of Project States...");
    const superpositionResult = analyzeProjectSuperposition(analysisReport.files);
    analysisReport.superpositionStates = superpositionResult.allSolutions;

    // Phase 5: Summary
    const totalLines = analysisReport.files.reduce((sum, f) => sum + f.lines, 0);
    const avgCoherence = analysisReport.files.reduce((sum, f) => sum + f.coherence, 0) / analysisReport.files.length;
    const quantumFiles = analysisReport.files.filter(f => f.quantumRefs > 0).length;
    const entropy = calculateTotalEntropy(analysisReport.files);

    analysisReport.summary = {
        totalFiles: analysisReport.files.length,
        totalLines,
        averageCoherence: avgCoherence.toFixed(3),
        projectEntropy: entropy.toFixed(2),
        quantumIntegration: `${quantumFiles}/${analysisReport.files.length} files`,
        bestFutureState: superpositionResult.bestSolution.name,
        bestStateProbability: `${(superpositionResult.probability * 100).toFixed(1)}%`
    };

    // Final Report
    console.log("\n==============================");
    console.log("⚛️ QUANTUM ANALYSIS COMPLETE");
    console.log("==============================\n");

    console.log("📊 Summary:");
    console.log(`   Total Files: ${analysisReport.summary.totalFiles}`);
    console.log(`   Total Lines: ${analysisReport.summary.totalLines}`);
    console.log(`   Avg Coherence: ${analysisReport.summary.averageCoherence}`);
    console.log(`   Project Entropy: ${analysisReport.summary.projectEntropy}%`);
    console.log(`   Quantum Integration: ${analysisReport.summary.quantumIntegration}`);

    console.log("\n🌌 Superposition Collapse:");
    console.log(`   Best Future State: ${analysisReport.summary.bestFutureState}`);
    console.log(`   Probability: ${analysisReport.summary.bestStateProbability}`);

    console.log("\n🔗 Top Entanglements:");
    analysisReport.entanglements.slice(0, 5).forEach((e, i) => {
        console.log(`   ${i + 1}. Strength: ${e.strength.toFixed(2)}`);
    });

    console.log("\n📈 Top Optimization Candidates:");
    const needsWork = analysisReport.files
        .filter(f => f.optimizations.length > 0)
        .sort((a, b) => a.coherence - b.coherence)
        .slice(0, 5);

    needsWork.forEach(f => {
        console.log(`   - ${f.path} (Coherence: ${f.coherence.toFixed(2)})`);
        f.optimizations.forEach(o => console.log(`     → ${o}`));
    });

    // Save full report
    const reportPath = path.join(PROJECT_ROOT, 'quantum_analysis_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(analysisReport, null, 2));
    console.log(`\n💾 Full report saved to: ${reportPath}`);

    return analysisReport;
}

// Execute
runQuantumAnalysis().catch(console.error);
