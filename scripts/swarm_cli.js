#!/usr/bin/env node
/**
 * Swarm CLI - Token-Free Swarm Collaboration Interface
 * 
 * Interact with the swarm without using LLM tokens.
 * Uses direct agent communication via signals.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { swarmCollaboration } from '../swarm/core/swarm_collaboration.js';
import quantumCore from '../swarm/core/quantum_core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function printBanner() {
    console.log(`
${COLORS.cyan}╔════════════════════════════════════════════════════════════╗
║                    🐝 SWARM CLI v1.0 🐝                     ║
║          Token-Free Agent Collaboration System              ║
${COLORS.reset}${COLORS.yellow}╚════════════════════════════════════════════════════════════╝
${COLORS.reset}
Available Commands:
  ${COLORS.green}status${COLORS.reset}          - Show swarm status
  ${COLORS.green}list${COLORS.reset}            - List all agents
  ${COLORS.green}signals${COLORS.reset}         - Show pending signals
  ${COLORS.green}send <to> <msg>${COLORS.reset} - Send signal to agent
  ${COLORS.green}broadcast <msg>${COLORS.reset} - Broadcast to all agents
  ${COLORS.green}query <agent> <q>${COLORS.reset} - Query an agent
  ${COLORS.green}states${COLORS.reset}           - List saved quantum states
  ${COLORS.green}save <name>${COLORS.reset}     - Save current state
  ${COLORS.green}load <name>${COLORS.reset}     - Load a saved state
  ${COLORS.green}alert <msg>${COLORS.reset}     - Send critical alert
  ${COLORS.green}clear${COLORS.reset}           - Clear old signals
  ${COLORS.green}stats${COLORS.reset}           - Show collaboration stats
  ${COLORS.green}help${COLORS.reset}            - Show this help
  ${COLORS.green}exit${COLORS.reset}            - Exit
`);
}

const AGENTS = [
    'Sentinel',
    'BugHunter',
    'Optimizer',
    'ProductOwner',
    'GodMode',
    'Antigravity',
    'Librarian',
    'RevenueHunter',
    'CryptoSwarm',
    'MarketAnalyzer',
    'WorkerSwarm',
    'FreelanceSwarm',
    'ConsultingSwarm'
];

// Register a callback for receiving signals
swarmCollaboration.registerAgent('CLI', async (signal) => {
    console.log(`\n${COLORS.magenta}📨 Signal received:${COLORS.reset}`);
    console.log(`   From: ${signal.fromAgent}`);
    console.log(`   Type: ${signal.type}`);
    console.log(`   Payload: ${JSON.stringify(signal.payload, null, 2)}`);
    console.log(`   Time: ${signal.timestamp}`);
});

async function handleCommand(args) {
    const [cmd, ...rest] = args;
    const quantum = quantumCore;

    switch (cmd) {
        case 'status':
            const qStats = quantumCore.getStats();
            console.log(`\n${COLORS.blue}📊 Quantum Core Status:${COLORS.reset}`);
            console.log(`   Coherence: ${(qStats.quantum_coherence * 100).toFixed(1)}%`);
            console.log(`   Engine Version: ${qStats.engineVersion}`);
            console.log(`   Integrity: ${qStats.swarm_integrity}`);
            console.log(`   Holographic Recall: ${qStats.holographic_recall}`);
            break;

        case 'list':
            console.log(`\n${COLORS.blue}🤖 Available Agents:${COLORS.reset}`);
            AGENTS.forEach((agent, i) => {
                console.log(`   ${i + 1}. ${agent}`);
            });
            break;

        case 'signals':
            const signals = swarmCollaboration.getAllSignals();
            console.log(`\n${COLORS.blue}📡 Swarm Signals:${COLORS.reset}`);
            if (signals.length === 0) {
                console.log('   No signals found.');
            } else {
                signals.forEach(s => {
                    const color = s.status === 'PENDING' ? COLORS.yellow : COLORS.green;
                    console.log(`   [${COLORS.reset}${color}${s.status}${COLORS.reset}] ${s.fromAgent} → ${s.toAgent} (${s.type})`);
                });
            }
            break;

        case 'send':
            const [to, ...msgParts] = rest;
            const message = msgParts.join(' ');
            if (!to || !message) {
                console.log(`${COLORS.red}Usage: send <agent> <message>${COLORS.reset}`);
                return;
            }
            await swarmCollaboration.sendSignal({
                fromAgent: 'CLI',
                toAgent: to,
                type: 'TASK',
                payload: { message },
                priority: 'MEDIUM'
            });
            console.log(`${COLORS.green}✅ Signal sent to ${to}${COLORS.reset}`);
            break;

        case 'broadcast':
            const broadcastMsg = rest.join(' ');
            if (!broadcastMsg) {
                console.log(`${COLORS.red}Usage: broadcast <message>${COLORS.reset}`);
                return;
            }
            await swarmCollaboration.sendSignal({
                fromAgent: 'CLI',
                toAgent: 'ALL',
                type: 'TASK',
                payload: { message: broadcastMsg },
                priority: 'MEDIUM'
            });
            console.log(`${COLORS.green}✅ Broadcast sent to all agents${COLORS.reset}`);
            break;

        case 'query':
            const [agent, ...questionParts] = rest;
            const question = questionParts.join(' ');
            if (!agent || !question) {
                console.log(`${COLORS.red}Usage: query <agent> <question>${COLORS.reset}`);
                return;
            }
            const result = await swarmCollaboration.queryAgent('CLI', agent, question);
            console.log(`${COLORS.green}✅ Query sent: ${JSON.stringify(result, null, 2)}${COLORS.reset}`);
            break;

        case 'states':
            const states = quantum.getSavedStates();
            console.log(`\n${COLORS.blue}💾 Saved Quantum States:${COLORS.reset}`);
            if (states.length === 0) {
                console.log('   No saved states.');
            } else {
                states.forEach(s => console.log(`   - ${s}`));
            }
            break;

        case 'save':
            const saveName = rest.join(' ');
            if (!saveName) {
                console.log(`${COLORS.red}Usage: save <name>${COLORS.reset}`);
                return;
            }
            await quantum.saveState(saveName, {
                timestamp: Date.now(),
                coherence: quantum.getStats().quantum_coherence,
                agents: AGENTS
            });
            console.log(`${COLORS.green}✅ State saved: ${saveName}${COLORS.reset}`);
            break;

        case 'load':
            const loadName = rest.join(' ');
            if (!loadName) {
                console.log(`${COLORS.red}Usage: load <name>${COLORS.reset}`);
                return;
            }
            const loaded = await quantum.loadState(loadName);
            if (loaded) {
                console.log(`${COLORS.green}✅ State loaded: ${loadName}${COLORS.reset}`);
            } else {
                console.log(`${COLORS.red}❌ State not found: ${loadName}${COLORS.reset}`);
            }
            break;

        case 'alert':
            const alertMsg = rest.join(' ');
            if (!alertMsg) {
                console.log(`${COLORS.red}Usage: alert <message>${COLORS.reset}`);
                return;
            }
            await swarmCollaboration.sendAlert('CLI', alertMsg, 'HIGH');
            console.log(`${COLORS.red}🚨 Alert broadcast to all agents${COLORS.reset}`);
            break;

        case 'clear':
            const cleared = await swarmCollaboration.clearOldSignals();
            console.log(`${COLORS.green}✅ Cleared ${cleared} old signals${COLORS.reset}`);
            break;

        case 'stats':
            const collabStats = swarmCollaboration.getStats();
            console.log(`\n${COLORS.blue}📊 Collaboration Stats:${COLORS.reset}`);
            console.log(`   Total Signals: ${collabStats.totalSignals}`);
            console.log(`   Pending: ${collabStats.pendingSignals}`);
            console.log(`   Registered Agents: ${collabStats.registeredAgents}`);
            console.log(`   Agent Names: ${collabStats.agentNames.join(', ')}`);
            break;

        case 'help':
            printBanner();
            break;

        case 'exit':
            console.log(`${COLORS.cyan}👋 Goodbye!${COLORS.reset}`);
            process.exit(0);

        default:
            console.log(`${COLORS.red}Unknown command: ${cmd}${COLORS.reset}`);
            console.log(`Type 'help' for available commands.`);
    }
}

// Interactive mode
async function main() {
    printBanner();

    const args = process.argv.slice(2);
    if (args.length > 0) {
        // Command line mode
        await handleCommand(args);
    } else {
        // Interactive mode
        console.log(`${COLORS.yellow}Entering interactive mode... (type 'help' for commands, 'exit' to quit)${COLORS.reset}\n`);

        const readline = (await import('readline')).createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const ask = () => {
            readline.question(`${COLORS.cyan}swarm> ${COLORS.reset}`, async (input) => {
                const trimmed = input.trim();
                if (!trimmed) {
                    ask();
                    return;
                }

                const parts = trimmed.split(' ');
                const cmd = parts[0].toLowerCase();

                if (cmd === 'exit') {
                    readline.close();
                    process.exit(0);
                }

                await handleCommand(parts);
                ask();
            });
        };

        ask();
    }
}

main().catch(console.error);
