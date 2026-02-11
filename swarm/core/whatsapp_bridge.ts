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
     * Set a command handler to be called when a command is received
     */
    onCommand(handler: (cmd: string) => Promise<void>) {
        this.commandHandlers.push(handler);
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
            printQRInTerminal: false, // Don't print QR as we hope to reuse the session
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

        console.log(`📡 [WhatsApp] Pushing Direct Update to ${this.phoneNumber}...`);

        try {
            await this.sock.sendMessage(this.phoneNumber, { text: message });
            console.log('   ✅ WhatsApp Notification Delivered.');
        } catch (e: any) {
            console.error(`   ❌ WhatsApp Dispatch Failed: ${e.message}`);
        }
    }

    /**
     * Legacy method for the main loop - no longer needs to poll logs
     * but returns any commands queued by the event listeners.
     * In the new architecture, onCommand is preferred.
     */
    async pollCommands(): Promise<string[]> {
        // This is now handled by event listeners, but we keep the signature for compatibility
        return [];
    }
}

export const whatsappBridge = new WhatsAppBridge();
