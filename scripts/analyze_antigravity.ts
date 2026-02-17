import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const CORE_DIR = path.join(PROJECT_ROOT, 'swarm/core');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/antigravity_blueprint.json');

async function analyzeAntigravity() {
    console.log('🔍 [Reverse-Engineer] Analyzing Antigravity Swarm Core...');

    if (!fs.existsSync(CORE_DIR)) {
        console.error('❌ Swarm core not found.');
        return;
    }

    const files = fs.readdirSync(CORE_DIR).filter(f => f.endsWith('.ts'));
    const insights = [];

    for (const file of files) {
        const content = fs.readFileSync(path.join(CORE_DIR, file), 'utf8');

        // Pattern Recognition
        const patterns = {
            hasOracleConsultation: content.includes('consultOracle'),
            hasRealitySignals: content.includes('EnvironmentSignal'),
            hasQuantumLogic: content.includes('QuantumEngine') || content.includes('this.engine'),
            hasBlockchainIntegration: content.includes('Solana') || content.includes('EconomicEngine'),
            hasRecursiveSelfPatching: content.includes('AtomicPatcher') || content.includes('repair')
        };

        const score = Object.values(patterns).filter(Boolean).length;

        insights.push({
            file,
            complexity: content.length,
            logicDensity: score / 5,
            patterns
        });
    }

    const blueprint = {
        analyzedAt: new Date().toISOString(),
        coreHealth: insights.length > 5 ? 'Robust' : 'Emergent',
        insights: insights.sort((a, b) => b.logicDensity - a.logicDensity),
        recommendations: [
            "Normalize Oracle consultation across all leaf agents.",
            "Standardize RealitySignal ingestion for proactive response.",
            "Deepen Quantum Resonance in decision-making paths."
        ]
    };

    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(blueprint, null, 2));
    console.log(`✅ [Reverse-Engineer] Blueprint generated: ${OUTPUT_FILE}`);
}

analyzeAntigravity().catch(console.error);
