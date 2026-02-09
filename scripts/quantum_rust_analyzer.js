/**
 * 🔬 Quantum Rust Conversion Analyzer
 * Uses the Quantum Engine to identify JavaScript/TypeScript functions
 * that are ideal candidates for Rust/WebAssembly conversion.
 * 
 * Quantum Metrics Used:
 * - Computational Entropy: Higher = more compute-intensive
 * - Purity Coherence: Higher = more pure/no side effects
 * - Complexity Density: Higher = benefits from Rust optimization
 * - Hot Path Probability: Higher = performance-critical
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Import Quantum Engine components
import {
    QuantumInspiredAI,
    QuantumArchitect,
    SuperpositionProcessor,
    EntanglementAnalyzer
} from '../src/lib/QuantumEngine.js';

// ============================================================
// Quantum Analysis Engine for Rust Conversion
// ============================================================

class QuantumRustAnalyzer {
    constructor() {
        this.architect = new QuantumArchitect();
        this.superposition = new SuperpositionProcessor();
        this.entanglement = new EntanglementAnalyzer();

        // Patterns indicating Rust-conversion candidates
        this.computePatterns = [
            /for\s*\([^)]+\)\s*\{/g,           // For loops
            /while\s*\([^)]+\)\s*\{/g,          // While loops
            /\.map\s*\(/g,                       // Array operations
            /\.reduce\s*\(/g,
            /\.filter\s*\(/g,
            /\.forEach\s*\(/g,
            /Math\.\w+/g,                        // Math operations
            /\*\*|\/|\+|\-|\*|%/g,               // Arithmetic
            /new\s+Array/g,                      // Array allocations
            /new\s+Float32Array/g,               // Typed arrays
            /new\s+Uint8Array/g,
            /JSON\.parse|JSON\.stringify/g,      // Serialization
            /crypto\./g,                         // Cryptographic ops
            /Buffer\./g,                         // Buffer operations
        ];

        // Side effect patterns (impure - less ideal for WASM)
        this.sideEffectPatterns = [
            /console\./g,
            /window\./g,
            /document\./g,
            /fetch\(/g,
            /axios\./g,
            /localStorage/g,
            /sessionStorage/g,
            /this\.\w+\s*=/g,                   // Instance mutations
            /global\./g,
            /process\./g,
        ];

        // Performance-critical patterns (hot paths)
        this.hotPathPatterns = [
            /async\s+function.*loop/gi,
            /setInterval/g,
            /requestAnimationFrame/g,
            /on\w+\s*\(/g,                      // Event handlers
            /stream/gi,
            /real-?time/gi,
            /websocket/gi,
        ];
    }

    /**
     * Analyze a single function for Rust conversion potential
     */
    analyzeFunction(code, functionName) {
        // Calculate Computational Entropy (0-100)
        let computeScore = 0;
        for (const pattern of this.computePatterns) {
            const matches = code.match(pattern) || [];
            computeScore += matches.length * 5;
        }
        computeScore = Math.min(100, computeScore);

        // Calculate Purity Coherence (0-100, higher = more pure)
        let sideEffectCount = 0;
        for (const pattern of this.sideEffectPatterns) {
            const matches = code.match(pattern) || [];
            sideEffectCount += matches.length;
        }
        const purityScore = Math.max(0, 100 - sideEffectCount * 15);

        // Calculate Hot Path Probability (0-100)
        let hotPathScore = 0;
        for (const pattern of this.hotPathPatterns) {
            const matches = code.match(pattern) || [];
            hotPathScore += matches.length * 10;
        }
        hotPathScore = Math.min(100, hotPathScore);

        // Calculate Complexity Density
        const { complexity } = this.architect.analyzeCoherence(code);
        const complexityScore = Math.min(100, complexity * 2);

        // Calculate Lines of Code
        const loc = code.split('\n').length;

        // Quantum Superposition: Create weighted score
        const rustScore = (
            (computeScore * 0.35) +
            (purityScore * 0.30) +
            (complexityScore * 0.20) +
            (hotPathScore * 0.15)
        );

        return {
            functionName,
            rustScore: Math.round(rustScore),
            metrics: {
                computeIntensity: computeScore,
                purity: purityScore,
                complexity: complexityScore,
                hotPath: hotPathScore,
                linesOfCode: loc
            },
            recommendation: this.getRecommendation(rustScore, purityScore, loc)
        };
    }

    getRecommendation(rustScore, purityScore, loc) {
        if (rustScore >= 70 && purityScore >= 60 && loc >= 20) {
            return '🟢 EXCELLENT - High priority for Rust conversion';
        } else if (rustScore >= 50 && purityScore >= 40) {
            return '🟡 GOOD - Moderate candidate for Rust';
        } else if (rustScore >= 30) {
            return '🟠 POSSIBLE - May benefit from Rust in specific cases';
        } else {
            return '🔴 LOW - Keep in JavaScript';
        }
    }

    /**
     * Extract functions from a source file
     */
    extractFunctions(code, filename) {
        const functions = [];

        // Match function declarations
        const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            const funcName = match[1];
            const startIndex = match.index;
            const funcBody = this.extractFunctionBody(code, startIndex);
            if (funcBody) {
                functions.push({ name: funcName, body: funcBody, file: filename });
            }
        }

        // Match arrow functions assigned to variables
        const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
        while ((match = arrowRegex.exec(code)) !== null) {
            const funcName = match[1];
            const startIndex = match.index;
            const funcBody = this.extractArrowBody(code, startIndex);
            if (funcBody && funcBody.length > 50) {
                functions.push({ name: funcName, body: funcBody, file: filename });
            }
        }

        // Match class methods
        const methodRegex = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm;
        while ((match = methodRegex.exec(code)) !== null) {
            const methodName = match[1];
            if (!['if', 'for', 'while', 'switch', 'catch', 'constructor'].includes(methodName)) {
                const startIndex = match.index;
                const methodBody = this.extractFunctionBody(code, startIndex);
                if (methodBody && methodBody.length > 50) {
                    functions.push({ name: methodName, body: methodBody, file: filename });
                }
            }
        }

        return functions;
    }

    extractFunctionBody(code, startIndex) {
        let braceCount = 0;
        let inBody = false;
        let bodyStart = startIndex;

        for (let i = startIndex; i < code.length; i++) {
            if (code[i] === '{') {
                if (!inBody) bodyStart = i;
                inBody = true;
                braceCount++;
            } else if (code[i] === '}') {
                braceCount--;
                if (braceCount === 0 && inBody) {
                    return code.substring(bodyStart, i + 1);
                }
            }
        }
        return null;
    }

    extractArrowBody(code, startIndex) {
        // Find the => and extract until matching brace or end of statement
        const arrowIndex = code.indexOf('=>', startIndex);
        if (arrowIndex === -1) return null;

        const afterArrow = code.substring(arrowIndex + 2).trim();
        if (afterArrow.startsWith('{')) {
            return this.extractFunctionBody(code, arrowIndex + 2);
        } else {
            // Single expression arrow function - find end of statement
            const endIndex = code.indexOf(';', arrowIndex);
            if (endIndex !== -1) {
                return code.substring(arrowIndex + 2, endIndex);
            }
        }
        return null;
    }

    /**
     * Analyze entire project
     */
    async analyzeProject(directories) {
        const results = [];
        const fileExtensions = ['.js', '.ts', '.jsx', '.tsx'];

        const scanDirectory = (dir) => {
            if (!fs.existsSync(dir)) return;

            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
                    scanDirectory(fullPath);
                } else if (stat.isFile() && fileExtensions.some(ext => item.endsWith(ext))) {
                    try {
                        const code = fs.readFileSync(fullPath, 'utf-8');
                        const relativePath = path.relative(PROJECT_ROOT, fullPath);
                        const functions = this.extractFunctions(code, relativePath);

                        for (const func of functions) {
                            const analysis = this.analyzeFunction(func.body, func.name);
                            results.push({
                                file: func.file,
                                ...analysis
                            });
                        }
                    } catch (e) {
                        // Skip unreadable files
                    }
                }
            }
        };

        for (const dir of directories) {
            scanDirectory(dir);
        }

        // Sort by Rust score descending
        results.sort((a, b) => b.rustScore - a.rustScore);

        return results;
    }
}

