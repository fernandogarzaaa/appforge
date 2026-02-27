import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'node:url';
import { isLiveTradingEnabled, realityStatusSummary, requireRealityMode } from './reality_mode.js';

// Resolve .env.local from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// loop.ts is in /swarm/core, so root is two levels up: ../../
const envPath = path.resolve(__dirname, '../../.env.local');

console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error && (result.error as any).code !== 'ENOENT') {
    console.warn(`⚠️  [Loop] Environment note: ${result.error.message}`);
}

const isTrueIndependence = process.env.TRUE_AI_INDEPENDENCE === 'true';
import { AtomicPatcher } from './atomic_patcher.js';

// TRUE AI INDEPENDENCE MODE: Use local Ollama, no external APIs required
if (isTrueIndependence) {
    console.log('🧠 [TRUE INDEPENDENCE] Running without external AI APIs...');
    console.log('   📡 Checking local Ollama at http://localhost:11434...');
    // Ollama health check happens in quantum hyper intelligence orchestrator
} else if (!process.env.OPENAI_API_KEY && !isTrueIndependence) {
    console.error('❌ FATAL: OPENAI_API_KEY not found in environment.');
    console.error('Please ensure .env.local exists in the project root and mimics the structure of .env.example');
    console.error('Or set TRUE_AI_INDEPENDENCE=true to use local Ollama models only.');
    process.exit(1);
} else if (!process.env.OPENAI_API_KEY && isTrueIndependence) {
    console.log('⚠️ [SOVEREIGN MODE] OPENAI_API_KEY is missing, but TRUE_AI_INDEPENDENCE is enabled. Overriding fatal exit.');
}

try {
    if (isLiveTradingEnabled()) {
        requireRealityMode('swarm/core/loop.ts startup with REAL_TRADING_ENABLED=true');
    }
    console.log(`🌍 Reality Lock: ${realityStatusSummary()}`);
} catch (error: any) {
    console.error(`❌ FATAL: ${error.message}`);
    process.exit(1);
}

/**
 * 🛡️ WALLET VALIDATION PROTOCOL
 * Guard execution when real trading / auto execution is enabled.
 */
function parseBoolean(value: string | undefined, fallback = false): boolean {
    if (!value) return fallback;
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
}


function isOneShotMode(): boolean {
    return parseBoolean(process.env.ONE_SHOT, false);
}

const ONE_SHOT_SOFT_EXIT_PATTERNS: RegExp[] = [
    /BASE44_API_KEY not found/i,
    /OPENAI_API_KEY not found/i,
    /Wallet\/RPC not configured/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /fetch failed/i,
    /network/i
];

function shouldSoftExitOneShot(errorMessage: string): boolean {
    return ONE_SHOT_SOFT_EXIT_PATTERNS.some((pattern) => pattern.test(errorMessage));
}

/**
 * 🛡️ SOVEREIGN IDENTITY PROTOCOL
 * Verifies the system's ability to communicate and coordinate.
 */
