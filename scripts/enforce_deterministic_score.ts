import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const HISTORY_PATH = path.join(PROJECT_ROOT, 'swarm/benchmarks/metrics_history.json');

function enforceDeterministicScore() {
    console.log('⚖️ [Strict Gate] Enforcing Deterministic Evolution Scoring...');

    if (!fs.existsSync(HISTORY_PATH)) {
        console.log('   ℹ️ No previous metrics history found. Accepting baseline.');
        process.exit(0);
    }

    let history: any[];
    try {
        history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
    } catch (e) {
        console.error(`   ❌ Failed to parse metrics history: ${(e as any).message}`);
        process.exit(1);
    }

    if (history.length < 2) {
        console.log('   ℹ️ Insufficient history for delta comparison. Minimum 2 required. Accepting baseline.');
        process.exit(0);
    }

    const current = history[history.length - 1];

    // Iterate backwards until we find a *different* generation timestamp to compare against,
    // in case the script is run multiple times on the same run.
    let previous = null;
    for (let i = history.length - 2; i >= 0; i--) {
        if (history[i].generatedAt !== current.generatedAt) {
            previous = history[i];
            break;
        }
    }

    if (!previous) {
        console.log('   ℹ️ Only identical timestamps found in history. Accepting baseline.');
        process.exit(0);
    }

    const currentScore = current.overall.score;
    const previousScore = previous.overall.score;
    const delta = currentScore - previousScore;

    console.log(`   📊 Previous Best:    ${previousScore.toFixed(2)}`);
    console.log(`   📈 Current Score:    ${currentScore.toFixed(2)}`);
    console.log(`   🧮 Calculated Delta: ${delta > 0 ? '+' : ''}${delta.toFixed(2)}`);

    if (delta < 0) {
        console.error('\n❌ [REGRESSION DETECTED] Swarm intelligence score decreased. Halting execution pipeline.');
        process.exit(1);
    } else if (delta === 0) {
        console.log('\n⚠️ [STAGNATION] Swarm intelligence score identical. Permitting pipeline to continue.');
        process.exit(0);
    } else {
        console.log('\n✅ [EVOLUTION VERIFIED] Swarm intelligence score improved. Permitting pipeline to continue.');
        process.exit(0);
    }
}

enforceDeterministicScore();