// ============================================================
// Main Execution
// ============================================================

async function runQuantumRustAnalysis() {
    console.log("🔬 Quantum Rust Conversion Analyzer v1.0");
    console.log("=========================================\n");
    console.log("⚛️ Initializing Quantum Analysis Engine...\n");

    const analyzer = new QuantumRustAnalyzer();

    // Directories to analyze
    const dirsToAnalyze = [
        path.join(PROJECT_ROOT, 'src'),
        path.join(PROJECT_ROOT, 'src/lib'),
        path.join(PROJECT_ROOT, 'src/utils'),
        path.join(PROJECT_ROOT, 'src/services'),
    ];

    console.log("📁 Scanning directories:");
    for (const dir of dirsToAnalyze) {
        console.log(`   - ${path.relative(PROJECT_ROOT, dir)}`);
    }
    console.log("");

    const results = await analyzer.analyzeProject(dirsToAnalyze);

    // Filter for good candidates
    const excellentCandidates = results.filter(r => r.rustScore >= 70);
    const goodCandidates = results.filter(r => r.rustScore >= 50 && r.rustScore < 70);
    const possibleCandidates = results.filter(r => r.rustScore >= 30 && r.rustScore < 50);

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                    QUANTUM ANALYSIS RESULTS                    ");
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log(`📊 Total Functions Analyzed: ${results.length}`);
    console.log(`🟢 Excellent Candidates: ${excellentCandidates.length}`);
    console.log(`🟡 Good Candidates: ${goodCandidates.length}`);
    console.log(`🟠 Possible Candidates: ${possibleCandidates.length}\n`);

    // Display Excellent Candidates
    if (excellentCandidates.length > 0) {
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("🟢 EXCELLENT CANDIDATES FOR RUST CONVERSION");
        console.log("═══════════════════════════════════════════════════════════════\n");

        for (const candidate of excellentCandidates.slice(0, 15)) {
            console.log(`📦 ${candidate.functionName}`);
            console.log(`   File: ${candidate.file}`);
            console.log(`   Rust Score: ${candidate.rustScore}/100`);
            console.log(`   ├─ Compute Intensity: ${candidate.metrics.computeIntensity}%`);
            console.log(`   ├─ Purity: ${candidate.metrics.purity}%`);
            console.log(`   ├─ Complexity: ${candidate.metrics.complexity}%`);
            console.log(`   ├─ Hot Path: ${candidate.metrics.hotPath}%`);
            console.log(`   └─ Lines: ${candidate.metrics.linesOfCode}`);
            console.log(`   ${candidate.recommendation}\n`);
        }
    }

    // Display Good Candidates
    if (goodCandidates.length > 0) {
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("🟡 GOOD CANDIDATES FOR RUST CONVERSION");
        console.log("═══════════════════════════════════════════════════════════════\n");

        for (const candidate of goodCandidates.slice(0, 10)) {
            console.log(`📦 ${candidate.functionName} (${candidate.file})`);
            console.log(`   Score: ${candidate.rustScore} | Compute: ${candidate.metrics.computeIntensity}% | Purity: ${candidate.metrics.purity}%`);
            console.log(`   ${candidate.recommendation}\n`);
        }
    }

    // Generate Summary Report
    const report = {
        timestamp: new Date().toISOString(),
        totalFunctionsAnalyzed: results.length,
        summary: {
            excellent: excellentCandidates.length,
            good: goodCandidates.length,
            possible: possibleCandidates.length
        },
        topCandidates: excellentCandidates.slice(0, 20).map(c => ({
            function: c.functionName,
            file: c.file,
            rustScore: c.rustScore,
            metrics: c.metrics,
            recommendation: c.recommendation
        })),
        allResults: results
    };

    // Save report
    const reportPath = path.join(PROJECT_ROOT, 'quantum_rust_analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: quantum_rust_analysis.json`);

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("                    QUANTUM ANALYSIS COMPLETE                   ");
    console.log("═══════════════════════════════════════════════════════════════\n");

    return report;
}

runQuantumRustAnalysis().catch(console.error);
