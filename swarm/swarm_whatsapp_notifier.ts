/**
 * 📱 SWARM WHATSAPP NOTIFIER
 * 
 * Automatically sends swarm status updates to WhatsApp
 * Primary Directive: Keep Admin informed of all swarm activities
 */

import * as fs from 'fs';
import * as path from 'path';

const QUANTUM_CHANNEL_PATH = path.join(process.cwd(), 'swarm', 'quantum_channel.json');
const STATUS_LOG_PATH = path.join(process.cwd(), 'swarm', 'swarm_status_log.json');

// Swarm status to report
interface SwarmStatus {
    overall: number;
    phase: string;
    reasoning: number;
    creativity: number;
    learning: number;
    prediction: number;
    timestamp: string;
    opportunities: number;
    agentsActive: number;
}

interface WhatsAppMessage {
    id: string;
    type: 'whatsapp_push';
    to: string;
    message: string;
    status: 'pending' | 'sent' | 'failed';
    createdAt: string;
    sentAt?: string;
}

interface QuantumChannel {
    outbound: WhatsAppMessage[];
    inbound: any[];
    lastUpdated?: string;
}

/**
 * Read current swarm status from log
 */
function readSwarmStatus(): SwarmStatus | null {
    try {
        if (fs.existsSync(STATUS_LOG_PATH)) {
            const content = fs.readFileSync(STATUS_LOG_PATH, 'utf8');
            const logs = JSON.parse(content);
            if (logs.length > 0) {
                return logs[logs.length - 1];
            }
        }
    } catch (e) {
        // Ignore
    }
    return null;
}

/**
 * Queue WhatsApp message via quantum channel
 */
function queueWhatsAppMessage(phone: string, message: string): void {
    try {
        // Read current channel
        let channel: QuantumChannel = { outbound: [], inbound: [] };
        if (fs.existsSync(QUANTUM_CHANNEL_PATH)) {
            const content = fs.readFileSync(QUANTUM_CHANNEL_PATH, 'utf8');
            channel = JSON.parse(content);
        }
        
        // Add message
        channel.outbound.push({
            id: `WA-${Date.now()}`,
            type: 'whatsapp_push',
            to: phone,
            message,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        
        // Write back
        fs.writeFileSync(QUANTUM_CHANNEL_PATH, JSON.stringify(channel, null, 2));
        console.log(`📱 [Notifier] Queued message for WhatsApp`);
    } catch (e) {
        console.error(`❌ [Notifier] Failed to queue message: ${e}`);
    }
}

/**
 * Generate status report message
 */
function generateStatusMessage(status: SwarmStatus): string {
    const opportunities = status.opportunities || 0;
    const agents = status.agentsActive || 13;
    
    let emoji = '🟢';
    if (status.overall < 0.5) emoji = '🔴';
    else if (status.overall < 0.7) emoji = '🟡';
    else if (status.overall < 0.9) emoji = '🟢';
    else emoji = '⚡';
    
    return `
${emoji} *ANTIGRAVITY SWARM STATUS*

🧠 Intelligence: ${(status.overall * 100).toFixed(1)}%
📊 Phase: ${status.phase}
💡 Reasoning: ${(status.reasoning * 100).toFixed(1)}%
🎨 Creativity: ${(status.creativity * 100).toFixed(1)}%
📚 Learning: ${(status.learning * 100).toFixed(1)}%
🔮 Prediction: ${(status.prediction * 100).toFixed(1)}%

🤖 Agents Active: ${agents}
💰 Opportunities: ${opportunities}

⏰ ${new Date().toLocaleString()}
`.trim();
}

/**
 * Generate opportunity alert
 */
function generateOpportunityMessage(opp: any): string {
    return `
💰 *NEW OPPORTUNITY DETECTED*

📊 Type: ${opp.type}
💵 Potential: ${opp.potential || 'TBD'}
📈 Confidence: ${opp.confidence ? (opp.confidence * 100).toFixed(0) + '%' : 'TBD'}

${opp.details || ''}

⏰ ${new Date().toLocaleString()}
`.trim();
}

/**
 * Main notifier class
 */
export class SwarmWhatsAppNotifier {
    private phoneNumber: string;
    private lastStatusReport: number = 0;
    private reportInterval: number = 300000; // 5 minutes
    private isRunning: boolean = false;
    private statusCache: SwarmStatus | null = null;

    constructor() {
        this.phoneNumber = process.env.WHATSAPP_PHONE_NUMBER || '';
    }

    /**
     * Start the notifier
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️ [Notifier] Already running');
            return;
        }
        
        this.isRunning = true;
        console.log('📱 [WhatsApp Notifier] Started');
        
        if (!this.phoneNumber) {
            console.log('⚠️ [Notifier] WHATSAPP_PHONE_NUMBER not set');
        }
        
        this.run();
    }

    /**
     * Main loop
     */
    async run(): Promise<void> {
        while (this.isRunning) {
            try {
                // Check for status updates
                const currentStatus = readSwarmStatus();
                if (currentStatus) {
                    this.statusCache = currentStatus;
                    
                    // Send periodic report
                    const now = Date.now();
                    if (now - this.lastStatusReport > this.reportInterval) {
                        const message = generateStatusMessage(currentStatus);
                        if (this.phoneNumber) {
                            queueWhatsAppMessage(this.phoneNumber, message);
                        }
                        this.lastStatusReport = now;
                    }
                }
            } catch (e) {
                console.error(`[Notifier] Error: ${e}`);
            }
            
            // Wait 30 seconds before checking again
            await new Promise(r => setTimeout(r, 30000));
        }
    }

    /**
     * Send immediate alert
     */
    sendAlert(message: string): void {
        if (this.phoneNumber) {
            queueWhatsAppMessage(this.phoneNumber, message);
        }
    }

    /**
     * Report opportunity
     */
    reportOpportunity(opp: any): void {
        if (this.phoneNumber) {
            const message = generateOpportunityMessage(opp);
            queueWhatsAppMessage(this.phoneNumber, message);
        }
    }

    /**
     * Stop the notifier
     */
    stop(): void {
        this.isRunning = false;
        console.log('📱 [WhatsApp Notifier] Stopped');
    }
}

/**
 * Send one-time status report
 */
export async function sendStatusReport(): Promise<void> {
    const notifier = new SwarmWhatsAppNotifier();
    const status = readSwarmStatus();
    
    if (status) {
        const message = generateStatusMessage(status);
        console.log('📱 [WhatsApp] Sending status report...');
        queueWhatsAppMessage(process.env.WHATSAPP_PHONE_NUMBER || '', message);
    } else {
        console.log('⚠️ No swarm status found');
    }
}

/**
 * Send opportunity alert
 */
export function sendOpportunityAlert(opp: any): void {
    const notifier = new SwarmWhatsAppNotifier();
    notifier.reportOpportunity(opp);
}

// Run if called directly
const notifier = new SwarmWhatsAppNotifier();
notifier.start().catch(console.error);
