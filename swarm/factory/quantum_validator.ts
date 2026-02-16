/**
 * OPERATION IRON BRAIN — TASK 2: QUANTUM VALIDATION PIPELINE
 * Phase 63: The Hitchhike Extraction
 * 
 * Filters 'raw_harvest.jsonl' through Sovereign Axioms.
 * If a Teacher Model suggests "Use Firebase" or "Deploy to AWS", 
 * the Quantum Validator REJECTS the entry.
 * 
 * Only "Golden Data" (Sovereign, Efficient, Local) makes it to training.
 * 
 * Usage: npx tsx swarm/factory/quantum_validator.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATASET_DIR = path.join(import.meta.dirname, 'dataset');
const RAW_INPUT = path.join(DATASET_DIR, 'raw_harvest.jsonl');
const REFINED_OUTPUT = path.join(DATASET_DIR, 'refined_dataset.jsonl');
const STATIC_ORACLE_OUTPUT = path.join(import.meta.dirname, '..', 'core', 'static_oracle.json');

// ═══════════════════════════════════════════════════
// SOVEREIGN AXIOMS (The Rules of the Forge)
// ═══════════════════════════════════════════════════

const FORBIDDEN_TOKENS = [
    'usage-based pricing',
    'monthly subscription',
    'firebase',
    'aws cognito',
    'auth0',
    'vercel kv', // We use local SQLite or similar
    'upstash',   // We prefer local Redis/SQLite
    'mongodb atlas',
    'proprietary api'
];

const REQUIRED_CONCEPTS_ONE_OF = [
    'sovereign',
    'local',
    'self-hosted',
    'pda', // Solana Program Derived Address
    'ed25519',
    'sqlite',
    'encryption',
    'trustless',
    'peer-to-peer',
    'offline-first',
    'no central authority'
];

interface AlpacaEntry {
    instruction: string;
    input: string;
    output: string;
}

class QuantumValidator {

    public async validateAndRefine() {
        console.log("🛡️ Starting Quantum Validation Pipeline...");

        if (!fs.existsSync(RAW_INPUT)) {
            console.error(`❌ Raw harvest file not found: ${RAW_INPUT}`);
            console.error("   Run 'harvester.ts' first.");
            return;
        }

        const rawData = fs.readFileSync(RAW_INPUT, 'utf-8');
        const lines = rawData.split('\n').filter(line => line.trim() !== '');

        let acceptedCount = 0;
        let rejectedCount = 0;
        const goldenEntries: AlpacaEntry[] = [];

        console.log(`   Processing ${lines.length} raw entries...`);

        for (const line of lines) {
            try {
                const entry: AlpacaEntry = JSON.parse(line);
                const content = (entry.output + entry.instruction).toLowerCase();

                // 1. Check Forbidden Tokens (The "Rent-Seeker" Filter)
                const hasForbidden = FORBIDDEN_TOKENS.some(token => content.includes(token));
                if (hasForbidden) {
                    // console.log(`   ❌ Rejected: Found forbidden concept.`);
                    rejectedCount++;
                    continue;
                }

                // 2. Check Required Concepts (The "Sovereignty" Filter)
                const hasRequired = REQUIRED_CONCEPTS_ONE_OF.some(token => content.includes(token));
                if (!hasRequired) {
                    // console.log(`   ⚠️ Rejected: Lacks sovereign DNA.`);
                    rejectedCount++;
                    continue;
                }

                // ✅ Accepted
                goldenEntries.push(entry);
                acceptedCount++;

            } catch (e: any) {
                console.warn("   ⚠️ Malformed JSON line skipped.");
            }
        }

        // Write Refined Dataset
        fs.writeFileSync(REFINED_OUTPUT, goldenEntries.map(e => JSON.stringify(e)).join('\n'));
        console.log(`\n💎 Validation Complete.`);
        console.log(`   ✅ Accepted: ${acceptedCount} (Golden Data)`);
        console.log(`   ❌ Rejected: ${rejectedCount} (Impure logic)`);
        console.log(`   📂 Output: ${REFINED_OUTPUT}`);

        // Generate Static Oracle (Snapshot of valid reasoning)
        this.generateStaticOracle(goldenEntries);
    }

    private generateStaticOracle(entries: AlpacaEntry[]) {
        console.log("\n🔮 Generating Static Oracle from Golden Data...");

        // Map: Instruction -> Reasoning Trace
        const staticOracle: Record<string, string> = {};

        for (const entry of entries) {
            // Key: The architectural problem
            // Value: The high-quality reasoning trace
            // Clean up the key to be more query-friendly in a real system? 
            // For/now exact matching on instruction is fine for the "hitchhiking" phase.
            staticOracle[entry.instruction] = entry.output;
        }

        fs.writeFileSync(STATIC_ORACLE_OUTPUT, JSON.stringify(staticOracle, null, 2));
        console.log(`   ✅ Static Oracle Manifest created: ${STATIC_ORACLE_OUTPUT}`);
        console.log(`      Contains ${Object.keys(staticOracle).length} pre-computed reasoning traces.`);
    }
}

// Execute
import { pathToFileURL } from 'url';
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    new QuantumValidator().validateAndRefine().catch(console.error);
}
