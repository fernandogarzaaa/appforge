/**
 * Report latest swarm intelligence benchmark to Oracle and request next priority.
 *
 * Usage:
 *   npx tsx scripts/report_benchmark_to_oracle.ts
 *   npx tsx scripts/report_benchmark_to_oracle.ts --report swarm/benchmarks/latest_intelligence_report.json
 */

import fs from 'fs/promises';
import path from 'path';
import { QuantumSwarmCore } from '../swarm/core/quantum_core.js';

type Dimension = {
    name: string;
    score: number;
    passed?: boolean;
};

type BenchmarkReport = {
    generatedAt?: string;
    overall?: {
        score?: number;
        verdict?: string;
        passed?: boolean;
    };
    dimensions?: Dimension[];
};

function parseArgs(argv: string[]): { reportPath: string } {
    const idx = argv.indexOf('--report');
    const custom = idx >= 0 ? argv[idx + 1] : undefined;
    return {
        reportPath: custom || 'swarm/benchmarks/latest_intelligence_report.json'
    };
}

function toAbsolute(inputPath: string): string {
    return path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath);
}

function summarizeDimensions(dimensions: Dimension[]): string {
    return dimensions.map((d) => `${d.name}:${d.score}`).join(', ');
}

async function main(): Promise<void> {
    const { reportPath } = parseArgs(process.argv.slice(2));
    const resolvedReportPath = toAbsolute(reportPath);

    const raw = await fs.readFile(resolvedReportPath, 'utf8');
    const report = JSON.parse(raw) as BenchmarkReport;

    const dimensions = [...(report.dimensions || [])].sort((a, b) => a.score - b.score);
    if (dimensions.length === 0) {
        throw new Error(`No dimensions found in report: ${resolvedReportPath}`);
    }

    const weakest = dimensions[0];
    const overallScore = report.overall?.score ?? 0;
    const verdict = report.overall?.verdict ?? 'UNKNOWN';

    console.log('REPORTING BENCHMARK TO ORACLE');
    console.log('='.repeat(64));
    console.log(`report:   ${resolvedReportPath}`);
    console.log(`overall:  ${overallScore}/100`);
    console.log(`verdict:  ${verdict}`);
    console.log(`weakest:  ${weakest.name} (${weakest.score})`);

    const question = [
        `Benchmark report received for swarm intelligence.`,
        `Overall score: ${overallScore}/100.`,
        `Verdict: ${verdict}.`,
        `Dimension scores: ${summarizeDimensions(dimensions)}.`,
        `Given this profile, what should be the immediate top priority for the next sprint?`
    ].join(' ');

    const options = [
        'Harden reasoning with adversarial decision tasks and outcome-based learning',
        'Scale planning/autonomy capabilities and swarm orchestration features',
        'Expand coding quality automation and static verification pipeline',
        'Prioritize revenue automation before intelligence improvements',
        'Tune reliability and latency under higher concurrent workloads'
    ];

    const criteria = ['reasoning', 'risk_reduction', 'execution_speed', 'long_term_capability'];

    const quantumCore = new QuantumSwarmCore();
    const result = await quantumCore.consultOracle(question, options, criteria);

    console.log('-'.repeat(64));
    console.log(`recommendation: ${result.recommendation}`);
    console.log(`confidence:     ${(result.confidence * 100).toFixed(1)}%`);

    await quantumCore.reportOutcome(result.predictionId, true, {
        source: 'swarm_intelligence_benchmark',
        generatedAt: report.generatedAt || new Date().toISOString(),
        overallScore,
        verdict,
        weakestDimension: weakest.name,
        weakestScore: weakest.score
    });

    const outputPath = path.join(process.cwd(), 'swarm', 'benchmarks', 'oracle_from_benchmark_latest.json');
    await fs.writeFile(outputPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        reportPath: resolvedReportPath,
        benchmark: {
            overallScore,
            verdict,
            weakestDimension: weakest.name,
            weakestScore: weakest.score,
            dimensions
        },
        oracle: {
            recommendation: result.recommendation,
            confidence: result.confidence,
            alternatives: result.alternatives
        }
    }, null, 2), 'utf8');

    console.log(`saved:          ${outputPath}`);
    console.log('status:         benchmark reported to Oracle memory');
}

main().catch((error) => {
    console.error('Failed to report benchmark to Oracle:', error);
    process.exit(1);
});
