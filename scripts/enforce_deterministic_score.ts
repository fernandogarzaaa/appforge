import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const HISTORY_PATH = path.join(PROJECT_ROOT, 'swarm/benchmarks/metrics_history.json');
function readNumberEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}

const WINDOW_SIZE = Math.max(3, Math.floor(readNumberEnv('DETERMINISTIC_WINDOW_SIZE', 10)));
const SCORE_DROP_TOLERANCE = Math.max(0, readNumberEnv('DETERMINISTIC_SCORE_DROP_TOLERANCE', 0.5));
const MIN_BASELINE_SAMPLES = Math.max(2, Math.floor(readNumberEnv('DETERMINISTIC_MIN_BASELINE_SAMPLES', 3)));

interface BenchmarkEntry {
    generatedAt: string;
    overall?: {
        score?: number;
    };
}

function percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const rank = Math.ceil((p / 100) * sorted.length) - 1;
    const index = Math.min(sorted.length - 1, Math.max(0, rank));
    return sorted[index];
}

function enforceDeterministicScore() {
    console.log('⚖️ [Strict Gate] Enforcing Deterministic Evolution Scoring...');

    if (!fs.existsSync(HISTORY_PATH)) {
        console.log('   ℹ️ No previous metrics history found. Accepting baseline.');
        process.exit(0);
    }

    let history: BenchmarkEntry[];
    try {
        history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
    } catch (e) {
        console.error(`   ❌ Failed to parse metrics history: ${(e as Error).message}`);
        process.exit(1);
    }

    if (!Array.isArray(history) || history.length === 0) {
        console.log('   ℹ️ Metrics history is empty. Accepting baseline.');
        process.exit(0);
    }

    const current = history[history.length - 1];
    const currentScore = current?.overall?.score;

    if (typeof currentScore !== 'number' || Number.isNaN(currentScore)) {
        console.error('   ❌ Current benchmark score is missing or invalid. Halting execution pipeline.');
        process.exit(1);
    }

    const previousDistinctEntries = history
        .slice(0, -1)
        .filter((entry) => entry.generatedAt !== current.generatedAt)
        .filter((entry) => typeof entry?.overall?.score === 'number')
        .filter((entry, index, arr) => arr.findIndex((candidate) => candidate.generatedAt === entry.generatedAt) === index);

    if (previousDistinctEntries.length < MIN_BASELINE_SAMPLES) {
        console.log(`   ℹ️ Insufficient baseline history (${previousDistinctEntries.length}/${MIN_BASELINE_SAMPLES}). Accepting baseline.`);
        process.exit(0);
    }

    const baselineScores = previousDistinctEntries
        .slice(-WINDOW_SIZE)
        .map((entry) => entry.overall!.score as number);

    const latestBaselineScore = baselineScores[baselineScores.length - 1];
    const medianBaseline = percentile(baselineScores, 50);
    const p25Baseline = percentile(baselineScores, 25);

    const scoreFloor = Math.max(p25Baseline - SCORE_DROP_TOLERANCE, medianBaseline - SCORE_DROP_TOLERANCE);
    const deltaVsLatest = currentScore - latestBaselineScore;
    const deltaVsMedian = currentScore - medianBaseline;

    console.log(`   📊 Latest Baseline:  ${latestBaselineScore.toFixed(2)}`);
    console.log(`   📈 Current Score:    ${currentScore.toFixed(2)}`);
    console.log(`   🧮 Δ vs Latest:      ${deltaVsLatest > 0 ? '+' : ''}${deltaVsLatest.toFixed(2)}`);
    console.log(`   🧭 Median (window):  ${medianBaseline.toFixed(2)} | P25: ${p25Baseline.toFixed(2)}`);
    console.log(`   🛡️ Dynamic Floor:    ${scoreFloor.toFixed(2)} (tolerance ${SCORE_DROP_TOLERANCE.toFixed(2)})`);
    console.log(`   ⚙️ Gate Config:      window=${WINDOW_SIZE}, minSamples=${MIN_BASELINE_SAMPLES}`);

    if (currentScore < scoreFloor) {
        console.error('\n❌ [REGRESSION DETECTED] Score fell below dynamic historical floor. Halting execution pipeline.');
        process.exit(1);
    }

    if (deltaVsMedian <= 0) {
        console.log('\n⚠️ [SOFT STAGNATION] Score is below or equal to rolling median but within tolerance. Permitting pipeline to continue.');
        process.exit(0);
    }

    console.log('\n✅ [EVOLUTION VERIFIED] Score is above rolling median. Permitting pipeline to continue.');
    process.exit(0);
}

enforceDeterministicScore();
