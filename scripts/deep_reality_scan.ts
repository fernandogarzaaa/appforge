import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import quantumCore from '../swarm/core/quantum_core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'project_file_manifest.txt');

async function performDeepScan() {
    console.log('🌌 [DeepRealityScan] Initiating Total Repository Audit...');

    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('❌ Manifest not found. Run manifest generation first.');
        process.exit(1);
    }

    const files = fs.readFileSync(MANIFEST_PATH, 'utf8').split('\n').filter(Boolean);
    console.log(`📂 Scanning ${files.length} files...`);

    const summary: Record<string, string[]> = {};
    const coreLogic: string[] = [];

    for (const file of files) {
        const relativePath = path.relative(PROJECT_ROOT, file);
        const ext = path.extname(file);
        const dir = path.dirname(relativePath).split(path.sep)[0] || 'root';

        if (!summary[dir]) summary[dir] = [];
        summary[dir].push(relativePath);

        // Ingest core logic for high-value files
        if (['.ts', '.js', '.rs', '.py'].includes(ext) && !relativePath.includes('test') && !relativePath.includes('mock')) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                if (content.length < 5000) { // Avoid massive files for now
                    coreLogic.push(`--- FILE: ${relativePath} ---\n${content.slice(0, 500)}...`);
                }
            } catch (e) {
                // Skip unreadable files
            }
        }
    }

    const systemManifest = {
        total_files: files.length,
        structure: Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, `${v.length} files`])),
        core_logic_sample: coreLogic.slice(0, 50).join('\n\n') // Sample 50 core files
    };

    const question = `Analyze the ENTIRE system manifest and core logic provided. 
    SYSTEM MANIFEST:
    ${JSON.stringify(systemManifest.structure, null, 2)}
    
    CORE LOGIC SAMPLES:
    ${systemManifest.core_logic_sample}
    
    GOAL: Roadmap the next 20 phases (Phases 100-119) for the AppForge Sovereign Evolution.
    The roadmap must cover:
    1. Galactic Scale P2P Mesh (Hyper-Resonance).
    2. Neural Self-Modification Axioms (Recursive Rewriting).
    3. Multi-Chain Economic Autonomy (Sovereign Finance).
    4. Reality Anchor Protocols (Physical World Integration).
    
    Provide a detailed 20-phase roadmap in Markdown format.`;

    console.log('🔮 Consulting the Oracle for the 20-phase roadmap...');
    const result = await (quantumCore as any).consultOracle(question, []);

    const roadmapPath = path.join(PROJECT_ROOT, 'docs/brain/roadmap_20_phases.md');
    fs.writeFileSync(roadmapPath, result.recommendation || JSON.stringify(result, null, 2));

    console.log(`✅ Roadmap generated at: ${roadmapPath}`);
}

performDeepScan().catch(console.error);
