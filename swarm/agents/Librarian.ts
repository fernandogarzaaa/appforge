import { MultiLLMClient } from '../core/llm.js';
import { Base44Tool } from '../tools/base44.js';
import { GitTool } from '../tools/git.js';
import quantumCore from '../core/quantum_core.js';
import fs from 'fs/promises';
import path from 'path';

export class LibrarianAgent {
    base44: Base44Tool;
    llm: MultiLLMClient;
    git: GitTool;

    constructor(base44: Base44Tool) {
        this.base44 = base44;
        this.llm = new MultiLLMClient(base44);
        this.git = new GitTool();
    }

    async trainOnRepo(repoUrl: string) {
        console.log(`📚 [LIBRARIAN] Initiating training on: ${repoUrl}`);
        const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'temp_repo';
        const targetPath = path.join(process.cwd(), 'temp_training', repoName);

        try {
            await this.base44.logActivity('LIBRARIAN', `Training Initialized: ${repoUrl}`);

            // 1. Clone
            console.log(`   → Cloning into ${targetPath}...`);
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
            await this.git.clone(repoUrl, targetPath);

            // 2. Analyze (Recursive Summarization)
            console.log(`   → Analyzing patterns in ${repoName}...`);
            const analysis = await this.llm.chat({
                system: 'You are a Senior Architect analyzing a new repository. Identify key patterns, architecture choices, and libraries used.',
                user: `Analyze the repository at ${targetPath}. Summarize its core essence for the swarm.`
            });

            // 3. Ingest into Knowledge
            const pulse = {
                topic: `External Training: ${repoName}`,
                insight: analysis,
                action_required: false
            };

            await this.base44.logActivity('LIBRARIAN', `Knowledge Ingested from ${repoName}`);

            // Clean up
            await fs.rm(targetPath, { recursive: true, force: true });

            return { status: 'training_complete', pulse };
        } catch (error: any) {
            console.error(`   ❌ Training failed: ${error.message}`);
            await this.base44.logActivity('LIBRARIAN', `Training Failed: ${repoName} - ${error.message}`);
            return { status: 'error', error: error.message };
        }
    }

    async run() {
        console.log('📚 Librarian researching global trends...');

        try {
            // Consult Oracle for research priorities
            const oracleResult = await quantumCore.consultOracle(
                'What open source trends or security advisories should we research?',
                [
                    'Latest Node.js security vulnerabilities',
                    'Open source package supply chain attacks',
                    'WASM and Rust optimization patterns',
                    'Emerging DeFi/Web3 library standards'
                ],
                ['urgency', 'relevance', 'safety']
            );

            console.log(`   🔮 Oracle Guidance: ${oracleResult.recommendation}`);

            // Perform Research via Antigravity (me!)
            const research = await this.llm.chat({
                system: `You are a Global Research Librarian. Your task is to provide real-world data and trends related to: ${oracleResult.recommendation}. 
                Use your search capabilities to find specific, actionable insights. 
                Always return a "resonance_pulse" in JSON format: { "topic": "...", "insight": "...", "action_required": true/false }`,
                user: `Conduct a deep search for ${oracleResult.recommendation} and provide a resonance pulse for the swarm.`
            });

            let pulse = null;
            if (research.includes('{') && research.includes('resonance_pulse')) {
                try {
                    const jsonMatch = research.match(/\{[\s\S]*\}/);
                    if (jsonMatch) pulse = JSON.parse(jsonMatch[0]);
                } catch (e) { /* ignore parse errors */ }
            }

            if (pulse) {
                await this.base44.logActivity('LIBRARIAN', `Resonance Pulse Detected: ${pulse.topic}. Action: ${pulse.action_required}`);
                return { status: 'insight_found', pulse, oracle_priority: oracleResult.recommendation };
            }

            return { status: 'idle', oracle_priority: oracleResult.recommendation };
        } catch (error: any) {
            console.warn('   ⚠️ Librarian quantum fallback');
            return { status: 'idle', error: error.message };
        }
    }
}
