/**
 * WhatsApp Command Handlers for Swarm Control
 * 
 * Enables remote control of the swarm via WhatsApp commands.
 * Commands: /directive, /objective, /status, /agents, /restart, etc.
 */

import { whatsappBridge } from './whatsapp_bridge.js';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Command definitions
interface SwarmCommand {
    name: string;
    description: string;
    handler: (args: string, sender: string) => Promise<string>;
}

const commands: Map<string, SwarmCommand> = new Map();

// Status command
commands.set('status', {
    name: 'status',
    description: 'Get swarm status',
    async handler(args, sender) {
        const stats = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            agents: ['Sentinel', 'BugHunter', 'Optimizer', 'ProductOwner', 'GodMode', 'Antigravity'],
            status: 'OPERATIONAL'
        };
        return `🌌 **SWARM STATUS**\n\n` +
            `✅ Status: ${stats.status}\n` +
            `⏱️ Uptime: ${Math.floor(stats.uptime / 60)}m ${Math.floor(stats.uptime % 60)}s\n` +
            `🧠 Memory: ${Math.round(stats.memory.heapUsed / 1024 / 1024)}MB\n` +
            `👥 Agents: ${stats.agents.join(', ')}`;
    }
});

// Agents command
commands.set('agents', {
    name: 'agents',
    description: 'List all agents and their status',
    async handler(args, sender) {
        return `👥 **SWARM AGENTS**\n\n` +
            `🛡️ **Sentinel** - Security scanning\n` +
            `🐞 **BugHunter** - Bug detection\n` +
            `⚡ **Optimizer** - Performance tuning\n` +
            `👔 **ProductOwner** - Vision & strategy\n` +
            `🌌 **GodMode** - Full system control\n` +
            `🌀 **Antigravity** - LLM & quantum processing`;
    }
});

// Directive command - set a directive for the swarm
commands.set('directive', {
    name: 'directive',
    description: 'Set a swarm directive',
    async handler(args, sender) {
        if (!args) return '❌ Please provide a directive. Usage: /directive <objective>';

        const directivePath = path.join(__dirname, '..', 'swarm_directive.txt');
        fs.writeFileSync(directivePath, `[DIRECTIVE from ${sender}]\n${args}\nTimestamp: ${new Date().toISOString()}`);

        return `🎯 **DIRECTIVE SET**\n\n${args}\n\n✅ Directive saved to swarm_directive.txt`;
    }
});

// Objective command - set a specific objective
commands.set('objective', {
    name: 'objective',
    description: 'Set a priority objective',
    async handler(args, sender) {
        if (!args) return '❌ Please provide an objective. Usage: /objective <task>';

        const objectivePath = path.join(__dirname, '..', 'swarm_objectives.json');
        let objectives: { list: Array<{ objective: string, from: string, timestamp: string, status: string }>, timestamp: string } = { list: [], timestamp: new Date().toISOString() };

        if (fs.existsSync(objectivePath)) {
            try {
                objectives = JSON.parse(fs.readFileSync(objectivePath, 'utf8'));
            } catch (e) { }
        }

        objectives.list.push({
            objective: args,
            from: sender,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });

        fs.writeFileSync(objectivePath, JSON.stringify(objectives, null, 2));

        return `🎯 **OBJECTIVE ADDED**\n\n${args}\n\n📋 Total objectives: ${objectives.list.length}`;
    }
});

// Restart command
commands.set('restart', {
    name: 'restart',
    description: 'Restart the swarm',
    async handler(args, sender) {
        // Trigger restart via PM2
        const { execSync } = require('child_process');
        try {
            execSync('npx pm2 restart appforge-swarm', { stdio: 'inherit' });
            return '🔄 **SWARM RESTARTING**\n\nThe swarm is being restarted...';
        } catch (e) {
            return '❌ Failed to restart swarm. Please restart manually.';
        }
    }
});

// Help command
commands.set('help', {
    name: 'help',
    description: 'Show available commands',
    async handler(args, sender) {
        return `🤖 **SWARM COMMANDS**\n\n` +
            `/status - Get swarm status\n` +
            `/agents - List all agents\n` +
            `/directive <text> - Set a directive\n` +
            `/objective <task> - Add an objective\n` +
            `/restart - Restart the swarm\n` +
            `/help - Show this message\n\n` +
            `You can also use "sovereign <command>" as a natural language interface.`;
    }
});

// Memory command
commands.set('memory', {
    name: 'memory',
    description: 'View swarm memory',
    async handler(args, sender) {
        const memoryPath = path.join(__dirname, '..', 'swarm_memory.json');
        if (fs.existsSync(memoryPath)) {
            const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
            return `🧠 **SWARM MEMORY**\n\nItems: ${memory.length || 0}\n\n` +
                `Use /memory clear to reset`;
        }
        return '🧠 **SWARM MEMORY**\n\nNo memory items yet.';
    }
});

// Initialize command handlers
export function initializeWhatsAppCommands() {
    whatsappBridge.onCommand(async (cmd: string) => {
        const parts = cmd.split(' ');
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        // Get sender from bridge or use default
        const sender = whatsappBridge.getPhoneNumber() || 'unknown';

        console.log(`📱 [WhatsApp] Processing command: ${cmd}`);

        if (commands.has(commandName)) {
            const command = commands.get(commandName)!;
            const response = await command.handler(args, sender);

            // Send response back
            await whatsappBridge.pushUpdate(response);
            console.log(`📱 [WhatsApp] Response sent: ${response.substring(0, 50)}...`);
        } else {
            // Try natural language processing
            const response = await processNaturalLanguage(cmd, sender);
            await whatsappBridge.pushUpdate(response);
        }
    });

    console.log('✅ WhatsApp commands initialized');
}

// Natural language processing for sovereign commands
async function processNaturalLanguage(input: string, sender: string): Promise<string> {
    const lower = input.toLowerCase();

    if (lower.includes('status') || lower.includes('how are you')) {
        return commands.get('status')!.handler('', sender);
    }

    if (lower.includes('what can you do') || lower.includes('help')) {
        return commands.get('help')!.handler('', sender);
    }

    if (lower.includes('agents') || lower.includes('who are you')) {
        return commands.get('agents')!.handler('', sender);
    }

    // Default response
    return `🌌 **COMMAND RECEIVED**\n\n"${input}"\n\nUse /help to see available commands.`;
}

export { commands };
