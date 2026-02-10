
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WhatsAppBridge {
    private phoneNumber: string;
    private lastProcessedTimestamp: number = 0;

    constructor() {
        this.phoneNumber = process.env.WHATSAPP_PHONE_NUMBER || '';
        // Initialize with current time to avoid processing old messages
        this.lastProcessedTimestamp = Date.now();
    }

    /**
     * Send a notification to the user's phone via OpenClaw
     */
    async pushUpdate(message: string) {
        if (!this.phoneNumber) {
            console.warn('⚠️ [WhatsApp] No phone number configured. Skipping notification.');
            return;
        }

        console.log(`📡 [WhatsApp] Pushing Update to ${this.phoneNumber}...`);

        try {
            // Using npx openclaw message send
            // --target +PhoneNumber --message "Message" --channel whatsapp
            const cmd = `npx openclaw message send --target "${this.phoneNumber}" --message "${message}" --channel whatsapp`;
            execSync(cmd, { encoding: 'utf-8', cwd: path.resolve(__dirname, '../../') });
            console.log('   ✅ WhatsApp Notification Sent.');
        } catch (e: any) {
            console.error(`   ❌ WhatsApp Send Failed: ${e.message}`);
        }
    }

    /**
     * Polls OpenClaw logs for new inbound messages from the target JID.
     * Commands are expected to be prefixed with '!' or just keyword-based.
     */
    async pollCommands(): Promise<string[]> {
        if (!this.phoneNumber) return [];

        const commands: string[] = [];
        const today = new Date().toISOString().split('T')[0];
        const logPath = `C:/tmp/openclaw/openclaw-${today}.log`;

        try {
            const fs = await import('fs');
            if (!fs.existsSync(logPath)) return [];

            const content = fs.readFileSync(logPath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    // OpenClaw Log format for inbound:
                    // data["1"] contains { from, to, body, timestamp }
                    // data["2"] matches "inbound message"

                    if (data["2"] === "inbound message") {
                        const msg = data["1"];
                        const timestamp = msg.timestamp || 0;

                        // msg.timestamp is sometimes in seconds, sometimes ms.
                        const msgTsMs = timestamp > 2000000000 ? timestamp : timestamp * 1000;

                        if (msgTsMs > this.lastProcessedTimestamp && msg.from === this.phoneNumber) {
                            const body = msg.body?.trim();
                            if (body) {
                                // 1. Check for command prefixes/tasking
                                if (body.startsWith('/') || body.startsWith('!')) {
                                    const fullCmd = body.substring(1).trim();
                                    const parts = fullCmd.split(' ');
                                    const baseCmd = parts[0].toLowerCase();

                                    if (['status', 'report', 'pause', 'resume', 'ping', 'help'].includes(baseCmd)) {
                                        commands.push(baseCmd);
                                    } else if (baseCmd === 'train' && parts.length > 1) {
                                        commands.push(`train ${parts.slice(1).join(' ')}`);
                                    } else if (baseCmd === 'task' && parts.length > 1) {
                                        commands.push(`task ${parts.slice(1).join(' ')}`);
                                    }
                                }
                                // 2. Check for keywords
                                else if (['status', 'report', 'pause', 'resume', 'ping', 'help'].includes(body.toLowerCase())) {
                                    commands.push(body.toLowerCase());
                                }
                                // 3. Detect GitHub URL (Auto-Training)
                                else if (body.includes('github.com/') && (body.startsWith('http') || body.includes('git@'))) {
                                    commands.push(`train ${body}`);
                                }
                            }
                            this.lastProcessedTimestamp = Math.max(this.lastProcessedTimestamp, msgTsMs);
                        }
                    }
                } catch (e) {
                    // Skip malformed lines
                }
            }
        } catch (e) {
            console.error(`⚠️ [WhatsAppBridge] Failed to poll logs: ${e}`);
        }

        return commands;
    }
}

export const whatsappBridge = new WhatsAppBridge();
