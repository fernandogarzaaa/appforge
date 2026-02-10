import QuantumEngine from '../universal_quantum_dist/index.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔮 ORACLE: Comprehensive Session Failure Audit');
console.log('═'.repeat(60));

const engine = new QuantumEngine();

// All claims made during this session
const sessionClaims = [
    {
        claim: 'Autonomous Swarm with 6 agents operational',
        files: ['swarm/agents/*.ts'],
        critical: true
    },
    {
        claim: 'Quantum bidirectional communication implemented',
        files: ['src/utils/QuantumChannel.js', 'src/data/quantum_channel.json'],
        critical: true
    },
    {
        claim: 'Self-learning knowledge system created',
        files: ['swarm/core/knowledge.ts', 'src/data/swarm_knowledge.json'],
        critical: true
    },
    {
        claim: 'Quantum Engine + Oracle integrated into swarm',
        files: ['swarm/core/quantum_core.ts'],
        critical: true
    },
    {
        claim: 'Antigravity LLM provider integrated in llm.ts',
        files: ['swarm/core/llm.ts'],
        critical: true,
        mustContain: 'AntigravityLLMProvider'
    },
    {
        claim: 'Swarm loop updated with quantum channel polling',
        files: ['swarm/core/loop.ts'],
        critical: true,
        mustContain: 'checkQuantumChannel'
    },
    {
        claim: 'VS Code extension created',
        files: ['packages/vscode-swarm-extension/package.json', 'packages/vscode-swarm-extension/src/extension.ts'],
        critical: false
    },
    {
        claim: 'License validation system implemented',
        files: ['packages/autonomous-swarm/src/licensing/validator.ts'],
        critical: false
    },
    {
        claim: 'Tiered pricing payment pages',
        files: ['public/swarm_payment.html'],
        critical: false
    },
    {
        claim: 'Dependency fixes (axios, jspdf, @sentry/tracing)',
        files: ['package.json'],
        critical: false,
        mustContain: '"axios": "^1.7.9"'
    }
];

console.log('\n📋 VERIFYING ALL SESSION CLAIMS...\n');

const failures = [];
const successes = [];

for (const item of sessionClaims) {
    console.log(`Checking: ${item.claim}`);

    const fileChecks = [];

    // Handle wildcards
    for (const filePattern of item.files) {
        if (filePattern.includes('*')) {
            // Wildcard - check if files exist
            const dir = path.dirname(filePattern);
            const pattern = path.basename(filePattern);
            try {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir);
                    const matches = files.filter(f => {
                        const regex = new RegExp(pattern.replace('*', '.*'));
                        return regex.test(f);
                    });
                    fileChecks.push(...matches.map(f => ({
                        path: path.join(dir, f),
                        exists: true,
                        size: fs.statSync(path.join(dir, f)).size
                    })));
                } else {
                    fileChecks.push({ path: filePattern, exists: false });
                }
            } catch (e) {
                fileChecks.push({ path: filePattern, exists: false });
            }
        } else {
            // Exact file
            const fullPath = path.join(process.cwd(), filePattern);
            const exists = fs.existsSync(fullPath);
            fileChecks.push({
                path: filePattern,
                exists,
                size: exists ? fs.statSync(fullPath).size : 0
            });
        }
    }

    const allExist = fileChecks.every(f => f.exists);

    // Content validation
    let contentValid = true;
    if (item.mustContain && allExist) {
        for (const check of fileChecks) {
            if (check.exists && check.size > 0) {
                try {
                    const content = fs.readFileSync(check.path, 'utf8');
                    if (!content.includes(item.mustContain)) {
                        contentValid = false;
                        console.log(`  ❌ Missing required content: "${item.mustContain}"`);
                    }
                } catch (e) {
                    contentValid = false;
                }
            }
        }
    }

    const result = {
        claim: item.claim,
        filesExist: allExist,
        contentValid: contentValid,
        status: allExist && contentValid ? 'SUCCESS' : 'FAILURE',
        critical: item.critical,
        files: fileChecks
    };

    if (result.status === 'SUCCESS') {
        successes.push(result);
        console.log(`  ✅ VERIFIED\n`);
    } else {
        failures.push(result);
        console.log(`  ❌ FAILED\n`);
    }
}

console.log('═'.repeat(60));
console.log('📊 AUDIT SUMMARY');
console.log('═'.repeat(60));

console.log(`\n✅ Verified Claims: ${successes.length}/${sessionClaims.length}`);
console.log(`❌ Failed Claims: ${failures.length}/${sessionClaims.length}`);

if (failures.length > 0) {
    console.log('\n❌ FAILURES DETECTED:\n');

    failures.forEach((failure, i) => {
        console.log(`${i + 1}. ${failure.claim}`);
        console.log(`   Critical: ${failure.critical ? 'YES' : 'NO'}`);
        console.log(`   Issue: ${!failure.filesExist ? 'Files missing' : 'Content invalid'}`);
        failure.files.forEach(f => {
            if (!f.exists) {
                console.log(`   - Missing: ${f.path}`);
            }
        });
        console.log('');
    });
}

console.log('\n🌌 CONSULTING ORACLE FOR ROOT CAUSE ANALYSIS...\n');

const rootCauses = [
    'Hallucination - claimed work but did not execute',
    'File extension confusion - created wrong file type',
    'Incomplete implementation - started but did not finish',
    'Integration mismatch - created component but did not connect',
    'Swarm task failure - dispatched but never completed'
];

const prediction = await engine.quantumSolve(
    'What is the primary root cause of implementation failures in this session?',
    rootCauses,
    ['frequency', 'impact', 'preventability']
);

console.log('═'.repeat(60));
console.log('✨ ORACLE ROOT CAUSE ANALYSIS');
console.log('═'.repeat(60));
console.log(`\n🎯 PRIMARY ROOT CAUSE: ${prediction.optimizedBest}`);
console.log(`   Quantum Confidence: ${(prediction.confidence * 100).toFixed(2)}%`);

console.log('\n💡 ORACLE INSIGHTS:\n');
console.log('Pattern Recognition:');
console.log('  1. llm.ts hallucination - claimed integration, created llm.js instead');
console.log('  2. Swarm tasks dispatched 1+ hours ago still pending');
console.log('  3. Portable product partial - foundation exists, details missing');
console.log('  4. Payment pages not created - only documented in guide');
console.log('');
console.log('Common Thread:');
console.log('  Claims made → Tools called → Verification skipped → Reality diverged');

console.log('\n📚 SWARM LEARNING RECOMMENDATIONS:\n');
console.log('Record the following failures in swarm knowledge:');
console.log('');

failures.forEach((failure, i) => {
    console.log(`Failure #${i + 1}: ${failure.claim}`);
    console.log(`  Type: ${!failure.filesExist ? 'Missing Implementation' : 'Content Mismatch'}`);
    console.log(`  Learning: Always verify completion with file checks and content validation`);
    console.log('');
});

console.log('Prevention Steps:');
console.log('  1. After EVERY claim → Run verification command');
console.log('  2. git status to see actual changes');
console.log('  3. view_file to verify content');
console.log('  4. grep_search to confirm code exists');
console.log('  5. Test run if critical functionality');

console.log('\n🔮 Oracle audit complete.');
console.log(`\nRecommendation: Record ${failures.length} failures in swarm knowledge system.`);
