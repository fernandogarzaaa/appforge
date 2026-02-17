import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/synergy_scout.json');

async function scoutSynergy() {
    console.log('🛰️ [Scout] Initiating GitHub Synergy Harvesting...');

    const topics = [
        'autonomous agents',
        'quantum-inspired ai',
        'self-healing code',
        'multi-agent systems',
        'local-first software'
    ];

    const results = [];

    for (const topic of topics) {
        try {
            console.log(`   🔍 Searching topic: ${topic}`);
            const output = execSync(`gh search repos "${topic}" --sort stars --limit 3 --json name,description,stargazersCount,url`, {
                encoding: 'utf8'
            });
            const repos = JSON.parse(output);
            results.push(...repos.map(r => ({
                topic,
                name: r.name,
                description: r.description,
                stars: r.stargazersCount,
                url: r.url,
                scoutedAt: new Date().toISOString()
            })));
        } catch (e) {
            console.warn(`   ⚠️ [Scout] Search failed for topic "${topic}":`, e.message);
        }
    }

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`✅ [Scout] Synergy harvested: ${results.length} potentials stored in src/data/synergy_scout.json`);
}

scoutSynergy().catch(console.error);
