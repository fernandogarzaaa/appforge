import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const CORE_DIRS = [
    path.join(PROJECT_ROOT, 'swarm/core'),
    path.join(PROJECT_ROOT, 'src'),
    path.join(PROJECT_ROOT, 'backend'),
    path.join(PROJECT_ROOT, 'apps')
];
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/antigravity_blueprint.json');

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.py')) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

async function analyzeAntigravity() {
    console.log('🔍 [Reverse-Engineer] Analyzing Repository-Wide Antigravity Patterns...');

    const allFiles = CORE_DIRS.flatMap(dir => getAllFiles(dir));
    const insights = [];

    for (const filePath of allFiles) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(PROJECT_ROOT, filePath);

        // Pattern Recognition
        const patterns = {
            hasOracleConsultation: fileContent.includes('consultOracle'),
            hasRealitySignals: fileContent.includes('EnvironmentSignal'),
            hasQuantumLogic: fileContent.includes('QuantumEngine') || fileContent.includes('this.engine'),
            hasBlockchainIntegration: fileContent.includes('Solana') || fileContent.includes('EconomicEngine'),
            hasRecursiveSelfPatching: fileContent.includes('AtomicPatcher') || fileContent.includes('repair'),
            hasSovereignAxioms: fileContent.includes('Decentralization') || fileContent.includes('Local-First')
        };

        const score = Object.values(patterns).filter(Boolean).length;

        if (score > 0 || filePath.includes('swarm/core')) {
            insights.push({
                file: relativePath,
                complexity: fileContent.length,
                logicDensity: score / 6,
                patterns
            });
        }
    }

    const blueprint = {
        analyzedAt: new Date().toISOString(),
        coreHealth: insights.filter(i => i.file.includes('swarm/core')).length > 5 ? 'Robust' : 'Emergent',
        repoScope: insights.length,
        insights: insights.sort((a, b) => b.logicDensity - a.logicDensity),
        recommendations: [
            "Normalize Oracle consultation across all leaf agents.",
            "Standardize RealitySignal ingestion for proactive response.",
            "Deepen Quantum Resonance in decision-making paths.",
            "Enforce Sovereign Axioms in new cross-module refactors."
        ]
    };

    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(blueprint, null, 2));
    console.log(`✅ [Reverse-Engineer] Blueprint generated: ${OUTPUT_FILE}`);
}

analyzeAntigravity().catch(console.error);
