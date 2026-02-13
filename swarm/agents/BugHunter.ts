
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

    async run(directive?: string, scope?: string[]) {
        console.log('🐞 BugHunter scanning code...');
        const targetDirective = directive || 'Critical runtime errors and logic bugs in core features';

        try {
            // Consult Oracle for bug hunting strategy if no specific directive is provided
            let oracleGuidance = targetDirective;
            if (!directive) {
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
                oracleGuidance = oracleResult.recommendation;
                console.log(`   🔮 Oracle Guidance: ${oracleGuidance}`);
                console.log(`   📊 Confidence: ${(oracleResult.confidence * 100).toFixed(1)}%`);
            } else {
                console.log(`   🎯 Mission Directive: ${targetDirective}`);
            }

            // Determine files to scan
            let files: string[] = [];
            if (scope && scope.length > 0) {
                files = scope;
                console.log(`   📂 Target Scope: ${files.join(', ')}`);
            } else {
                const allFiles = await this.fs.listFiles('**/*.{js,jsx,ts,tsx}');
                // Filter out non-source and stabilized files
                files = allFiles.filter(f =>
                    !f.includes('polyfills.js') &&
                    !f.includes('node_modules') &&
                    !f.includes('.git') &&
                    !f.includes('dist')
                );
            }

            const issues = [];
            let proposedFix = null;

            // Analyze target files
            const maxFilesToAnalyze = scope ? files.length : 5;
            const targetFiles = scope ? files : files.sort(() => 0.5 - Math.random()).slice(0, maxFilesToAnalyze);

            for (const sampleFile of targetFiles) {
                try {
                    const content = await this.fs.readFile(sampleFile);
                    console.log(`   🔍 Analyzing: ${sampleFile}`);

                    const analysis = await this.llm.chat({
                        system: `You are a QA Engineer focusing on: ${oracleGuidance}. 
                        Your mission goal: ${targetDirective}.
                        If you find a bug or improvement, propose a specific fix in JSON format: 
                        { "fix_type": "patch", "file": "${sampleFile}", "original": "...", "replacement": "...", "explanation": "..." }`,
                        user: `File: ${sampleFile}\n\nCode snippet:\n${content.substring(0, 2000)}`
                    });

                    // Extract fix
                    if (analysis.includes('{') && analysis.includes('fix_type')) {
                        const jsonMatch = analysis.match(/\{[\s\S]*?\}/);
                        if (jsonMatch) {
                            try {
                                const parsed = JSON.parse(jsonMatch[0]);
                                proposedFix = parsed;
                                console.log(`   ✅ Proposed fix for ${sampleFile}: ${parsed.explanation || 'No explanation provided'}`);
                                break; // Stop after first good fix for this cycle
                            } catch (e) { /* ignore parse errors */ }
                        }
                    }
                } catch (err) {
                    console.warn(`   ⚠️ Failed to read/analyze ${sampleFile}: ${err.message}`);
                }
            }

            if (issues.length > 0 || proposedFix) {
                await this.base44.logActivity('BUG_HUNTER', `Found issues/fixes. Mission: ${!!directive}`);
                return {
                    status: 'bugs_found',
                    issues,
                    oracle_priority: oracleGuidance,
                    proposed_fix: proposedFix,
                    mission_completed: !!directive
                };
            }

            return { status: 'clean', oracle_priority: oracleGuidance, proposed_fix: null };
        } catch (error: any) {
            console.warn('   ⚠️ BugHunter quantum fallback');
            return { status: 'clean', error: error.message };
        }
    }
}
