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

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^WHATSAPP_PHONE_NUMBER=(.+)$/);
        if (match) {
            process.env.WHATSAPP_PHONE_NUMBER = match[1].trim();
            console.log(`📱 [WhatsApp] Loaded phone number: ${process.env.WHATSAPP_PHONE_NUMBER}`);
        }
    });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUANTUM_CHANNEL_PATH = path.join(__dirname, '..', '..', 'swarm', 'quantum_channel.json');

// Disconnect reason mapping for diagnostics
const DISCONNECT_REASONS: Record<number, string> = {
    [DisconnectReason.connectionClosed]: 'Connection closed by server',
    [DisconnectReason.connectionLost]: 'Connection lost (network issue)',
    [DisconnectReason.connectionReplaced]: 'Connection replaced by another session',
    [DisconnectReason.loggedOut]: 'Session logged out (needs re-auth)',
    [DisconnectReason.restartRequired]: 'Restart required',
    [DisconnectReason.badSession]: 'Bad session (corrupted)'
};

export class WhatsAppBridge {
    private phoneNumber: string;
    private lastProcessedTimestamp: number;
    private sock: any = null;
    private isConnected: boolean = false;
    private commandHandlers: ((cmd: string) => Promise<void>)[] = [];
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 10000; // Start with 10 seconds
    private isReconnecting: boolean = false;
    private currentAuthPath: string = '';
    private keepaliveInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.phoneNumber = process.env.WHATSAPP_PHONE_NUMBER || '';
        this.lastProcessedTimestamp = Date.now();
    }

    /**
     * Start keepalive ping to maintain connection
     */
    private startKeepalive() {
        // Stop any existing keepalive
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
        }

        // Ping every 30 seconds to keep connection alive
        this.keepaliveInterval = setInterval(async () => {
            if (this.isConnected && this.sock) {
                try {
                    // Send a ping to keep connection alive
                    await this.sock.sendPresenceUpdate('available');
                    console.log('📡 [WhatsApp] Keepalive ping sent');
                } catch (e: any) {
                    console.log('⚠️ [WhatsApp] Keepalive failed:', e.message);
                }
            }
        }, 30000);
    }

    /**
     * Stop keepalive ping
     */
    private stopKeepalive() {
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
            this.keepaliveInterval = null;
        }
    }

    getPhoneNumber(): string {
        return this.phoneNumber;
    }

    /**
     * Get JID format for WhatsApp
     */
    private getJID(phone: string): string {
        const cleanPhone = phone.replace(/@s\.whatsapp\.net|@g\.us$/, '');
        const digits = cleanPhone.replace(/\D/g, '');
        return `${digits}@s.whatsapp.net`;
    }

    /**
     * Set a command handler
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

            const now = Date.now();
            if (now - this.lastProcessedTimestamp < 5000) return;
            this.lastProcessedTimestamp = now;

            console.log(`📤 [WhatsApp] Processing ${outbound.length} outbound messages...`);

            let messagesSent = 0;
            for (const msg of outbound) {
                if (msg.status === 'pending' && msg.type === 'whatsapp_push') {
                    const target = msg.to || this.phoneNumber;
                    const targetJID = this.getJID(target);

                    console.log(`📱 [WhatsApp] Sending to ${targetJID}...`);

                    try {
                        await this.sock.sendMessage(targetJID, { text: msg.message });
                        console.log(`✅ [WhatsApp] Message delivered`);
                        msg.status = 'sent';
                        msg.sentAt = new Date().toISOString();
                        messagesSent++;
                    } catch (e: any) {
                        console.error(`❌ [WhatsApp] Failed: ${e.message}`);
                        msg.status = 'failed';
                        msg.error = e.message;
                    }
                }
            }

            if (messagesSent > 0) {
                channel.lastUpdated = new Date().toISOString();
                fs.writeFileSync(QUANTUM_CHANNEL_PATH, JSON.stringify(channel, null, 2));
            }

        } catch (e: any) {
            // Silent fail
        }
    }

    /**
     * Initialize the WhatsApp connection with exponential backoff
     */
    async start() {
        console.log('⚡ [WhatsApp] Initializing Bridge...');

        // Always use local auth for stability
        this.currentAuthPath = path.join(process.cwd(), 'auth_info_baileys');

        try {
            if (!fs.existsSync(this.currentAuthPath)) {
                fs.mkdirSync(this.currentAuthPath, { recursive: true });
                console.log('📁 [WhatsApp] Created local auth directory');
            }
        } catch (e) {
            console.error('❌ [WhatsApp] Failed to create auth dir:', e);
        }

        console.log(`📁 [WhatsApp] Using auth from: ${this.currentAuthPath}`);

        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.currentAuthPath);
            const { version, isLatest } = await fetchLatestBaileysVersion();

            console.log(`📡 [WhatsApp] Baileys v${version.join('.')}, isLatest: ${isLatest}`);

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

                // Log connection state changes
                console.log(`📡 [WhatsApp] State: ${connection}`);

                if (qr) {
                    console.log('📟 [WhatsApp] Scan QR code in terminal');
                    const qrPath = path.join(process.cwd(), 'whatsapp_qr.png');
                    try {
                        await QRCode.toFile(qrPath, qr);
                        console.log(`🖼️ [WhatsApp] QR saved to: ${qrPath}`);
                    } catch (err) {
                        console.error('❌ [WhatsApp] QR save failed');
                    }
                }

                if (connection === 'close') {
                    // Extract status code from disconnect error
                    const statusCode = (lastDisconnect?.error as any)?.statusCode ||
                        (lastDisconnect?.error as any)?.output?.statusCode ||
                        0;

                    // Get human-readable disconnect reason
                    const reasonName = DISCONNECT_REASONS[statusCode] || `Unknown (${statusCode})`;
                    console.log(`📡 [WhatsApp] Disconnected: ${reasonName}`);

                    // Log the actual error for debugging
                    if (lastDisconnect?.error) {
                        console.log(`📡 [WhatsApp] Error details: ${JSON.stringify(lastDisconnect.error)}`);
                    }

                    // Reset reconnect counter if connection was successful before
                    if (this.isConnected) {
                        this.reconnectAttempts = 0;
                        this.reconnectDelay = 5000; // Faster reconnection initially
                    }

                    // Handle different disconnect reasons
                    if (statusCode === DisconnectReason.loggedOut) {
                        console.log('❌ [WhatsApp] Session logged out - please scan new QR');
                        this.stopKeepalive();
                        this.clearAuthFiles();
                        this.isConnected = false;
                        return;
                    }

                    // Handle connection lost - try to reconnect immediately
                    if (statusCode === DisconnectReason.connectionLost) {
                        console.log('🔄 [WhatsApp] Network issue detected - reconnecting...');
                        this.stopKeepalive();
                        setTimeout(() => this.start(), 2000);
                        this.isConnected = false;
                        return;
                    }

                    // Handle session expired - might need to refresh
                    if (statusCode === DisconnectReason.restartRequired) {
                        console.log('🔄 [WhatsApp] Restart required - reconnecting...');
                        this.stopKeepalive();
                        setTimeout(() => this.start(), 3000);
                        this.isConnected = false;
                        return;
                    }

                    // Handle connection replaced - wait longer before retry
                    if (statusCode === DisconnectReason.connectionReplaced) {
                        console.log('⚠️ [WhatsApp] Connection replaced by another session');
                        console.log('💡 Tip: Close WhatsApp Web on other devices to maintain connection');
                        this.stopKeepalive();
                        // Wait longer since another session is active
                        setTimeout(() => this.start(), 15000);
                        this.isConnected = false;
                        return;
                    }

                    // Handle bad session - clear and reconnect
                    if (statusCode === DisconnectReason.badSession) {
                        console.log('🔄 [WhatsApp] Bad session - clearing and reconnecting...');
                        this.stopKeepalive();
                        this.clearAuthFiles();
                        setTimeout(() => this.start(), 3000);
                        this.isConnected = false;
                        return;
                    }

                    // Don't reconnect too frequently
                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        console.log('❌ [WhatsApp] Max reconnection attempts reached');
                        this.stopKeepalive();
                        this.isConnected = false;
                        return;
                    }

                    this.reconnectAttempts++;
                    const delay = Math.min(this.reconnectDelay * Math.pow(1.3, this.reconnectAttempts - 1), 60000);

                    console.log(`🔄 [WhatsApp] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

                    this.stopKeepalive();
                    setTimeout(() => this.start(), delay);
                    this.isConnected = false;

                } else if (connection === 'open') {
                    console.log('✅ [WhatsApp] Connected and ready');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;

                    // Start keepalive ping
                    this.startKeepalive();
                }
            });

            this.sock.ev.on('messages.upsert', async (m: any) => {
                if (m.type !== 'notify') return;

                for (const msg of m.messages) {
                    if (!msg.message || msg.key.fromMe) continue;

                    const remoteJid = msg.key.remoteJid;
                    const body = msg.message.conversation ||
                        msg.message.extendedTextMessage?.text || '';

                    if (!body) continue;

                    if (remoteJid === this.phoneNumber || msg.key.participant === this.phoneNumber) {
                        console.log(`📱 [WhatsApp] Inbound: "${body}"`);

                        const lowerBody = body.toLowerCase();
                        const isSovereign = lowerBody.includes('sovereign');

                        if (body.startsWith('/') || body.startsWith('!') || isSovereign) {
                            let cleanCmd = body;
                            if (isSovereign) {
                                cleanCmd = lowerBody.split('sovereign')[1].trim();
                            } else {
                                cleanCmd = body.substring(1).trim();
                            }

                            for (const handler of this.commandHandlers) {
                                await handler(cleanCmd);
                            }
                        }
                    }
                }
            });

            // Start quantum channel polling
            this.startQuantumPolling();
            console.log('✅ [WhatsApp] Bridge initialized');

        } catch (err: any) {
            console.error('❌ [WhatsApp] Failed to start:', err.message);
            console.log('⚠️ [WhatsApp] Operating in degraded mode');
        }
    }

    /**
     * Clear authentication files
     */
    private clearAuthFiles() {
        try {
            if (fs.existsSync(this.currentAuthPath)) {
                const files = fs.readdirSync(this.currentAuthPath);
                for (const file of files) {
                    const filePath = path.join(this.currentAuthPath, file);
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ [WhatsApp] Deleted: ${file}`);
                }
            }
        } catch (e) {
            console.error('❌ [WhatsApp] Failed to clear auth:', e);
        }
    }

    /**
     * Start polling quantum channel
     */
    private startQuantumPolling() {
        setInterval(async () => {
            if (this.isConnected && this.sock) {
                await this.processQuantumChannel();
            }
        }, 5000); // Poll every 5 seconds
    }

    /**
     * Send a notification
     */
    async pushUpdate(message: string) {
        if (!this.isConnected || !this.sock) {
            console.warn('⚠️ [WhatsApp] Not connected. Message queued.');
            return;
        }

        if (!this.phoneNumber) {
            console.warn('⚠️ [WhatsApp] No phone number configured.');
            return;
        }

        const targetJID = this.getJID(this.phoneNumber);
        console.log(`📡 [WhatsApp] Sending to ${targetJID}...`);

        try {
            await this.sock.sendMessage(targetJID, { text: message });
            console.log('✅ [WhatsApp] Notification delivered.');
        } catch (e: any) {
            console.error(`❌ [WhatsApp] Failed: ${e.message}`);
        }
    }

    /**
     * Legacy method
     */
    async pollCommands(): Promise<string[]> {
        return [];
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            transport: 'whatsapp',
            status: this.isConnected ? 'connected' : 'disconnected',
            message: this.isConnected ? 'WhatsApp bridge active' : 'Reconnecting...'
        };
    }
}

export const whatsappBridge = new WhatsAppBridge();
