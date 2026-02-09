
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve .env.local from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// loop.ts is in /swarm/core, so root is two levels up: ../../
const envPath = path.resolve(__dirname, '../../.env.local');

console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env.local:', result.error);
}

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ FATAL: OPENAI_API_KEY not found in environment.');
    console.error('Please ensure .env.local exists in the project root and mimics the structure of .env.example');
    process.exit(1);
}

import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';
import { GitTool } from '../tools/git.js';
import { SwarmMemory } from '../core/memory.js';

import { SentinelAgent } from '../agents/Sentinel.js';
import { BugHunterAgent } from '../agents/BugHunter.js';
import { OptimizerAgent } from '../agents/Optimizer.js';
import { GodModeAgent } from '../agents/GodMode.js';

import { ProductOwnerAgent } from '../agents/ProductOwner.js';

async function main() {
    console.log('🐝 AppForge Swarm Daemon Starting...');

    // Initialize Tools
    const base44 = new Base44Tool();
    const fs = new FileSystemTool();
    const git = new GitTool();
    const memory = new SwarmMemory();

    // Initialize Agents
    const sentinel = new SentinelAgent(base44);
    const bugHunter = new BugHunterAgent(base44, fs);
    const optimizer = new OptimizerAgent(base44);
    const godMode = new GodModeAgent(base44, fs, git);
    const productOwner = new ProductOwnerAgent(base44, fs, memory);

    console.log('✅ Agents Initialized. Entering Poll Loop...');

    while (true) {
        try {
            // 1. Check for Signals
            const tasks = await base44.getPendingTasks();

            if (tasks.length > 0) {
                console.log(`📥 Received ${tasks.length} tasks.`);

                for (const task of tasks) {
                    console.log(`▶️ Executing Task: ${task.id} (${task.changes?.source})`);

                    const results: any = {};

                    // Parallel Execution of Specialist Bots
                    const [sentinelRes, bugHunterRes, optimizerRes, poRes] = await Promise.all([
                        sentinel.run(),
                        bugHunter.run(),
                        optimizer.run(),
                        productOwner.run()
                    ]);

                    results.sentinel = sentinelRes;
                    results.bugHunter = bugHunterRes;
                    results.optimizer = optimizerRes;
                    results.productOwner = poRes;

                    // Collaboration: Pass findings to God Mode
                    const context = {
                        source: task.changes?.source || 'autonomous_loop',
                        findings: results
                    };

                    results.godMode = await godMode.run(context);

                    // Complete Task
                    await base44.completeTask(task.id, results);
                    console.log(`✅ Task ${task.id} Completed.`);
                }
            } else {
                // Heartbeat / Idle check could go here
                if (process.env.ONE_SHOT === 'true') {
                    console.log('🛑 One-Shot Mode: No tasks found. Exiting.');
                    process.exit(0);
                }
            }

        } catch (error: any) {
            // ⚛️ Quantum-Enhanced Error Classification
            const errorMessage = error?.message || String(error);
            const isNetworkError =
                errorMessage.includes('ECONNRESET') ||
                errorMessage.includes('ETIMEDOUT') ||
                errorMessage.includes('502') ||
                errorMessage.includes('503') ||
                errorMessage.includes('network') ||
                errorMessage.includes('socket') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('ENOTFOUND') ||
                errorMessage.includes('fetch failed');

            const isNullError =
                errorMessage.includes('undefined') ||
                errorMessage.includes('null') ||
                errorMessage.includes('Cannot read properties');

            if (isNetworkError) {
                console.warn('⚠️ [Quantum] Network fluctuation detected. Continuing with reduced coherence...');
            } else if (isNullError) {
                console.warn('⚠️ [Quantum] Data coherence loss detected. Awaiting wave function collapse...');
            } else {
                console.error('❌ Loop Error:', errorMessage);
            }

            if (process.env.ONE_SHOT === 'true') process.exit(1);
        }

        // Wait 5 seconds before next poll
        if (process.env.ONE_SHOT === 'true') {
            console.log('🛑 One-Shot Mode: Cycle complete. Exiting.');
            process.exit(0);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

main().catch(console.error);

