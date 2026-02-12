/**
 * Manual runner for autonomous trading controller.
 *
 * Modes:
 * - --once  : run a single tick and print status
 * - --watch : run continuously (default interval from SWARM_AUTOTRADE_POLL_INTERVAL_MS)
 * - --reset : reset persisted challenge state before running
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { AutonomousTradingController } from '../swarm/core/autonomous_trading_controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

dotenv.config({ path: envPath });

function parseBooleanFlag(flag: string): boolean {
    return process.argv.slice(2).includes(flag);
}

function parseIntervalMs(): number {
    const arg = process.argv.slice(2);
    const index = arg.indexOf('--interval-ms');
    if (index < 0) {
        return Math.max(5_000, Number(process.env.SWARM_AUTOTRADE_POLL_INTERVAL_MS || 15_000));
    }

    const value = Number(arg[index + 1]);
    return Number.isFinite(value) && value >= 1_000 ? value : 15_000;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce(controller: AutonomousTradingController): Promise<void> {
    await controller.tick({ isPaused: false });
    console.log(JSON.stringify(controller.getStatus(), null, 2));
}

async function runWatch(controller: AutonomousTradingController, intervalMs: number): Promise<void> {
    console.log(`🔁 AutoTrade watch mode active (interval ${intervalMs}ms). Press Ctrl+C to stop.`);
    while (true) {
        await controller.tick({ isPaused: false });
        console.log(JSON.stringify(controller.getStatus(), null, 2));
        await sleep(intervalMs);
    }
}

async function main(): Promise<void> {
    const controller = new AutonomousTradingController();
    await controller.initialize();

    if (parseBooleanFlag('--reset')) {
        await controller.reset('manual_cli_reset');
    }

    const watch = parseBooleanFlag('--watch');
    if (!watch || parseBooleanFlag('--once')) {
        await runOnce(controller);
        return;
    }

    await runWatch(controller, parseIntervalMs());
}

main().catch((error) => {
    console.error('Autonomous trading runner failed:', error?.message || error);
    process.exit(1);
});

