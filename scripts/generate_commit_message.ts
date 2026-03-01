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
    const buildLogs = safeReadFile('build_logs.txt');
    const changedFiles = getGitChangedFiles();

    // 1. Meaningful Work Detection
    const sourceFiles = changedFiles.filter(f => /\.(ts|tsx|js|jsx|rs|css|html)$/.test(f));
    const dataFiles = changedFiles.filter(f => /\.(json|txt|log|md|lock)$/.test(f));
    const totalFiles = changedFiles.length;
    const sourceRatio = totalFiles > 0 ? sourceFiles.length / totalFiles : 0;

    const isInternalDataOnly = changedFiles.length > 0 && changedFiles.every(f =>
        f.startsWith('swarm/') ||
        f.endsWith('.json') ||
        f.endsWith('.txt') ||
        f.endsWith('.lock') ||
        f.endsWith('.md')
    );

    // 2. Build Warning Triage (Chunk Size)
    // Warning format: "(!) Some chunks are larger than 500 kB after minification"
    const oversizedChunkWarning = buildLogs.includes('chunks are larger than 500 kB');
    const metricsPath = 'src/data/build_metrics.json';
    const prevMetrics = safeReadJson(metricsPath) || { oversizedChunks: 0 };

    // Simple count of occurrences of the warning line (or similar)
    const currentOversizedCount = (buildLogs.match(/chunks are larger than 500 kB/g) || []).length;
    let chunkMessage = '';
    if (currentOversizedCount > 0) {
        if (currentOversizedCount < prevMetrics.oversizedChunks) {
            chunkMessage = ` [perf: reduced oversized chunks to ${currentOversizedCount}]`;
        } else if (currentOversizedCount > prevMetrics.oversizedChunks) {
            chunkMessage = ` [warning: oversized chunks increased to ${currentOversizedCount}]`;
        }
    }

    // Update metrics
    try {
        fs.writeFileSync(metricsPath, JSON.stringify({
            oversizedChunks: currentOversizedCount,
            lastUpdated: new Date().toISOString()
        }, null, 2));
    } catch (e) { }

    // 3. Directive & Context
    const directive = realityPulse.directive || 'Maintenance and updates';
    let context = 'core';
    if (changedFiles.some(f => f.includes('apps/'))) context = 'app';
    else if (changedFiles.some(f => f.includes('backend/'))) context = 'backend';
    else if (changedFiles.some(f => f.includes('swarm/'))) context = 'swarm';
    else if (changedFiles.some(f => f.includes('.github/'))) context = 'ci';

    const hasBuildFailed = buildLogs.toLowerCase().includes('failed') || buildLogs.toLowerCase().includes('error');

    // 4. Banned Phrases Sanitizer
    const sanitize = (msg: string) => {
        return msg
            .replace(/quantum\s*/gi, '')
            .replace(/resilience/gi, 'stability')
            .replace(/resonance/gi, 'connectivity')
            .replace(/deep hardening/gi, 'security hardening')
            .replace(/accuracy:\s*\d+\.\d+%/gi, '')
            .replace(/swarm expansion/gi, 'feature development')
            .trim();
    };

    let baseMessage = '';

    if (hasBuildFailed) {
        baseMessage = `fix(${context}): solve build failure`;
    } else if (isInternalDataOnly && sourceRatio < 0.2) {
        // High Meta-work ratio
        const fileSample = changedFiles.slice(0, 1).map(f => path.basename(f)).join('');
        baseMessage = `chore(telemetry): sync ${fileSample || 'data'}`;
    } else if (directive.toLowerCase().includes('fix') || hasBuildFailed) {
        baseMessage = `fix(${context}): ${directive.toLowerCase()}`;
    } else if (directive.toLowerCase().includes('perf') || oversizedChunkWarning) {
        baseMessage = `perf(${context}): ${directive.toLowerCase()}`;
    } else {
        const type = sourceFiles.length > 0 ? 'feat' : 'chore';
        baseMessage = `${type}(${context}): ${directive.toLowerCase()}`;
    }

    let finalMessage = sanitize(baseMessage) + chunkMessage;

    // Diversity Enforcement
    const lastCommits = getLastCommits(5);
    if (lastCommits.some(commit => commit.includes(finalMessage) || finalMessage.includes(commit))) {
        const fileSummary = changedFiles.slice(0, 2).map(f => path.basename(f)).join(', ');
        if (fileSummary) {
            finalMessage += ` (modifies: ${fileSummary})`;
        }
    }

    return finalMessage;
}

console.log(generateMessage());
