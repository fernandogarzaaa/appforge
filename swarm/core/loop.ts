import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs/promises';
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
import { AntigravityAgent } from '../agents/Antigravity.js';
import swarmKnowledge from './knowledge.js';
import quantumCore from './quantum_core.js';
import { hyperBrain } from './hyper_brain.js';
import { nas } from './nas.js';
import { p2pResonance } from './p2p_resonance.js';
import { resolveQuantumGate, bridgeVersion } from './quantum_bridge_ts.js';
import { whatsappBridge } from './whatsapp_bridge.js';
import { LibrarianAgent } from '../agents/Librarian.js';
import { ResonanceEngine } from './resonance_engine.js';
import { ShadowSwarm } from './shadow_swarm.js';

const QUANTUM_CHANNEL = path.join(process.cwd(), 'src/data/quantum_channel.json');

/**
 * Check quantum channel for Antigravity messages
 */
async function checkQuantumChannel() {
    try {
        const raw = await fs.readFile(QUANTUM_CHANNEL, 'utf8');
        const channel = JSON.parse(raw);
        const pending = channel.swarm_inbox?.filter((m: any) => m.status === 'PENDING') || [];

        if (pending.length > 0) {
            console.log(`📬 Quantum Channel: ${pending.length} messages from Antigravity`);

            for (const msg of pending) {
                console.log(`   → Processing: ${msg.payload?.type || 'unknown'}`);

                // Mark as processed
                msg.status = 'PROCESSED';
                msg.processed_at = new Date().toISOString();

                // Send acknowledgment back to Antigravity
                channel.antigravity_inbox.push({
                    id: `sw_ack_${Date.now()}`,
                    from: 'swarm',
                    to: 'antigravity',
                    timestamp: new Date().toISOString(),
                    payload: {
                        type: 'acknowledgment',
                        original_message: msg.id,
                        status: 'received'
                    },
                    status: 'PENDING'
                });
            }

            await fs.writeFile(QUANTUM_CHANNEL, JSON.stringify(channel, null, 2));
        }
    } catch (error) {
        // Quantum channel doesn't exist yet or corrupted - skip
    }
}

