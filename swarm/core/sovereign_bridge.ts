import { imessageBridge } from './imessage_bridge.js';
import { whatsappBridge } from './whatsapp_bridge.js';

export class UnifiedSovereignBridge {
    private primaryTransport: 'imessage' | 'whatsapp' = 'whatsapp';
    private commandHandler: ((cmd: string) => Promise<void>) | null = null;

    constructor() {
        // Decide primary transport based on environment
        const mode = process.env.IMESSAGE_TRANSPORT_MODE || 'imsg';
        const bhUrl = process.env.BLUEBUBBLES_SERVER_URL;

        if (mode === 'bluebubbles' && bhUrl) {
            this.primaryTransport = 'imessage';
            console.log('🌌 [Bridge] Unified Interface: Primary Mode -> iMessage (BlueBubbles)');
        } else if (mode === 'imsg' && process.platform === 'darwin') {
            this.primaryTransport = 'imessage';
            console.log('🌌 [Bridge] Unified Interface: Primary Mode -> iMessage (Native macOS)');
        } else {
            this.primaryTransport = 'whatsapp';
            console.log('🌌 [Bridge] Unified Interface: Primary Mode -> WhatsApp (Direct Baileys)');
        }
    }

    async start() {
        console.log(`📡 [Bridge] Starting Unified Sovereign Link via ${this.primaryTransport.toUpperCase()}...`);

        try {
            if (this.primaryTransport === 'imessage') {
                await imessageBridge.start();
            } else {
                await whatsappBridge.start();
            }
        } catch (err) {
            console.error(`❌ [Bridge] Failed to start primary transport (${this.primaryTransport}):`, err);
            if (this.primaryTransport === 'imessage') {
                console.warn('⚠️ [Bridge] Falling back to WhatsApp...');
                this.primaryTransport = 'whatsapp';
                await whatsappBridge.start();
            }
        }
    }

    async stop() {
        if (this.primaryTransport === 'imessage') {
            await imessageBridge.stop();
        }
        // WhatsApp bridge stop is usually handled by process exit or sock cleanup
    }

    onCommand(handler: (cmd: string) => Promise<void>) {
        this.commandHandler = handler;
        // Register with BOTH just in case, or just primary
        imessageBridge.onCommand(handler);
        whatsappBridge.onCommand(handler);
    }

    async pushUpdate(text: string) {
        try {
            if (this.primaryTransport === 'imessage') {
                const recipient = process.env.IMESSAGE_RECIPIENT;
                if (!recipient) throw new Error('IMESSAGE_RECIPIENT not set');
                await imessageBridge.pushUpdate(recipient, text);
            } else {
                // WhatsApp bridge handles its own phone number from env
                await whatsappBridge.pushUpdate(text);
            }
        } catch (err) {
            console.error(`❌ [Bridge] Push failed on ${this.primaryTransport}:`, err);
            // Emergency fallback if sending fails
            if (this.primaryTransport === 'imessage') {
                console.warn('⚠️ [Bridge] Emergency switch to WhatsApp for delivery...');
                this.primaryTransport = 'whatsapp';
                await whatsappBridge.pushUpdate(`[FALLBACK] ${text}`);
            }
        }
    }
}

export const sovereignBridge = new UnifiedSovereignBridge();