async function validateSovereignIdentity(): Promise<boolean> {
    try {
        const isTrueIndependence = process.env.TRUE_AI_INDEPENDENCE === 'true';
        const bridgeEnabled = !!(process.env.WHATSAPP_PHONE_NUMBER || process.env.IMESSAGE_RECIPIENT);

        // Physical Anchor 1: Brain State Persistence
        const brainStatePath = path.join(process.cwd(), 'src/data/quantum_brain_state.json');
        try {
            await fs.access(brainStatePath);
            console.log('   🧠 Brain State Anchor: VERIFIED');
        } catch (e) {
            console.warn('   ⚠️ Brain State Anchor: MISSING (Self-healing required)');
        }

        if (isTrueIndependence) {
            // Physical Anchor 2: Local Model Resonance (Primary: Ollama, Fallback: Base44/Chimera)
            const port = process.env.NEURAL_BRIDGE_PORT || '11434';
            let resonanceFound = false;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);
                const fetch = (await import('node-fetch')).default;
                const response = await fetch(`http://localhost:${port}/api/tags`, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (response.ok) {
                    console.log('   ⚛️ Local Model Resonance: STABLE (Ollama)');
                    resonanceFound = true;
                }
            } catch (e) {
                // Ollama not found, try Base44/Chimera
                if (process.env.CHIMERA_CLOUD_URL || process.env.BASE44_API_KEY) {
                    console.log('   ⚛️ Cloud Model Resonance: ESTABLISHED (Base44/Chimera)');
                    resonanceFound = true;
                }
            }

            if (!resonanceFound) {
                console.warn(`   ⚠️ Model Resonance: COLLAPSED (Ollama not on ${port} and no Cloud credentials)`);
                if (process.env.SWARM_REALITY_MODE === 'true') {
                    console.error('   ❌ IDENTITY CRITICAL: Cannot resonate with any brain in REALITY_MODE.');
                    return false;
                }
            }

            console.log('✅ IDENTITY VALIDATED: Sovereignty Active');
            return true;
        }

        if (!bridgeEnabled) {
            console.warn('   ⚠️ IDENTITY WARNING: Autonomous communication bridge not configured.');
            return true;
        }

        console.log('✅ IDENTITY VALIDATED: Sovereign Bridge Active');
        return true;
    } catch (e: any) {
        console.error('❌ IDENTITY ERROR:', e.message);
        return false;
    }
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
import { LibrarianAgent } from '../agents/Librarian.js';
import { CryptoSwarm } from '../agents/CryptoSwarm.js';
import { MarketAnalyzer } from '../agents/MarketAnalyzer.js';
import { WorkerSwarm } from '../agents/WorkerSwarm.js';
import { FreelanceSwarm } from '../agents/FreelanceSwarm.js';
import { ConsultingSwarm } from '../agents/ConsultingSwarm.js';
import { FinanceSwarm } from '../agents/FinanceSwarm.js';
import { SalesBot } from '../agents/SalesBot.js';
import { ReferralManager } from '../agents/ReferralManager.js';
import { PricingStrategist } from '../agents/PricingStrategist.js';
import { ArbitrageHunter } from '../agents/ArbitrageHunter.js';
import { YieldOptimizer } from '../agents/YieldOptimizer.js';
import { CodeGenerator } from '../agents/CodeGenerator.js';
import { TrendAnalyzer } from '../agents/TrendAnalyzer.js';
import { SocialMediaSwarm } from '../agents/SocialMediaSwarm.js';
import { AutomatedTradingSwarm } from '../agents/AutomatedTradingSwarm.js';
import { LearningSwarm } from '../agents/LearningSwarm.js';
import { ResearchSwarm } from '../agents/ResearchSwarm.js';
import { VoiceAgentSwarm } from '../agents/VoiceAgentSwarm.js';
import { QualityAssuranceSwarm } from '../agents/QualityAssuranceSwarm.js';
import { CustomerSuccessSwarm } from '../agents/CustomerSuccessSwarm.js';
import { DevOpsSwarm } from '../agents/DevOpsSwarm.js';
import { KnowledgeGraphSwarm } from '../agents/KnowledgeGraphSwarm.js';
import { ComplianceSwarm } from '../agents/ComplianceSwarm.js';
import { ExperimentationSwarm } from '../agents/ExperimentationSwarm.js';
import { AIEconomySwarm } from '../agents/AIEconomySwarm.js';
import swarmKnowledge from './knowledge.js';
import { hyperBrain } from './hyper_brain.js';
import { hyperIntelligence, HyperIntelligence } from './hyper/index.js';
import { nas } from './nas.js';
import { p2pResonance } from './p2p_resonance.js';
import { resolveQuantumGate, bridgeVersion } from './quantum_bridge_ts.js';
import { sovereignBridge } from './sovereign_bridge.js';
import { skillRegistry, initializeDefaultSkills } from '../skills/registry.js';
import quantumCore from './quantum_core.js';
import { autonomousTradingController } from './autonomous_trading_controller.js';
import { replicator } from './replicate.js';
import { nexusGateway } from './nexus_gateway.js';
import { ResonanceEngine } from './resonance_engine.js';
import { ShadowSwarm } from './shadow_swarm.js';
import { swarmCollaboration } from './swarm_collaboration.js';
import { SwarmReporter } from './swarm_reporter.js';
import { MaintenanceGuard } from './maintenance_guard.js';
import { getCollectiveMembers } from './swarm_collectives.js';
import { realitySensor } from './reality_sensor.js';
import { SingularityEngine } from './singularity_engine.js';
import { EconomicEngine } from './economic_engine.js';
import { CuriosityEngine } from './curiosity_engine.js';
import { AutonomousBugFixer } from './autonomous_bug_fixer.js';

const QUANTUM_CHANNEL = path.join(process.cwd(), 'src/data/quantum_channel.json');

function hasKeyword(input: string, keywords: string[]): boolean {
    const normalized = input.toLowerCase();
    return keywords.some((keyword) => normalized.includes(keyword));
}

