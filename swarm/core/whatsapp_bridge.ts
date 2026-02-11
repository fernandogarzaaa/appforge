import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    proto
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUANTUM_CHANNEL_PATH = path.join(__dirname, '..', '..', 'swarm', 'quantum_channel.json');

export class WhatsAppBridge {
    private phoneNumber: string;
    private lastProcessedTimestamp: number;
    private sock: any = null;
    private isConnected: boolean = false;
    private commandHandlers: ((cmd: string) => Promise<void>)[] = [];

    constructor() {
        this.phoneNumber = process.env.WHATSAPP_PHONE_NUMBER || '';
        this.lastProcessedTimestamp = Date.now();
    }

    getPhoneNumber(): string {
        return this.phoneNumber;
    }

    /**
     * Get JID format for WhatsApp
     */
    private getJID(phone: string): string {
        // Remove any existing JID suffix
        const cleanPhone = phone.replace(/@s\.whatsapp\.net|@g\.us$/, '');
        // Remove non-digits
        const digits = cleanPhone.replace(/\D/g, '');
        return `${digits}@s.whatsapp.net`;
    }

    /**
     * Set a command handler to be called when a command is received
     */
    onCommand(handler: (cmd: string) => Promise<void>) {
        this.commandHandlers.push(handler);
    }

    /**
     * Process quantum channel for outbound messages
     */
    private async processQuantumChannel(): Promise<void> {
        try {
            if (!fs.existsSync(QUANTUM_CHANNEL_PATH)) return;

            const content = fs.readFileSync(QUANTUM_CHANNEL_PATH, 'utf8');
            const channel = JSON.parse(content);

            const outbound = channel.outbound || [];
            if (outbound.length === 0) return;

            // Skip if already processing recently
            const now = Date.now();
            if (now - this.lastProcessedTimestamp < 5000) return;
            this.lastProcessedTimestamp = now;

            console.log(`📤 [WhatsApp] Processing ${outbound.length} outbound messages from quantum channel...`);

            let messagesSent = 0;
            for (const msg of outbound) {
                if (msg.status === 'pending' && msg.type === 'whatsapp_push') {
                    const target = msg.to || this.phoneNumber;
                    const targetJID = this.getJID(target);

                    console.log(`📱 [WhatsApp] Sending to ${targetJID}: "${msg.message.substring(0, 30)}..."`);

                    try {
                        await this.sock.sendMessage(targetJID, { text: msg.message });
                        console.log(`✅ [WhatsApp] Message delivered to ${targetJID}`);
                        msg.status = 'sent';
                        msg.sentAt = new Date().toISOString();
                        messagesSent++;
                    } catch (e: any) {
                        console.error(`❌ [WhatsApp] Failed to send: ${e.message}`);
                        msg.status = 'failed';
                        msg.error = e.message;
                    }
                }
            }

            if (messagesSent > 0) {
                // Update channel
                channel.lastUpdated = new Date().toISOString();
                fs.writeFileSync(QUANTUM_CHANNEL_PATH, JSON.stringify(channel, null, 2));
            }

        } catch (e: any) {
            // Silent fail for channel processing
        }
    }

    /**
     * Initialize the direct WhatsApp connection
     */
    async start() {
        console.log('⚡ [WhatsApp] Initializing Direct Sovereign Bridge (Reusing OpenClaw Session)...');

        const openClawAuthPath = 'C:\\Users\\ferna\\.openclaw\\credentials\\whatsapp\\default';
        const { state, saveCreds } = await useMultiFileAuthState(openClawAuthPath);
        const { version, isLatest } = await fetchLatestBaileysVersion();

        console.log(`📡 [WhatsApp] Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

        this.sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            logger: pino({ level: 'silent' }),
            browser: ["Sovereign Swarm", "Chrome", "1.0.0"]
        });

        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('connection.update', async (update: any) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('📟 [WhatsApp] Scan the QR code in the terminal or open the generated whatsapp_qr.png');
                const qrPath = path.join(process.cwd(), 'whatsapp_qr.png');
                try {
                    await QRCode.toFile(qrPath, qr);
                    console.log(`🖼️ [WhatsApp] QR Code Image saved to: ${qrPath}`);
                } catch (err) {
                    console.error('❌ [WhatsApp] Failed to save QR image:', err);
                }
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('📡 [WhatsApp] Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                if (shouldReconnect) this.start();
                this.isConnected = false;
            } else if (connection === 'open') {
                console.log('✅ [WhatsApp] Direct Sovereign Bridge ONLINE.');
                this.isConnected = true;
            }
        });

        this.sock.ev.on('messages.upsert', async (m: any) => {
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
                if (!msg.message || msg.key.fromMe) continue;

                const remoteJid = msg.key.remoteJid;
                const body = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    '';

                if (!body) continue;

                // Check if the message is from the authorized phone number/group
                if (remoteJid === this.phoneNumber || msg.key.participant === this.phoneNumber) {
                    console.log(`📱 [WhatsApp] Inbound from ${remoteJid}: "${body}"`);

                    const lowerBody = body.toLowerCase();
                    const isSovereign = lowerBody.includes('sovereign');

                    if (body.startsWith('/') || body.startsWith('!') || isSovereign) {
                        let cleanCmd = body;
                        if (isSovereign) {
                            cleanCmd = lowerBody.split('sovereign')[1].trim();
                        } else {
                            cleanCmd = body.substring(1).trim();
                        }

                        console.log(`⚖️ [WhatsApp] Command Detected: ${cleanCmd}`);
                        for (const handler of this.commandHandlers) {
                            await handler(cleanCmd);
                        }
                    }
                }
            }
        });

        // Start quantum channel polling
        this.startQuantumPolling();
    }

    /**
     * Start polling quantum channel for outbound messages
     */
    private startQuantumPolling() {
        setInterval(async () => {
            if (this.isConnected && this.sock) {
                await this.processQuantumChannel();
            }
        }, 3000); // Poll every 3 seconds
    }

    /**
     * Send a notification to the user's phone directly
     */
    async pushUpdate(message: string) {
        if (!this.isConnected || !this.sock) {
            console.warn('⚠️ [WhatsApp] Bridge not connected. Notification queued locally (placeholder).');
            return;
        }

        if (!this.phoneNumber) {
            console.warn('⚠️ [WhatsApp] No phone number configured.');
            return;
        }

        const targetJID = this.getJID(this.phoneNumber);
        console.log(`📡 [WhatsApp] Pushing Direct Update to ${targetJID}...`);

        try {
            await this.sock.sendMessage(targetJID, { text: message });
            console.log('   ✅ WhatsApp Notification Delivered.');
        } catch (e: any) {
            console.error(`   ❌ WhatsApp Dispatch Failed: ${e.message}`);
        }
    }

    /**
     * Legacy method for the main loop
     */
    async pollCommands(): Promise<string[]> {
        return [];
    }
}

export const whatsappBridge = new WhatsAppBridge();
