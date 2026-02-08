
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' }); // Ensure env is loaded

import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';
import { GitTool } from '../tools/git.js';

import { SentinelAgent } from '../agents/Sentinel.js';
import { BugHunterAgent } from '../agents/BugHunter.js';
import { OptimizerAgent } from '../agents/Optimizer.js';
import { GodModeAgent } from '../agents/GodMode.js';

async function main() {
    console.log('🐝 AppForge Swarm Daemon Starting...');

    // Initialize Tools
    const base44 = new Base44Tool();
    const fs = new FileSystemTool();
    const git = new GitTool();

    // Initialize Agents
    const sentinel = new SentinelAgent(base44);
    const bugHunter = new BugHunterAgent(base44, fs);
    const optimizer = new OptimizerAgent(base44);
    const godMode = new GodModeAgent(base44, fs, git);

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
                    const [sentinelRes, bugHunterRes, optimizerRes] = await Promise.all([
                        sentinel.run(),
                        bugHunter.run(),
                        optimizer.run()
                    ]);

                    results.sentinel = sentinelRes;
                    results.bugHunter = bugHunterRes;
                    results.optimizer = optimizerRes;

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
            }

        } catch (error: any) {
            console.error('❌ Loop Error:', error.message);
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

main().catch(console.error);