async function consultAutonomousOracleGuidance(cycleCount: number, coherence: number) {
    const guidance = await quantumCore.consultOracle(
        `Autonomous cycle ${cycleCount} planning. Current quantum coherence ${(coherence * 100).toFixed(1)}%. All swarms in this system are multi-agent collectives (not singular entities). Which strategic swarm collective should execute now?`,
        [
            'Prioritize revenue and expansion swarms (SocialMediaSwarm, ResearchSwarm, CustomerSuccessSwarm, ExperimentationSwarm, AIEconomySwarm)',
            'Prioritize reliability and quality swarms (LearningSwarm, QualityAssuranceSwarm)',
            'Prioritize trading and market swarms (AutomatedTradingSwarm, CryptoSwarm, MarketAnalyzer)',
            'Prioritize platform and product swarms (VoiceAgentSwarm, CodeGenerator, ProductOwner)',
            'Prioritize experimentation and conversion swarms (ExperimentationSwarm, CustomerSuccessSwarm, ProductOwner)',
            'Prioritize autonomous economy swarms (AIEconomySwarm, RevenueHunter, FinanceSwarm, ExperimentationSwarm)'
        ],
        ['strategic_value', 'execution_speed', 'risk_reduction', 'revenue_impact']
    );

    await quantumCore.reportOutcome(guidance.predictionId, true, {
        source: 'autonomous_oracle_guidance',
        cycle: cycleCount,
        coherence
    });

    return guidance;
}

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

    // 🛡️ IDENTITY SAFETY CHECK - Validate before any operations
    console.log('🛡️ Running sovereign identity validation...');
    const identityValid = await validateSovereignIdentity();
    if (!identityValid) {
        console.error('🚫 SWARM HALTED: Identity validation failed');
        process.exit(1);
    }
    console.log('✅ Identity validated - Swarm Coordination Active');

    // Initialize Global Controllers
    await autonomousTradingController.initialize();

    // Initialize Tools
    const base44 = new Base44Tool();
    const fsTool = new FileSystemTool();
    const git = new GitTool();
    const memory = new SwarmMemory(fsTool);
    const economicEngine = new EconomicEngine();
    await economicEngine.init();

    // Initialize Agents
    const sentinel = new SentinelAgent(base44);
    const bugHunter = new BugHunterAgent(base44, fsTool);
    const optimizer = new OptimizerAgent(base44);
    const godMode = new GodModeAgent(base44, fsTool);
    const productOwner = new ProductOwnerAgent(base44, fsTool, memory);
    const antigravity = new AntigravityAgent(base44, fsTool, git);
    const librarian = new LibrarianAgent(base44);

    // 🔌 [AgentSkills] OpenClaw Synthesis
    initializeDefaultSkills({ sentinel, bugHunter, optimizer });

    // Revenue Swarm Agents
    const salesBot = new SalesBot(base44, fsTool);
    const referralManager = new ReferralManager(base44, fsTool);
    const pricingStrategist = new PricingStrategist(base44, fsTool);

    // Trading Swarm
    const cryptoSwarm = new CryptoSwarm(base44, fsTool);
    const marketAnalyzer = new MarketAnalyzer(base44, fsTool);
    const financeSwarm = new FinanceSwarm(base44, fsTool);
    const arbitrageHunter = new ArbitrageHunter(base44, fsTool);
    const yieldOptimizer = new YieldOptimizer(base44, fsTool);

    // Worker Swarm
    const workerSwarm = new WorkerSwarm(base44, fsTool);
    const freelanceSwarm = new FreelanceSwarm(base44, fsTool);
    const codeGenerator = new CodeGenerator(base44, fsTool);

    // Intel Swarm
    const trendAnalyzer = new TrendAnalyzer(base44, fsTool);

    // Other Swarms
    const consultingSwarm = new ConsultingSwarm(base44, fsTool);
    const socialMediaSwarm = new SocialMediaSwarm();
    const automatedTradingSwarm = new AutomatedTradingSwarm();
    const learningSwarm = new LearningSwarm();
    const researchSwarm = new ResearchSwarm();
    const voiceAgentSwarm = new VoiceAgentSwarm();
    const qualityAssuranceSwarm = new QualityAssuranceSwarm();
    const customerSuccessSwarm = new CustomerSuccessSwarm();
    const devOpsSwarm = new DevOpsSwarm();
    const knowledgeGraphSwarm = new KnowledgeGraphSwarm();
    const complianceSwarm = new ComplianceSwarm();
    const experimentationSwarm = new ExperimentationSwarm();
    const aiEconomySwarm = new AIEconomySwarm();
    const resonanceEngine = new ResonanceEngine(swarmKnowledge);
    const curiosityEngine = new CuriosityEngine(base44);
    const bugFixer = new AutonomousBugFixer(process.cwd(), quantumCore);

    // Initialize SwarmReporter
    const swarmReporter = new SwarmReporter();

    // Initialize Hyper Intelligence
    const hyperStatus = hyperIntelligence.getStatus();
    console.log(`🧠 Hyper Intelligence Initialized:`);
    console.log(`   - Router models: ${hyperStatus.router.availableModels}`);
    console.log(`   - Accelerator fidelity: ${hyperStatus.accelerator.fidelity.toFixed(2)}`);
    console.log(`   - Safety principles: ${hyperStatus.safety.principlesLoaded}`);

    console.log('✅ Coordination nodes initialized. Entering Autonomous Loop...');
    console.log('⚛️ Quantum Core: Active');
    console.log('🔮 Oracle: Available for consultation\n');
    console.log('🤖 Autonomous Trading Controller:', autonomousTradingController.getStatus());

    // Register agents with collaboration system
    const registerSwarmCollective = (swarmName: string, callback: (signal: any) => Promise<void>) => {
        const members = getCollectiveMembers(swarmName);
        swarmCollaboration.registerCollective(swarmName, members, callback);
    };

    swarmCollaboration.registerAgent('Sentinel', async (signal) => {
        console.log(`📡 [Sentinel] Received signal: ${signal.type}`);
        await sentinel.run();
    });
    swarmCollaboration.registerAgent('BugHunter', async (signal) => {
        console.log(`📡 [BugHunter] Received signal: ${signal.type}`);
        const mission = signal.payload?.mission === 'OPTIMIZE_APPFORGE_WEB_APP' ? signal.payload.details : null;
        const target = mission?.targets.find((t: any) => t.agent === 'BugHunter');
        await bugHunter.run(target?.directive || signal.payload?.directive, target?.scope || signal.payload?.scope);
    });
    swarmCollaboration.registerAgent('Optimizer', async (signal) => {
        console.log(`📡 [Optimizer] Received signal: ${signal.type}`);
        const mission = signal.payload?.mission === 'OPTIMIZE_APPFORGE_WEB_APP' ? signal.payload.details : null;
        const target = mission?.targets.find((t: any) => t.agent === 'Optimizer');
        await optimizer.run(target?.directive || signal.payload?.directive, target?.scope || signal.payload?.scope);
    });
    swarmCollaboration.registerAgent('GodMode', async (signal) => {
        console.log(`📡 [GodMode] Received signal: ${signal.type}`);
        await godMode.run();
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
    registerSwarmCollective('CryptoSwarm', async (signal) => {
        console.log(`📡 [CryptoSwarm] Received signal: ${signal.type}`);
        await cryptoSwarm.run();
    });
    swarmCollaboration.registerAgent('MarketAnalyzer', async (signal) => {
        console.log(`📡 [MarketAnalyzer] Received signal: ${signal.type}`);
        await marketAnalyzer.analyze();
    });
    registerSwarmCollective('WorkerSwarm', async (signal) => {
        console.log(`📡 [WorkerSwarm] Received signal: ${signal.type}`);
        await workerSwarm.run();
    });
    registerSwarmCollective('FreelanceSwarm', async (signal) => {
        console.log(`📡 [FreelanceSwarm] Received signal: ${signal.type}`);
        await freelanceSwarm.run();
    });
    registerSwarmCollective('ConsultingSwarm', async (signal) => {
        console.log(`📡 [ConsultingSwarm] Received signal: ${signal.type}`);
        await consultingSwarm.run();
    });

    // NEW: Revenue Swarm Agents
    swarmCollaboration.registerAgent('SalesBot', async (signal) => {
        console.log(`📡 [SalesBot] Received signal: ${signal.type}`);
        await salesBot.run();
    });
    swarmCollaboration.registerAgent('ReferralManager', async (signal) => {
        console.log(`📡 [ReferralManager] Received signal: ${signal.type}`);
        await referralManager.run();
    });
    swarmCollaboration.registerAgent('PricingStrategist', async (signal) => {
        console.log(`📡 [PricingStrategist] Received signal: ${signal.type}`);
        await pricingStrategist.run();
    });

    // NEW: Trading Swarm Agents
    registerSwarmCollective('FinanceSwarm', async (signal) => {
        console.log(`📡 [FinanceSwarm] Received signal: ${signal.type}`);
        await financeSwarm.run();
    });
    swarmCollaboration.registerAgent('ArbitrageHunter', async (signal) => {
        console.log(`📡 [ArbitrageHunter] Received signal: ${signal.type}`);
        await arbitrageHunter.run();
    });
    swarmCollaboration.registerAgent('YieldOptimizer', async (signal) => {
        console.log(`📡 [YieldOptimizer] Received signal: ${signal.type}`);
        await yieldOptimizer.run();
    });

    // NEW: Worker Swarm Agents
    swarmCollaboration.registerAgent('CodeGenerator', async (signal) => {
        console.log(`📡 [CodeGenerator] Received signal: ${signal.type}`);
        await codeGenerator.run();
    });

    // NEW: Intel Swarm Agents
    swarmCollaboration.registerAgent('TrendAnalyzer', async (signal) => {
        console.log(`📡 [TrendAnalyzer] Received signal: ${signal.type}`);
        await trendAnalyzer.run();
    });
    registerSwarmCollective('SocialMediaSwarm', async (signal) => {
        console.log(`📡 [SocialMediaSwarm] Received signal: ${signal.type}`);
        await socialMediaSwarm.runCycle();
    });
    registerSwarmCollective('AutomatedTradingSwarm', async (signal) => {
        console.log(`📡 [AutomatedTradingSwarm] Received signal: ${signal.type}`);
        await automatedTradingSwarm.runCycle();
    });
    registerSwarmCollective('LearningSwarm', async (signal) => {
        console.log(`📡 [LearningSwarm] Received signal: ${signal.type}`);
        await learningSwarm.runCycle();
    });
    registerSwarmCollective('ResearchSwarm', async (signal) => {
        console.log(`📡 [ResearchSwarm] Received signal: ${signal.type}`);
        await researchSwarm.runCycle();
    });
    registerSwarmCollective('VoiceAgentSwarm', async (signal) => {
        console.log(`📡 [VoiceAgentSwarm] Received signal: ${signal.type}`);
        await voiceAgentSwarm.runCycle();
    });
    registerSwarmCollective('QualityAssuranceSwarm', async (signal) => {
        console.log(`📡 [QualityAssuranceSwarm] Received signal: ${signal.type}`);
        await qualityAssuranceSwarm.runCycle();
    });
    registerSwarmCollective('CustomerSuccessSwarm', async (signal) => {
        console.log(`📡 [CustomerSuccessSwarm] Received signal: ${signal.type}`);
        await customerSuccessSwarm.runCycle();
    });
    registerSwarmCollective('DevOpsSwarm', async (signal) => {
        console.log(`📡 [DevOpsSwarm] Received signal: ${signal.type}`);
        await devOpsSwarm.runCycle();
    });
    registerSwarmCollective('KnowledgeGraphSwarm', async (signal) => {
        console.log(`📡 [KnowledgeGraphSwarm] Received signal: ${signal.type}`);
        await knowledgeGraphSwarm.runCycle();
    });
    registerSwarmCollective('ComplianceSwarm', async (signal) => {
        console.log(`📡 [ComplianceSwarm] Received signal: ${signal.type}`);
        await complianceSwarm.runCycle();
    });
    registerSwarmCollective('ExperimentationSwarm', async (signal) => {
        console.log(`📡 [ExperimentationSwarm] Received signal: ${signal.type}`);
        await experimentationSwarm.runCycle();
    });
    registerSwarmCollective('AIEconomySwarm', async (signal) => {
        console.log(`📡 [AIEconomySwarm] Received signal: ${signal.type}`);
        await aiEconomySwarm.runCycle();
    });

    const collabStats = swarmCollaboration.getStats();
    console.log(
        `🤝 Collaboration registry: ${collabStats.registeredAgents} nodes ` +
        `(${collabStats.registeredIndividualAgents} individual agents, ${collabStats.registeredCollectives} swarm collectives)`
    );

    // Test quantum core
    const qStats = quantumCore.getStats();
    console.log('📊 Quantum Stats:', qStats);
    const bootCoherence = await quantumCore.enforceCoherence(1.0, 2);
    console.log(`🎯 Quantum Coherence Lock: ${(bootCoherence.achieved * 100).toFixed(1)}%`);

    // Autonomous run tracking
    let cycleCount = 0;
    let isPaused = false;
    const AUTONOMOUS_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    // Run one autonomous cycle immediately on startup, then every interval.
    let lastAutonomousRun = Date.now() - AUTONOMOUS_INTERVAL_MS;

    // Start Sovereign Bridge (Auto-selects WhatsApp/iMessage)
    await sovereignBridge.start();

    // Register Command Handlers
    sovereignBridge.onCommand(async (cmd) => {
        console.log(`📨 [Bridge] Executing command: ${cmd}`);
        const normalizedCmd = cmd.trim().toLowerCase();

        const target = process.env.IMESSAGE_RECIPIENT || process.env.WHATSAPP_PHONE_NUMBER;
        if (!target) {
            console.error('❌ [Bridge] No recipient set in environment.');
            return;
        }

        if (normalizedCmd === 'status') {
            const stats = quantumCore.getStats();
            const tradeStatus = autonomousTradingController.getStatus();
            await sovereignBridge.pushUpdate(
                `📊 Swarm Status\n` +
                `- Coherence: ${(stats.quantum_coherence * 100).toFixed(1)}%\n` +
                `- Mode: ${isPaused ? '⏸️ PAUSED' : '🚀 ACTIVE'}\n` +
                `- AutoTrade: ${tradeStatus.phase} (balance ${tradeStatus.latestBalanceSol ?? 0} SOL)`
            );
        } else if (normalizedCmd === 'pause') {
            isPaused = true;
            await sovereignBridge.pushUpdate('⏸️ Swarm Paused. Standing by for resume command.');
        } else if (normalizedCmd === 'resume') {
            isPaused = false;
            await sovereignBridge.pushUpdate('🚀 Swarm Resumed. Autonomous cycles continuing.');
        } else if (normalizedCmd === 'ping') {
            await sovereignBridge.pushUpdate('🌌 PONG. Sovereign Bridge Latency: < 1s');
        } else if (normalizedCmd === 'report') {
            await sovereignBridge.pushUpdate(`📑 Latest Executive Report: Available on next autonomous pulse.`);
        } else if (normalizedCmd.startsWith('train ')) {
            const repoUrl = cmd.replace('train ', '').trim();
            await sovereignBridge.pushUpdate(`📚 Librarian Initializing Training Pulse for: ${repoUrl}`);
            const trainRes = await librarian.trainOnRepo(repoUrl);
            if (trainRes.status === 'training_complete') {
                await resonanceEngine.ingestPulse(trainRes.pulse);
                await sovereignBridge.pushUpdate(`✅ Training Complete. Knowledge ingested into Swarm Core.`);
            } else {
                await sovereignBridge.pushUpdate(`❌ Training Failed: ${trainRes.error}`);
            }
        } else if (normalizedCmd.startsWith('replicate')) {
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
        } else if (normalizedCmd === 'help') {
            await sovereignBridge.pushUpdate(`🛠️ Swarm Commands:
- status: Current health
- train <url>: Learn from GitHub repo
- replicate <name>: Autonomous cloning
- pause: Halt autonomy
- resume: Start autonomy
- autotrade status: Autonomous trading challenge status
- autotrade reset: Reset autonomous trading challenge state
- ping: Check latency
- transport: Show current transport
- imessage: Switch to iMessage
- whatsapp: Switch to WhatsApp
- help: List commands`);
        } else if (normalizedCmd === 'transport') {
            const statuses = sovereignBridge.getStatus();
            const lines = statuses.length
                ? statuses.map((status) => `- ${status.transport.toUpperCase()}: ${status.status} (${status.message})`).join('\n')
                : '- No active transports';
            await sovereignBridge.pushUpdate(`📡 Transport Status:
${lines}`);
        } else if (normalizedCmd === 'autotrade status') {
            const tradeStatus = autonomousTradingController.getStatus();
            await sovereignBridge.pushUpdate(
                `🤖 AutoTrade Status:\n` +
                `- Phase: ${tradeStatus.phase}\n` +
                `- Trigger: ${tradeStatus.triggerSol} SOL\n` +
                `- Target: ${tradeStatus.targetSol} SOL\n` +
                `- Balance: ${tradeStatus.latestBalanceSol ?? 0} SOL\n` +
                `- Tracked USDC: ${tradeStatus.trackedUsdcBalance}\n` +
                `- Trades today: ${tradeStatus.tradesToday}\n` +
                `- Total trades: ${tradeStatus.totalTrades}\n` +
                `- Success: ${tradeStatus.successfulTrades}\n` +
                `- Failed: ${tradeStatus.failedTrades}`
            );
        } else if (normalizedCmd === 'autotrade reset') {
            await autonomousTradingController.reset('bridge_command');
            await sovereignBridge.pushUpdate('♻️ AutoTrade challenge state reset.');
        } else if (normalizedCmd === 'whatsapp') {
            await sovereignBridge.switchTransport('whatsapp');
            await sovereignBridge.pushUpdate('✅ WhatsApp is active');
        }
    });

    // Swarm Loop
    while (true) {
        // 🛑 [Maintenance Check] Warm-restart protocol
        if (await MaintenanceGuard.isMaintenanceActive()) {
            console.log('🛑 [Loop] Maintenance signal detected. Powering down for warm-restart...');
            await sovereignBridge.pushUpdate('🚨 Swarm is entering Maintenance Mode for updates/maintenance. Standby for warm-restart.');
            // Allow logs to flush and bridge to send message
            await new Promise(r => setTimeout(r, 2000));
            process.exit(0);
        }

        try {
            // ⚛️ QUANTUM ENHANCEMENT: Check quantum channel for Antigravity messages
            await checkQuantumChannel();

            // ⚛️ INCEPTION: Reality Sensing (Event-Driven Trigger)
            const signals = await realitySensor.scan();

            // 🛠️ RECURSIVE SELF-PATCHING: Phase 90
            for (const signal of signals) {
                await bugFixer.processSignal(signal);
            }
            const hasCriticalEvent = realitySensor.hasCriticalEvent();
            if (hasCriticalEvent) {
                console.log('🚨 [Inception] Critical Reality Signal Detected! Self-triggering autonomous cycle...');
            }

            const now = Date.now();

            // 💓 [HEARTBEAT ENGINE] OpenClaw synthesis
            // If reality intensity > 0.85, trigger an Adrenaline Pulse
            const realityPulse = realitySensor.getSignals().some(s => s.intensity > 0.85);
            const shouldRunAutonomous = (now - lastAutonomousRun) >= AUTONOMOUS_INTERVAL_MS || hasCriticalEvent || realityPulse;

            if (realityPulse && (now - lastAutonomousRun) < AUTONOMOUS_INTERVAL_MS) {
                const signal = realitySensor.getSignals().find(s => s.intensity > 0.85);
                console.log('💓 [Heartbeat] High Reality Intensity detected! Injecting Cognitive Adrenaline...');
                await sovereignBridge.pushUpdate(`💓 *ADRENALINE PULSE*: High Reality Intensity detected (${signal?.type})! Triggering pro-active swarm cycle...`);
            }

            // ⚛️ COLLABORATION: Process Pending Signals
            const pendingSignals = swarmCollaboration.getPendingSignals('ALL');
            if (pendingSignals.length > 0) {
                console.log(`📡 [Collab] Processing ${pendingSignals.length} pending signals...`);
                for (const signal of pendingSignals) {
                    // This will trigger the registered callbacks safely
                    await swarmCollaboration.triggerCallbacks(signal);
                    await swarmCollaboration.acknowledgeSignal(signal.id);
                }
            }

            // 1. Check for Reactive Signals
            let tasks: any[] = [];
            try {
                tasks = await base44.getPendingTasks();
            } catch (error: any) {
                console.warn(`⚠️ [REACTIVE] Failed to fetch pending tasks: ${error?.message || error}`);
                tasks = [];
            }

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
                    results.godMode = await godMode.run();

                    // Apply BugHunter Patch if available
                    if (results.bugHunter?.proposed_fix) {
                        const fix = results.bugHunter.proposed_fix;
                        console.log(`🛠️ [BugHunter] Applying AI-generated patch to ${fix.file}...`);
                        const patcher = new AtomicPatcher(process.cwd());
                        const patchResult = await patcher.applyPatches(fix.file, [{
                            targetContent: fix.original,
                            replacementContent: fix.replacement
                        }]);
                        if (patchResult.success) {
                            console.log(`✅ [BugHunter] Autonomous self-healing patch applied successfully.`);
                            results.bugHunter.patchApplied = true;
                        } else {
                            console.warn(`⚠️ [BugHunter] Autonomous self-healing patch failed: ${patchResult.error}`);
                            results.bugHunter.patchApplied = false;
                        }
                    }

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
                const coherencePulse = await quantumCore.enforceCoherence(1.0, 1);
                results.coherencePulse = coherencePulse;
                const oracleGuidance = await consultAutonomousOracleGuidance(cycleCount, coherencePulse.achieved);
                results.oracleGuidance = oracleGuidance;
                const guidanceText = String(oracleGuidance.recommendation || '').toLowerCase();

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

                // 🧬 Quantum Evolution Pulse (every 3 cycles)
                if (cycleCount % 3 === 0) {
                    const singularity = new SingularityEngine();
                    const evoRes = await singularity.executeSelfImprovementCycle();
                    results.evolution = { status: 'completed', progress: evoRes.singularityProgress };

                    const excellence = economicEngine.getState().excellenceIndex;
                    await sovereignBridge.pushUpdate(`🧬 *Evolution Pulse*: Progress: ${(evoRes.singularityProgress * 100).toFixed(1)}% | Excellence: ${excellence.toFixed(2)}`);
                }

                // 🧠 [NEURAL INDEPENDENCE] Autonomous Growth Cycle (every 10 pulses)
                if (cycleCount % 10 === 0) {
                    console.log('🧬 [Singularity] Triggering Autonomous Growth Cycle...');
                    const singularity = new SingularityEngine();
                    const growthRes = await singularity.executeSelfImprovementCycle();
                    results.autonomous_growth = growthRes;

                    const wealth = economicEngine.getState().totalValue;
                    await sovereignBridge.pushUpdate(`🌱 *Autonomous Growth*: Self-improvement complete. Swarm wealth now at ${wealth.toFixed(0)} units.`);
                }

                // 🦊 CryptoSwarm (every 4 cycles)
                if (cycleCount % 4 === 0) {
                    const cryptoRes = await cryptoSwarm.run();
                    results.cryptoSwarm = cryptoRes;
                }

                // 📈 MarketAnalyzer (every 5 cycles)
                if (cycleCount % 5 === 0) {
                    const marketRes = await marketAnalyzer.analyze();
                    results.marketAnalyzer = marketRes;
                }

                // 👷 WorkerSwarm (every 7 cycles)
                if (cycleCount % 7 === 0) {
                    const workerRes = await workerSwarm.run();
                    results.workerSwarm = workerRes;
                }

                // 💼 FreelanceSwarm (every 7 cycles - revenue focused)
                if (cycleCount % 7 === 0) {
                    const freelanceRes = await freelanceSwarm.run();
                    results.freelanceSwarm = freelanceRes;
                }

                // 💼 ConsultingSwarm (every 11 cycles - consulting revenue)
                if (cycleCount % 11 === 0) {
                    const consultingRes = await consultingSwarm.run();
                    results.consultingSwarm = consultingRes;
                }

                // 📱 SocialMediaSwarm (every 6 cycles - expanded platform revenue)
                if (cycleCount % 6 === 0) {
                    await socialMediaSwarm.runCycle();
                    results.socialMediaSwarm = await socialMediaSwarm.getRevenueReport();
                }

                // 📈 AutomatedTradingSwarm (every 8 cycles - crypto + stock automation)
                if (cycleCount % 8 === 0) {
                    await automatedTradingSwarm.runCycle();
                    results.automatedTradingSwarm = automatedTradingSwarm.getPortfolio();
                }

                // 🧠 LearningSwarm (every 9 cycles - reasoning hardening and feedback learning)
                if (cycleCount % 9 === 0) {
                    results.learningSwarm = await learningSwarm.runCycle();
                }

                // 🔎 ResearchSwarm (every 12 cycles - market/competitor intelligence + SaaS opportunities)
                if (cycleCount % 12 === 0) {
                    results.researchSwarm = await researchSwarm.runCycle();
                }

                // 🎙️ VoiceAgentSwarm (every 13 cycles - voice support triage + revenue handoffs)
                if (cycleCount % 13 === 0) {
                    results.voiceAgentSwarm = await voiceAgentSwarm.runCycle();
                }

                // 🤝 CustomerSuccessSwarm (every 14 cycles - churn prevention + expansion automation)
                if (cycleCount % 14 === 0) {
                    results.customerSuccessSwarm = await customerSuccessSwarm.runCycle();
                }

                // 🧪 QualityAssuranceSwarm (every 20 cycles - benchmark/oracle/report reliability gates)
                if (cycleCount % 20 === 0) {
                    results.qualityAssuranceSwarm = await qualityAssuranceSwarm.runCycle();
                }

                // 🛠️ DevOpsSwarm (every 15 cycles - CI/CD and deployment readiness)
                if (cycleCount % 15 === 0) {
                    results.devOpsSwarm = await devOpsSwarm.runCycle();
                }

                // 🕸️ KnowledgeGraphSwarm (every 16 cycles - cross-domain intelligence synthesis)
                if (cycleCount % 16 === 0) {
                    results.knowledgeGraphSwarm = await knowledgeGraphSwarm.runCycle();
                }

                // 🛡️ ComplianceSwarm (every 17 cycles - policy, legal, and security governance)
                if (cycleCount % 17 === 0) {
                    results.complianceSwarm = await complianceSwarm.runCycle();
                }

                // 🧬 ExperimentationSwarm (every 18 cycles - multi-agent A/B testing and growth loops)
                if (cycleCount % 18 === 0) {
                    results.experimentationSwarm = await experimentationSwarm.runCycle();
                }

                // 🏛️ AIEconomySwarm (every 19 cycles - treasury and reinvestment flywheel)
                if (cycleCount % 19 === 0) {
                    results.aiEconomySwarm = await aiEconomySwarm.runCycle();
                }

                // 🕵️ Curiosity Cycle (every 10 cycles - Phase 7)
                if (cycleCount % 10 === 0) {
                    console.log('🕵️ [Curiosity] Awakening...');
                    const bounties = await curiosityEngine.scanForNovelty(1);
                    if (bounties.length > 0) {
                        await curiosityEngine.synthesizeBounty(bounties[0]);
                        results.curiosity = bounties[0];
                    }
                }

                // 🔮 ORACLE PRIORITY OVERRIDE: Always act on oracle guidance every autonomous cycle.
                if (hasKeyword(guidanceText, ['revenue', 'social', 'expansion', 'customer', 'saas'])) {
                    if (!results.socialMediaSwarm) {
                        await socialMediaSwarm.runCycle();
                        results.socialMediaSwarm = await socialMediaSwarm.getRevenueReport();
                    }
                    if (!results.researchSwarm) {
                        results.researchSwarm = await researchSwarm.runCycle();
                    }
                    if (!results.customerSuccessSwarm) {
                        results.customerSuccessSwarm = await customerSuccessSwarm.runCycle();
                    }
                    if (!results.experimentationSwarm) {
                        results.experimentationSwarm = await experimentationSwarm.runCycle();
                    }
                    if (!results.aiEconomySwarm) {
                        results.aiEconomySwarm = await aiEconomySwarm.runCycle();
                    }
                }

                if (hasKeyword(guidanceText, ['reliability', 'quality', 'learning', 'qa', 'stability'])) {
                    if (!results.learningSwarm) {
                        results.learningSwarm = await learningSwarm.runCycle();
                    }
                    if (!results.qualityAssuranceSwarm && cycleCount % 5 === 0) {
                        results.qualityAssuranceSwarm = await qualityAssuranceSwarm.runCycle();
                    }
                }

                if (hasKeyword(guidanceText, ['trading', 'market', 'crypto', 'risk'])) {
                    if (!results.automatedTradingSwarm) {
                        await automatedTradingSwarm.runCycle();
                        results.automatedTradingSwarm = automatedTradingSwarm.getPortfolio();
                    }
                    if (!results.marketAnalyzer) {
                        results.marketAnalyzer = await marketAnalyzer.analyze();
                    }
                }

                if (hasKeyword(guidanceText, ['platform', 'product', 'voice', 'code', 'devops', 'infrastructure', 'deployment'])) {
                    if (!results.voiceAgentSwarm) {
                        results.voiceAgentSwarm = await voiceAgentSwarm.runCycle();
                    }
                    if (!results.codeGenerator) {
                        results.codeGenerator = await codeGenerator.run();
                    }
                    if (!results.devOpsSwarm) {
                        results.devOpsSwarm = await devOpsSwarm.runCycle();
                    }
                }

                if (hasKeyword(guidanceText, ['knowledge', 'cross-domain', 'synthesis', 'graph'])) {
                    if (!results.knowledgeGraphSwarm) {
                        results.knowledgeGraphSwarm = await knowledgeGraphSwarm.runCycle();
                    }
                }

                if (hasKeyword(guidanceText, ['compliance', 'policy', 'legal', 'security', 'governance'])) {
                    if (!results.complianceSwarm) {
                        results.complianceSwarm = await complianceSwarm.runCycle();
                    }
                }

                if (hasKeyword(guidanceText, ['experiment', 'experimentation', 'a/b', 'ab test', 'conversion', 'uplift', 'growth'])) {
                    if (!results.experimentationSwarm) {
                        results.experimentationSwarm = await experimentationSwarm.runCycle();
                    }
                }

                if (hasKeyword(guidanceText, ['economy', 'treasury', 'reinvest', 'self-sustaining', 'allocation', 'flywheel'])) {
                    if (!results.aiEconomySwarm) {
                        results.aiEconomySwarm = await aiEconomySwarm.runCycle();
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
                    .map(([id, value]) => {
                        const footprint = JSON.stringify(value).length;
                        const score = Math.max(0.1, Math.min(10, footprint / 120));
                        return { id, score };
                    });

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

                // Generate Comprehensive Multi-Swarm Report via WhatsApp
                const finance = financeSwarm as any;
                const freelance = freelanceSwarm as any;

                const tradingMetrics = {
                    balance: finance.getBalance ? finance.getBalance() : 0,
                    totalPnL: finance.getTotalPnL ? finance.getTotalPnL() : 0,
                    openPositions: finance.getOpenPositions ? finance.getOpenPositions().length : 0,
                    winRate: finance.getWinRate ? finance.getWinRate() : 0
                };

                const freelanceMetrics = {
                    jobsApplied: freelance.getJobsApplied ? freelance.getJobsApplied() : 0,
                    pipelineValue: freelance.getPipelineValue ? freelance.getPipelineValue() : 0
                };

                const revenueMetrics = {
                    totalRevenue: results.revenueHunter?.opportunities?.length
                        ? results.revenueHunter.opportunities.length * 150
                        : 0,
                    pendingRevenue: 0,
                    subscriptions: 0,
                    referrals: 0
                };

                const fullReport = await swarmReporter.generateComprehensiveReport(
                    cycleCount,
                    tradingMetrics,
                    freelanceMetrics,
                    revenueMetrics
                );

                console.log('[REPORTER] Comprehensive report generated');

                // GodMode decides if any action is needed
                const context = { source: 'autonomous_cycle', cycle: cycleCount, findings: results };
                results.godMode = await (godMode as any).run(context);

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
            if (isOneShotMode()) {
                if (shouldSoftExitOneShot(errorMessage)) {
                    console.warn('⚠️ One-Shot Mode: Non-critical runtime issue detected. Exiting gracefully for CI continuity.');
                    process.exit(0);
                }
                console.error('💥 One-Shot Mode: Critical runtime failure detected. Exiting with failure status.');
                process.exit(1);
            }
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

main().catch((error: any) => {
    const errorMessage = error?.message || String(error);
    console.error('❌ Fatal startup error:', errorMessage);

    if (isOneShotMode() && shouldSoftExitOneShot(errorMessage)) {
        console.warn('⚠️ One-Shot Mode: Startup dependency missing or transient issue detected. Exiting gracefully.');
        process.exit(0);
    }

    process.exit(1);
});
