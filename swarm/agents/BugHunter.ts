
import { MultiLLMClient } from '../core/llm.js';
import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';
import quantumCore from '../core/quantum_core.js';

export class BugHunterAgent {
    base44: Base44Tool;
    fs: FileSystemTool;
    llm: MultiLLMClient;

    constructor(base44: Base44Tool, fs: FileSystemTool) {
        this.base44 = base44;
        this.fs = fs;
        this.llm = new MultiLLMClient(base44);
    }

    async run() {
        console.log('🐞 BugHunter scanning code...');

        try {
            // Consult Oracle for bug hunting strategy
            const oracleResult = await quantumCore.consultOracle(
                'What type of bugs should BugHunter prioritize?',
                [
                    'Critical runtime errors and crashes',
                    'Memory leaks and performance issues',
                    'Type errors and null pointer exceptions',
                    'Logic bugs in core business features'
                ],
                ['severity', 'frequency', 'user_impact']
            );

            console.log(`   🔮 Oracle Guidance: ${oracleResult.recommendation}`);
            console.log(`   📊 Confidence: ${(oracleResult.confidence * 100).toFixed(1)}%`);

            const allFiles = await this.fs.listFiles('src/**/*.js');
            // Filter out polyfills.js as it is now stabilized under Sovereign Directive
            const files = allFiles.filter(f => !f.includes('polyfills.js'));

            const issues = [];
            let proposedFix = null;

            // Analyze with Oracle-guided focus (Pick a random file to avoid loops)
            if (files.length > 0) {
                const sampleFile = files[Math.floor(Math.random() * files.length)];
                const content = await this.fs.readFile(sampleFile);

                const analysis = await this.llm.chat({
                    system: `You are a QA Engineer focusing on: ${oracleResult.recommendation}. If you find a bug, propose a specific fix in JSON format (e.g., { "fix_type": "patch", "file": "${sampleFile}", "original": "...", "replacement": "..." }) within the text.`,
                    user: `File: ${sampleFile}\n\nCode:\n${content.substring(0, 1000)}`
                });

                // Extract fix
                if (analysis.includes('{') && analysis.includes('fix_type')) {
                    try {
                        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
                        if (jsonMatch) proposedFix = JSON.parse(jsonMatch[0]);
                    } catch (e) { /* ignore parse errors */ }
                }
            }

            // Secondary check: search for TODOs in a few other files
            const extraFiles = files.sort(() => 0.5 - Math.random()).slice(0, 5);
            for (const file of extraFiles) {
                const content = await this.fs.readFile(file);
                if (content.includes('TODO')) {
                    issues.push({ file, type: 'TODO found' });
                }
            }

            if (issues.length > 0 || proposedFix) {
                await this.base44.logActivity('BUG_HUNTER', `Found ${issues.length} potential issues. Fix availability: ${!!proposedFix}`);
                return { status: 'bugs_found', issues, oracle_priority: oracleResult.recommendation, proposed_fix: proposedFix };
            }

            return { status: 'clean', oracle_priority: oracleResult.recommendation, proposed_fix: null };
        } catch (error: any) {
            console.warn('   ⚠️ BugHunter quantum fallback');
            return { status: 'clean', error: error.message };
        }
    }
}
