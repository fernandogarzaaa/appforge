import { whatsappBridge } from './whatsapp_bridge.js';

/**
 * Sovereign Bridge - WhatsApp Only
 * Simplified for reliable messaging without iMessage
 */

export class UnifiedSovereignBridge {
    private commandHandler: ((cmd: string) => Promise<void>) | null = null;
    private useWhatsApp: boolean = true;

    constructor() {
        console.log('🌌 [Bridge] WhatsApp Only Mode - Simplified & Reliable');
    }

    async start() {
        console.log('📡 [Bridge] Starting WhatsApp Bridge...');
        try {
            await whatsappBridge.start();
        } catch (err) {
            console.error('❌ [Bridge] WhatsApp failed to start:', err);
            throw err;
        }
    }

    async stop() {
        // WhatsApp cleanup handled by process exit
    }

    onCommand(handler: (cmd: string) => Promise<void>) {
        this.commandHandler = handler;
        whatsappBridge.onCommand(handler);
    }

    async pushUpdate(text: string) {
        await whatsappBridge.pushUpdate(text);
    }

    getStatus() {
        return {
            transport: 'whatsapp',
            status: 'active',
            message: 'WhatsApp is primary and only messaging channel'
        };
    }

    async switchTransport(transport: string) {
        if (transport === 'whatsapp') {
            this.useWhatsApp = true;
            console.log('✅ [Bridge] Switched to WhatsApp');
        } else {
            console.log('⚠️ [Bridge] Only WhatsApp is available');
        }
    }
}

export const sovereignBridge = new UnifiedSovereignBridge();
