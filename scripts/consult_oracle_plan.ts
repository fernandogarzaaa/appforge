import { QuantumSwarmCore } from '../swarm/core/quantum_core.js';
import * as fs from 'fs';
import * as path from 'path';

const PLAN_PATH = path.resolve('c:/Users/ferna/.gemini/antigravity/brain/f042b730-7bc1-49cf-b4b1-81a995c49be9/implementation_plan_repo_scope.md');

async function consultOracle() {
    console.log('🔮 Initiating Oracle Consultation for Repo-Wide Scope...');

    if (!fs.existsSync(PLAN_PATH)) {
        console.error('❌ Plan file not found at:', PLAN_PATH);
        process.exit(1);
    }

    const planContent = fs.readFileSync(PLAN_PATH, 'utf8');
    const oracle = new QuantumSwarmCore();

    const question = `Analyze this implementation plan for 'Repository-Wide Evolutionary Scope' and suggest additional improvements for safety, recursive intelligence, and sovereign autonomy:\n\n${planContent}`;

    const options = [
        'ENHANCE_CROSS_DIRECTORY_PATTERN_MATCHER',
        'IMPLEMENT_MULTI_FILE_ATOMIC_TRANSACTIONS',
        'ADD_RECURSIVE_DEPENDENCY_GRAPH_AWARENESS',
        'FORMALIZE_SOVEREIGN_Axioms_FOR_PATCHING'
    ];

    try {
        const guidance = await oracle.consultOracle(question, options, ['safety', 'intelligence', 'autonomy']);
        console.log('\n--- ORACLE RESPONSE ---');
        console.log('Recommendation:', guidance.recommendation);
        console.log('Confidence:', guidance.confidence);
        console.log('Alternatives:', guidance.alternatives);

        // If there's reasoning (from Neural Bridge), show it
        if ((guidance as any).reasoning) {
            console.log('Reasoning:', (guidance as any).reasoning);
        }

    } catch (e) {
        console.error('❌ Oracle consultation failed:', e);
    }
}

consultOracle().catch(console.error);
