/**
 * Sovereign Bridge - WhatsApp/iMessage Bridge with Error Handling
 * Properly handles bridge initialization with graceful fallback
 */

interface BridgeStatus {
    transport: string;
    status: string;
    message: string;
}

export class MultiTransportGateway {
    private commandHandler: ((cmd: string) => Promise<void>) | null = null;
    private transports: Map<string, any> = new Map();
    private isInitialized: boolean = false;

    constructor() {
        console.log('🌌 [Gateway] Initializing Multi-Transport Sovereign Gateway (OpenClaw Synthesis)...');
    }

    async start() {
        console.log('📡 [Gateway] Activating transport mesh...');

        // 1. WhatsApp (Primary)
        try {
            const { whatsappBridge } = await import('./whatsapp_bridge.js');
            await whatsappBridge.start();
            this.transports.set('whatsapp', whatsappBridge);
            console.log('✅ [Gateway] WhatsApp transport active');
        } catch (err: any) {
            console.warn('⚠️ [Gateway] WhatsApp failed:', err.message);
        }

        // 2. Discord (Synthesis)
        try {
            const { discordBridge } = await import('./discord_bridge.js');
            await discordBridge.start();
            this.transports.set('discord', discordBridge);
        } catch (e: any) {
            console.log('ℹ️ [Gateway] Discord transport inactive (Standby)');
        }

        // 3. Telegram (Synthesis)
        try {
            const { telegramBridge } = await import('./telegram_bridge.js');
            await telegramBridge.start();
            this.transports.set('telegram', telegramBridge);
        } catch (e: any) {
            console.log('ℹ️ [Gateway] Telegram transport inactive (Standby)');
        }

        this.isInitialized = true;
        await this.bindAllCommandHandlers();
    }

    async stop() {
        console.log('📡 [Gateway] Powering down transport mesh...');
        for (const [name, bridge] of this.transports) {
            if (bridge.stop) await bridge.stop();
        }
    }

    onCommand(handler: (cmd: string) => Promise<void>) {
        this.commandHandler = handler;
        void this.bindAllCommandHandlers();
    }

    /**
     * Broadcast message to ALL active transports
     */
    async pushUpdate(text: string) {
        if (!this.isInitialized) {
            console.log(`📱 [Gateway] Caching update: "${text.substring(0, 50)}..."`);
            return;
        }

        const promises = Array.from(this.transports.values()).map(bridge =>
            bridge.pushUpdate(text).catch((e: any) => console.error(`❌ [Gateway] Broadcast error:`, e.message))
        );

        await Promise.all(promises);
    }

    getStatus(): BridgeStatus[] {
        return Array.from(this.transports.values()).map(b => b.getStatus());
    }

    async switchTransport(transport: string) {
        console.log(`📡 [Gateway] Transport switching is now handled automatically for all active channels.`);
    }

    private async bindAllCommandHandlers() {
        if (!this.commandHandler) return;

        for (const [name, bridge] of this.transports) {
            try {
                bridge.onCommand(this.commandHandler);
                console.log(`✅ [Gateway] Command handler bound to ${name}`);
            } catch (e: any) {
                console.warn(`⚠️ [Gateway] Failed to bind ${name}:`, e.message);
            }
        }
    }
}

export const sovereignBridge = new MultiTransportGateway();