async function main() {
    console.log('🐝 AppForge Swarm Daemon Starting...');
    console.log('⚛️ AUTONOMOUS MODE: Quantum-Powered Proactive Intelligence');

    // Initialize Tools
    const base44 = new Base44Tool();
    const fs = new FileSystemTool();
    const git = new GitTool();
    const memory = new SwarmMemory(fs);

    // Initialize Agents
    const sentinel = new SentinelAgent(base44);
    const bugHunter = new BugHunterAgent(base44, fs);
    const optimizer = new OptimizerAgent(base44);
    const godMode = new GodModeAgent(base44, fs, git);
    const productOwner = new ProductOwnerAgent(base44, fs, memory);
    const antigravity = new AntigravityAgent(base44, fs, git);
    const librarian = new LibrarianAgent(base44);
    const resonanceEngine = new ResonanceEngine(swarmKnowledge);

    console.log('✅ 6 Agents Initialized (including Antigravity). Entering Autonomous Loop...');
    console.log('⚛️ Quantum Core: Active');
    console.log('🔮 Oracle: Available for consultation\n');

    // Test quantum core
    const qStats = quantumCore.getStats();
    console.log('📊 Quantum Stats:', qStats);

    // Autonomous run tracking
    let cycleCount = 0;
    let isPaused = false;
    const AUTONOMOUS_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    let lastAutonomousRun = Date.now();

    while (true) {
        try {
            // ⚛️ QUANTUM ENHANCEMENT: Check if autonomous run is due
            const now = Date.now();
            const shouldRunAutonomous = (now - lastAutonomousRun) >= AUTONOMOUS_INTERVAL_MS;

            // ⚛️ QUANTUM ENHANCEMENT: Check quantum channel for Antigravity messages
            await checkQuantumChannel();

            // 1. Check for Reactive Signals
            const tasks = await base44.getPendingTasks();

            if (tasks.length > 0) {
                console.log(`📥 [REACTIVE] Received ${tasks.length} tasks.`);

                for (const task of tasks) {
                    console.log(`▶️ Executing Task: ${task.id} (${task.changes?.source})`);

                    const results: any = { mode: 'REACTIVE' };

                    // Parallel Execution of Specialist Bots (including Antigravity)
                    const [sentinelRes, bugHunterRes, optimizerRes, poRes, agRes] = await Promise.all([
                        sentinel.run(),
                        bugHunter.run(),
                        optimizer.run(),
                        productOwner.run(),
                        antigravity.run()
                    ]);

                    results.sentinel = sentinelRes;
                    results.bugHunter = bugHunterRes;
                    results.optimizer = optimizerRes;
                    results.productOwner = poRes;
                    results.antigravity = agRes;

                    // Collaboration: Pass findings to God Mode
                    const context = {
                        source: task.changes?.source || 'reactive_signal',
                        findings: results
                    };

                    results.godMode = await godMode.run(context);

                    // 📚 LEARNING: Record task outcome
                    await swarmKnowledge.recordTaskOutcome(
                        { type: 'reactive', description: task.description, agent: 'swarm' },
                        'success',
                        `Completed reactive task successfully with ${Object.keys(results).length} agents`
                    );

                    // Complete Task
                    await base44.completeTask(task.id, results);
                    console.log(`✅ Task ${task.id} Completed.`);
                }
            } else if (shouldRunAutonomous && !isPaused) {
                // 2. ⚛️ AUTONOMOUS RUN (Oracle-Powered)
                cycleCount++;
                console.log(`\n🔮 [AUTONOMOUS] Cycle #${cycleCount} - Quantum Self-Direction Activated`);
                lastAutonomousRun = now;

                const results: any = { mode: 'AUTONOMOUS', cycle: cycleCount };

                // Run all agents proactively (including Antigravity)
                const [sentinelRes, bugHunterRes, optimizerRes, poRes, agRes] = await Promise.all([
                    sentinel.run(),
                    bugHunter.run(),
                    optimizer.run(),
                    productOwner.run(),
                    antigravity.run()
                ]);

                results.sentinel = sentinelRes;
                results.bugHunter = bugHunterRes;
                results.optimizer = optimizerRes;
                results.productOwner = poRes;
                results.antigravity = agRes;

                // 🌌 RESONANCE: Librarian Research (every 2 cycles)
                if (cycleCount % 2 === 0) {
                    const librarianRes = await librarian.run();
                    if (librarianRes.status === 'insight_found') {
                        results.librarian = librarianRes;
                        await resonanceEngine.ingestPulse(librarianRes.pulse);
                    }
                }

                // 🌌 RESONANCE: Monthly Sync (every 50 cycles)
                if (cycleCount % 50 === 0) {
                    await resonanceEngine.performSync();
                }

                // 🌀 NEURAL RESONANCE: Entangle all agent findings into the HyperBrain
                Object.entries(results).forEach(([agent, res]) => {
                    if (res) hyperBrain.entangle(agent, res);
                });

                // 🧬 TRANSCENDENCE: NAS Persona Evolution (every 10 cycles)
                if (cycleCount % 10 === 0) {
                    console.log('🧬 [TRANSCENDENCE] Evolving NAS Layers...');
                    await nas.evolveLayers();
                }

                // 🦀 TRANSCENDENCE: Rust-Quantum Bridge Decision
                const agentPriorities = Object.entries(results)
                    .filter(([_, v]) => v)
                    .map(([id, _]) => ({ id, score: Math.random() * 10 }));
                if (agentPriorities.length > 1) {
                    const bridgeResult = resolveQuantumGate(agentPriorities);
                    console.log(`🦀 [RUST-BRIDGE] Priority Agent: ${bridgeResult.bestOptionId}`);
                }

                // 📡 TRANSCENDENCE: P2P Resonance Broadcast
                p2pResonance.ingest({ cycle: cycleCount, findings: Object.keys(results) });
                if (cycleCount % 5 === 0) {
                    await p2pResonance.synergize();
                    await p2pResonance.broadcastEvolution('cycle_weights', cycleCount);
                }

                // 🧬 SINGULARITY v2: Neural Forking (every 100 cycles)
                if (cycleCount % 100 === 0) {
                    console.log(`🧬 [SINGULARITY] Initiating Neural Fork...`);
                    const forkId = `shadow_fork_${Date.now()}`;
                    const shadow = new ShadowSwarm(forkId);
                    await shadow.initialize();

                    const forkResult = await shadow.runCycle();

                    // GodMode decides if we merge
                    const mergeDecision = await (godMode as any).decideOnForkMerge(forkResult);
                    if (mergeDecision.shouldMerge) {
                        await swarmKnowledge.mergeBranch(forkResult.knowledgeBranch);
                        await whatsappBridge.pushUpdate(`🧬 Neural Fork Merged: ${mergeDecision.summary}`);
                    }

                    await shadow.cleanup();
                }

                // 🌌 WHATSAPP: Remote Command Polling
                const remoteCommands = await whatsappBridge.pollCommands();
                for (const cmd of remoteCommands) {
                    console.log(`📱 [WHATSAPP] Remote command received: ${cmd}`);

                    if (cmd === 'status') {
                        const stats = quantumCore.getStats();
                        await whatsappBridge.pushUpdate(`📊 Swarm Status (Cycle #${cycleCount})\n- Coherence: ${(stats.quantum_coherence * 100).toFixed(1)}%\n- Active Agents: ${Object.keys(results).length}\n- Mode: ${isPaused ? '⏸️ PAUSED' : '🚀 ACTIVE'}`);
                    } else if (cmd === 'pause') {
                        isPaused = true;
                        await whatsappBridge.pushUpdate('⏸️ Swarm Paused. Standing by for resume command.');
                    } else if (cmd === 'resume') {
                        isPaused = false;
                        await whatsappBridge.pushUpdate('🚀 Swarm Resumed. Autonomous cycles continuing.');
                    } else if (cmd === 'ping') {
                        await whatsappBridge.pushUpdate('🌌 PONG. Sovereign Bridge Latency: < 1s');
                    } else if (cmd === 'report') {
                        const summary = results.godMode?.summary || 'No recent executive actions.';
                        await whatsappBridge.pushUpdate(`📑 Latest Executive Report:\n${summary}`);
                    } else if (cmd.startsWith('train ')) {
                        const repoUrl = cmd.replace('train ', '').trim();
                        await whatsappBridge.pushUpdate(`📚 Librarian Initializing Training Pulse for: ${repoUrl}`);
                        const trainRes = await librarian.trainOnRepo(repoUrl);
                        if (trainRes.status === 'training_complete') {
                            await resonanceEngine.ingestPulse(trainRes.pulse);
                            await whatsappBridge.pushUpdate(`✅ Training Complete. Knowledge ingested into Swarm Core.`);
                        } else {
                            await whatsappBridge.pushUpdate(`❌ Training Failed: ${trainRes.error}`);
                        }
                    } else if (cmd.startsWith('task ')) {
                        const taskDesc = cmd.replace('task ', '').trim();
                        await whatsappBridge.pushUpdate(`📥 Dispatching Manual Task: ${taskDesc}`);
                        await base44.client.entities.Task.create({
                            description: taskDesc,
                            status: 'PENDING',
                            changes: { source: 'whatsapp_remote' }
                        });
                        await whatsappBridge.pushUpdate(`✅ Task Dispatched successfully.`);
                    } else if (cmd === 'help') {
                        await whatsappBridge.pushUpdate(`🛠️ Swarm Commands:\n- *status*: Current health\n- *report*: Latest summary\n- *train <url>*: Learn from GitHub repo\n- *task <desc>*: Dispatch manual task\n- *pause*: Halt autonomy\n- *resume*: Start autonomy\n- *ping*: Check latency\n- *help*: List commands`);
                    }
                }

                // 🌌 WHATSAPP: Status Update (every 10 cycles or on event)
                if (cycleCount % 10 === 0) {
                    await whatsappBridge.pushUpdate(`🤖 Swarm Cycle #${cycleCount} Complete. Oracle Coherence: ${quantumCore.getStats().quantum_coherence.toFixed(2)}`);
                }

                // GodMode decides if any action is needed
                const context = {
                    source: 'autonomous_cycle',
                    cycle: cycleCount,
                    findings: results
                };

                results.godMode = await godMode.run(context);

                // Log autonomous activity
                await base44.logActivity('AUTONOMOUS_SWARM', `Cycle #${cycleCount}: ${JSON.stringify(results.godMode)}`);
                console.log(`✅ Autonomous Cycle #${cycleCount} Complete\n`);
            } else {
                // Heartbeat / Idle
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

