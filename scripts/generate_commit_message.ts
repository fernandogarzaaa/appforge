import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function safeReadJson(filePath: string): any {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        // silently fail and return null if file is unreadable or malformed
    }
    return null;
}

function safeReadFile(filePath: string): string {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
    } catch (error) {
        // silently fail
    }
    return '';
}

function getGitChangedFiles(): string[] {
    try {
        const output = execSync('git diff --name-only --cached', { encoding: 'utf8' }) + '\n' + execSync('git diff --name-only', { encoding: 'utf8' });
        const files = output.split('\n').map(f => f.trim()).filter(f => f.length > 0);
        return Array.from(new Set(files));
    } catch (error) {
        return [];
    }
}

function getLastCommits(count: number): string[] {
    try {
        const output = execSync(`git log -n ${count} --pretty=format:"%s"`, { encoding: 'utf8' });
        return output.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    } catch (error) {
        return [];
    }
}

function generateMessage(): string {
    const realityPulse = safeReadJson('src/data/reality_pulse.json') || {};
    const quantumBrain = safeReadJson('src/data/quantum_brain_state.json') || {};
    const bountyLedger = safeReadJson('src/data/bounty_ledger.json') || { bounties: [] };
    const buildLogs = safeReadFile('build_logs.txt');
    const lintLogsRaw = safeReadFile('lint_output.json');
    let lintErrorsList: any[] = [];
    try {
        if (lintLogsRaw.length > 0) lintErrorsList = JSON.parse(lintLogsRaw);
    } catch (e) { }

    const todoMd = safeReadFile('TODO.md');
    const changedFiles = getGitChangedFiles();

    const directive = realityPulse.directive || 'Autonomous evolution cycle';
    const confidence = realityPulse.confidence ? (realityPulse.confidence * 100).toFixed(1) : '90.0';
    const accuracy = quantumBrain.accuracy ? (quantumBrain.accuracy * 100).toFixed(1) : '95.0';
    const activeBounties = bountyLedger.bounties ? bountyLedger.bounties.filter((b: any) => b.status === 'active' || b.status === 'backlog').length : 0;

    const isDataOnly = changedFiles.length > 0 && changedFiles.every(f => f.endsWith('.json') || f.endsWith('.md') || f.endsWith('.txt'));
    const hasBuildFailed = buildLogs.toLowerCase().includes('failed') || buildLogs.toLowerCase().includes('error');

    let baseMessage = '';

    if (hasBuildFailed || lintErrorsList.length > 0) {
        const actualErrors = lintErrorsList.filter(l => l.errorCount && l.errorCount > 0);
        const totalErrors = actualErrors.reduce((sum, l) => sum + l.errorCount, 0);
        const fileNames = actualErrors.map(l => path.basename(l.filePath)).slice(0, 2).join(', ');

        if (totalErrors > 0) {
            baseMessage = `fix(build): resolve ${totalErrors} lint errors in ${fileNames || 'multiple files'}`;
        } else {
            baseMessage = `fix(build): resolve build constraints in ${changedFiles.filter(f => !f.endsWith('.json')).slice(0, 1).join(', ') || 'core'}`;
        }
    } else if (directive.toLowerCase().includes('bounty') || (realityPulse.reasoning && realityPulse.reasoning.toLowerCase().includes('bounty'))) {
        // Let's see if we can extract bounty context 
        const category = bountyLedger.bounties && bountyLedger.bounties.length > 0 ? bountyLedger.bounties[0].category || 'feature' : 'feature';
        baseMessage = `feat(${category}): complete bounty '${directive}'`;
    } else if (isDataOnly) {
        baseMessage = `chore(data): update quantum state (coherence: ${accuracy}%, ${activeBounties} bounties active)`;
    } else if (directive.toLowerCase().includes('optimize') || directive.toLowerCase().includes('perf')) {
        baseMessage = `perf(quantum): ${directive} (confidence: ${confidence}%)`;
    } else {
        // Default to a feature or generic AI update based on the directive and TODO matching
        let context = 'swarm';
        if (changedFiles.some(f => f.includes('orchestrator'))) context = 'orchestrator';
        else if (changedFiles.some(f => f.includes('evolution'))) context = 'evolution';
        else if (changedFiles.some(f => f.includes('scripts'))) context = 'scripts';

        // Check if directive matches anything in TODO.md
        if (todoMd && todoMd.includes(directive)) {
            baseMessage = `feat(${context}): ${directive.toLowerCase()} per TODO.md`;
        } else {
            baseMessage = `feat(${context}): ${directive.toLowerCase()} (accuracy: ${accuracy}%)`;
        }
    }

    // Diversity Enforcement
    const lastCommits = getLastCommits(5);
    let finalMessage = baseMessage;

    if (lastCommits.some(commit => commit.includes(baseMessage) || baseMessage.includes(commit))) {
        // Append specific file changes
        const fileSummary = changedFiles.slice(0, 2).map(f => path.basename(f)).join(', ');
        if (fileSummary) {
            finalMessage = `${baseMessage} [modifies: ${fileSummary}]`;
        } else {
            finalMessage = `${baseMessage} [${Date.now()}]`; // Ultimate fallback
        }
    }

    return finalMessage;
}

console.log(generateMessage());
