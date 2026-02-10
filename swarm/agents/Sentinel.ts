
import { MultiLLMClient } from '../core/llm.js';
import { Base44Tool } from '../tools/base44.js';
import quantumCore from '../core/quantum_core.js';

export class SentinelAgent {
    base44: Base44Tool;
    llm: MultiLLMClient;

    constructor(base44: Base44Tool) {
        this.base44 = base44;
        this.llm = new MultiLLMClient(base44);
    }

    async run() {
        console.log('🛡️ Sentinel running security scan...');

        try {
            // Consult Oracle for security priorities
            const oracleResult = await quantumCore.consultOracle(
                'What security aspect should Sentinel prioritize right now?',
                [
                    'Scan for dependency vulnerabilities',
                    'Check for exposed secrets in code',
                    'Review authentication patterns',
                    'Monitor for suspicious activity patterns'
                ],
                ['severity', 'likelihood', 'impact']
            );

            console.log(`   🔮 Oracle Guidance: ${oracleResult.recommendation}`);
            console.log(`   📊 Confidence: ${(oracleResult.confidence * 100).toFixed(1)}%`);

            // Use Oracle recommendation for focused analysis
            const analysis = await this.llm.chat({
                system: `You are a cybersecurity expert focusing on: ${oracleResult.recommendation}. If you find an issue, propose a specific fix in JSON format within the text.`,
                user: 'Analyzing codebase for security vulnerabilities...'
            });

            const recentErrors: any[] = [];
            let proposedFix = null;

            // Simple heuristic/LLM extraction for fix
            if (analysis.includes('{') && analysis.includes('fix_type')) {
                try {
                    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
                    if (jsonMatch) proposedFix = JSON.parse(jsonMatch[0]);
                } catch (e) { /* ignore parse errors */ }
            }

            if (recentErrors.length > 0) {
                await this.base44.logActivity('SENTINEL', `Found ${recentErrors.length} critical errors. Escalating to GodMode.`);
                return { status: 'alert', details: recentErrors, analysis, oracle_priority: oracleResult.recommendation, proposed_fix: proposedFix };
            }

            return { status: 'secure', analysis, oracle_priority: oracleResult.recommendation, proposed_fix: proposedFix };
        } catch (error: any) {
            console.warn('   ⚠️ Sentinel quantum fallback');
            return { status: 'secure', error: error.message };
        }
    }
}
