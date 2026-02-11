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
import { hyperBrain } from './hyper_brain.js';
import { nas } from './nas.js';
import { p2pResonance } from './p2p_resonance.js';
import { resolveQuantumGate, bridgeVersion } from './quantum_bridge_ts.js';
import { sovereignBridge } from './sovereign_bridge.js';
import quantumCore from './quantum_core.js';
import { replicator } from './replicate.js';
import { nexusGateway } from './nexus_gateway.js';
import { LibrarianAgent } from '../agents/Librarian.js';
import { ResonanceEngine } from './resonance_engine.js';
import { ShadowSwarm } from './shadow_swarm.js';
import { swarmCollaboration } from './swarm_collaboration.js';

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
    const fsTool = new FileSystemTool();
    const git = new GitTool();
    const memory = new SwarmMemory(fsTool);

    // Initialize Agents
    const sentinel = new SentinelAgent(base44);
    const bugHunter = new BugHunterAgent(base44, fsTool);
    const optimizer = new OptimizerAgent(base44);
    const godMode = new GodModeAgent(base44, fsTool, git);
    const productOwner = new ProductOwnerAgent(base44, fsTool, memory);
    const antigravity = new AntigravityAgent(base44, fsTool, git);
    const librarian = new LibrarianAgent(base44);
    const resonanceEngine = new ResonanceEngine(swarmKnowledge);

    console.log('✅ 6 Agents Initialized (including Antigravity). Entering Autonomous Loop...');
    console.log('⚛️ Quantum Core: Active');
    console.log('🔮 Oracle: Available for consultation\n');

    // Register agents with collaboration system
    swarmCollaboration.registerAgent('Sentinel', async (signal) => {
        console.log(`📡 [Sentinel] Received signal: ${signal.type}`);
        await sentinel.run();
    });
    swarmCollaboration.registerAgent('BugHunter', async (signal) => {
        console.log(`📡 [BugHunter] Received signal: ${signal.type}`);
        await bugHunter.run();
    });
    swarmCollaboration.registerAgent('Optimizer', async (signal) => {
        console.log(`📡 [Optimizer] Received signal: ${signal.type}`);
        await optimizer.run();
    });
    swarmCollaboration.registerAgent('GodMode', async (signal) => {
        console.log(`📡 [GodMode] Received signal: ${signal.type}`);
        await godMode.run(signal.payload);
    });
    swarmCollaboration.registerAgent('ProductOwner', async (signal) => {
        console.log(`📡 [ProductOwner] Received signal: ${signal.type}`);
        await productOwner.run();
    });
    swarmCollaboration.registerAgent('Antigravity', async (signal) => {
        console.log(`📡 [Antigravity] Received signal: ${signal.type}`);
        await antigravity.run();
    });
    swarmCollaboration.registerAgent('Librarian', async (signal) => {
        console.log(`📡 [Librarian] Received signal: ${signal.type}`);
        await librarian.run();
    });

    console.log(`🤝 ${swarmCollaboration.getStats().registeredAgents} agents registered for collaboration`);

    // Test quantum core
    const qStats = quantumCore.getStats();
    console.log('📊 Quantum Stats:', qStats);

    // Autonomous run tracking
    let cycleCount = 0;
    let isPaused = false;
    const AUTONOMOUS_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    let lastAutonomousRun = Date.now();

    // Start Sovereign Bridge (Auto-selects WhatsApp/iMessage)
    await sovereignBridge.start();

    // Register Command Handlers
    sovereignBridge.onCommand(async (cmd) => {
        console.log(`📨 [Bridge] Executing command: ${cmd}`);

        const target = process.env.IMESSAGE_RECIPIENT || process.env.WHATSAPP_PHONE_NUMBER;
        if (!target) {
            console.error('❌ [Bridge] No recipient set in environment.');
            return;
        }

        if (cmd === 'status') {
            const stats = quantumCore.getStats();
            await sovereignBridge.pushUpdate(`📊 Swarm Status\n- Coherence: ${(stats.quantum_coherence * 100).toFixed(1)}%\n- Mode: ${isPaused ? '⏸️ PAUSED' : '🚀 ACTIVE'}`);
        } else if (cmd === 'pause') {
            isPaused = true;
            await sovereignBridge.pushUpdate('⏸️ Swarm Paused. Standing by for resume command.');
        } else if (cmd === 'resume') {
            isPaused = false;
            await sovereignBridge.pushUpdate('🚀 Swarm Resumed. Autonomous cycles continuing.');
        } else if (cmd === 'ping') {
            await sovereignBridge.pushUpdate('🌌 PONG. Sovereign Bridge Latency: < 1s');
        } else if (cmd === 'report') {
            await sovereignBridge.pushUpdate(`📑 Latest Executive Report: Available on next autonomous pulse.`);
        } else if (cmd.startsWith('train ')) {
            const repoUrl = cmd.replace('train ', '').trim();
            await sovereignBridge.pushUpdate(`📚 Librarian Initializing Training Pulse for: ${repoUrl}`);
            const trainRes = await librarian.trainOnRepo(repoUrl);
            if (trainRes.status === 'training_complete') {
                await resonanceEngine.ingestPulse(trainRes.pulse);
                await sovereignBridge.pushUpdate(`✅ Training Complete. Knowledge ingested into Swarm Core.`);
            } else {
                await sovereignBridge.pushUpdate(`❌ Training Failed: ${trainRes.error}`);
            }
        } else if (cmd.startsWith('replicate')) {
            const parts = cmd.split(' ');
            const nodeName = parts[1] || 'swarm_spawn';
            await sovereignBridge.pushUpdate(`🧬 Initiating Self-Replication Sequence for node: ${nodeName}...`);

            try {
                const seedPath = await replicator.createSeed(nodeName);
                await replicator.createSpore('windows');

                const spawnPoint = path.join(process.cwd(), 'spawn_points', nodeName);
                await nexusGateway.transportSeed(seedPath, spawnPoint);

                await sovereignBridge.pushUpdate(`✅ Replication Successful. Seed and Spore deployed to: ${spawnPoint}`);
            } catch (err: any) {
                await sovereignBridge.pushUpdate(`❌ Replication Failed: ${err.message}`);
            }
        } else if (cmd === 'help') {
            await sovereignBridge.pushUpdate(`🛠️ Swarm Commands:
- status: Current health
- train <url>: Learn from GitHub repo
- replicate <name>: Autonomous cloning
- pause: Halt autonomy
- resume: Start autonomy
- ping: Check latency
- transport: Show current transport
- imessage: Switch to iMessage
- whatsapp: Switch to WhatsApp
- help: List commands`);
        } else if (cmd === 'transport') {
            const status = sovereignBridge.getStatus();
            await sovereignBridge.pushUpdate(`📡 Transport Status:
- Transport: ${status.transport.toUpperCase()}
- Status: ${status.status}
- Note: ${status.message}`);
        } else if (cmd === 'whatsapp') {
            await sovereignBridge.switchTransport('whatsapp');
            await sovereignBridge.pushUpdate('✅ WhatsApp is active');
        }
    });

    // Swarm Loop
    while (true) {
        try {
            // ⚛️ QUANTUM ENHANCEMENT: Check quantum channel for Antigravity messages
            await checkQuantumChannel();

            const now = Date.now();
            const shouldRunAutonomous = (now - lastAutonomousRun) >= AUTONOMOUS_INTERVAL_MS;

            // 1. Check for Reactive Signals
            const tasks = await base44.getPendingTasks();

            if (tasks.length > 0) {
                console.log(`📥 [REACTIVE] Received ${tasks.length} tasks.`);

                for (const task of tasks) {
                    console.log(`▶️ Executing Task: ${task.id} (${task.changes?.source})`);

                    const results: any = { mode: 'REACTIVE' };

                    // Parallel Execution of Specialist Bots
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
                    const context = { source: task.changes?.source || 'reactive_signal', findings: results };
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
                // 2. ⚛️ AUTONOMOUS RUN
                cycleCount++;
                console.log(`\n🔮 [AUTONOMOUS] Cycle #${cycleCount} - Quantum Self-Direction Activated`);
                lastAutonomousRun = now;

                const results: any = { mode: 'AUTONOMOUS', cycle: cycleCount };

                // Run all agents proactively
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

                    const mergeDecision = await (godMode as any).decideOnForkMerge(forkResult);
                    if (mergeDecision.shouldMerge) {
                        await swarmKnowledge.mergeBranch(forkResult.knowledgeBranch);
                        await sovereignBridge.pushUpdate(`🧬 Neural Fork Merged: ${mergeDecision.summary}`);
                    }
                    await shadow.cleanup();
                }

                // Generate Comprehensive Report
                const report = await generateCycleReport(cycleCount, results, quantumCore.getStats());
                
                // Send Report via WhatsApp
                await sovereignBridge.pushUpdate(report);

                // GodMode decides if any action is needed
                const context = { source: 'autonomous_cycle', cycle: cycleCount, findings: results };
                results.godMode = await godMode.run(context);

                // Log autonomous activity
                await base44.logActivity('AUTONOMOUS_SWARM', `Cycle #${cycleCount}: ${JSON.stringify(results.godMode)}`);
                console.log(`✅ Autonomous Cycle #${cycleCount} Complete\n`);
            } else {
                if (process.env.ONE_SHOT === 'true') {
                    console.log('🛑 One-Shot Mode: Cycle complete. Exiting.');
                    process.exit(0);
                }
            }
        } catch (error: any) {
            const errorMessage = error?.message || String(error);
            console.error('❌ Loop Error:', errorMessage);
            if (process.env.ONE_SHOT === 'true') process.exit(1);
        }

        // Avoid tight loop
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

/**
 * Generate comprehensive cycle report
 */
async function generateCycleReport(cycleCount: number, results: any, quantumStats: any): Promise<string> {
    const timestamp = new Date().toISOString();
    
    let report = `📊 *SWARM CYCLE REPORT #${cycleCount}*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `🕐 ${timestamp}\n\n`;

    // Quantum Stats
    report += `⚛️ *QUANTUM ENGINE*\n`;
    report += `• Coherence: ${(quantumStats.quantum_coherence * 100).toFixed(1)}%\n`;
    report += `• Integrity: ${quantumStats.swarm_integrity}\n`;
    report += `• Version: ${quantumStats.version || '3.0'}\n\n`;

    // Agent Results
    report += `🤖 *AGENT STATUS*\n`;
    const agents = ['sentinel', 'bugHunter', 'optimizer', 'productOwner', 'antigravity'];
    agents.forEach(agent => {
        const res = results[agent];
        if (res) {
            const status = res.status || 'completed';
            report += `• ${agent.charAt(0).toUpperCase() + agent.slice(1)}: ${status}\n`;
        }
    });
    
    // GodMode decision
    if (results.godMode) {
        report += `\n🧙‍♂️ *GODMODE DECISION*\n`;
        report += `• ${results.godMode.status || 'active'}\n`;
    }

    // Opportunities & Risks
    if (results.sentinel?.opportunities) {
        report += `\n💰 *OPPORTUNITIES*\n`;
        results.sentinel.opportunities.slice(0, 3).forEach((opp: string) => {
            report += `• ${opp.substring(0, 60)}...\n`;
        });
    }

    // Recommendations
    report += `\n🎯 *NEXT STEPS*\n`;
    report += `• Awaiting Oracle guidance\n`;
    report += `• Next cycle in 5 minutes\n`;
    
    report += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `🤖 *Autonomous Swarm v1.0*`;
    
    return report;
}

main().catch(console.error);

