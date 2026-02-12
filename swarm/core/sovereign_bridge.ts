/**
 * Sovereign Bridge - WhatsApp/iMessage Bridge with Error Handling
 * Properly handles bridge initialization with graceful fallback
 */

interface BridgeStatus {
    transport: string;
    status: string;
    message: string;
}

export class UnifiedSovereignBridge {
    private commandHandler: ((cmd: string) => Promise<void>) | null = null;
    private useWhatsApp: boolean = true;
    private isInitialized: boolean = false;
    private commandBound: boolean = false;

    constructor() {
        console.log('🌌 [Bridge] Initializing Sovereign Bridge...');
    }

    async start() {
        console.log('📡 [Bridge] Starting bridge services...');
        
        try {
            // Try to start WhatsApp bridge
            const { whatsappBridge } = await import('./whatsapp_bridge.js');
            await whatsappBridge.start();
            this.isInitialized = true;
            this.useWhatsApp = true;
            await this.bindCommandHandler();
            console.log('✅ [Bridge] WhatsApp connected successfully');
        } catch (err: any) {
            console.warn('⚠️ [Bridge] WhatsApp failed:', err.message);
            console.log('📱 [Bridge] Bridge will operate in limited mode');
            this.isInitialized = true; // Mark as initialized even without WhatsApp
            this.useWhatsApp = false;
        }
    }

    async stop() {
        console.log('📡 [Bridge] Stopping bridge services...');
    }

    onCommand(handler: (cmd: string) => Promise<void>) {
        this.commandHandler = handler;
        this.commandBound = false;
        void this.bindCommandHandler();
    }

    async pushUpdate(text: string) {
        if (!this.isInitialized) {
            console.log(`📱 [Bridge] Would send update: "${text.substring(0, 50)}..."`);
            return;
        }

        if (this.useWhatsApp) {
            try {
                const { whatsappBridge } = await import('./whatsapp_bridge.js');
                await whatsappBridge.pushUpdate(text);
            } catch (err) {
                console.warn('⚠️ [Bridge] Failed to send WhatsApp update:', err);
            }
        } else {
            console.log(`📱 [Bridge] Update (no transport): "${text.substring(0, 50)}..."`);
        }
    }

    getStatus(): BridgeStatus {
        return {
            transport: this.useWhatsApp ? 'whatsapp' : 'none',
            status: this.isInitialized ? 'active' : 'initializing',
            message: this.useWhatsApp 
                ? 'WhatsApp is primary messaging channel' 
                : 'No messaging transport available'
        };
    }

    async switchTransport(transport: string) {
        if (transport === 'whatsapp') {
            this.useWhatsApp = true;
            this.commandBound = false;
            await this.bindCommandHandler();
            console.log('✅ [Bridge] Switched to WhatsApp');
        } else {
            console.log('⚠️ [Bridge] Only WhatsApp is available');
            this.useWhatsApp = true;
        }
    }

    private async bindCommandHandler() {
        if (!this.commandHandler || !this.useWhatsApp || this.commandBound) {
            return;
        }

        try {
            const { whatsappBridge } = await import('./whatsapp_bridge.js');
            whatsappBridge.onCommand(this.commandHandler);
            this.commandBound = true;
            console.log('✅ [Bridge] Command handler bound to WhatsApp bridge');
        } catch (err: any) {
            console.warn('⚠️ [Bridge] Failed to bind command handler:', err.message);
        }
    }
}

export const sovereignBridge = new UnifiedSovereignBridge();
