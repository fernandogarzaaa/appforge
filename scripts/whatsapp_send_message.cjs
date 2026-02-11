/**
 * WhatsApp Message Sender - IPC to Running Swarm
 * 
 * This script sends a message to the running swarm via quantum_channel.json
 * The swarm will pick it up and send via WhatsApp.
 */

const fs = require('fs');
const path = require('path');

const QUANTUM_CHANNEL_PATH = path.join(process.cwd(), 'swarm', 'quantum_channel.json');
const TARGET_PHONE = process.argv[2] || '639919465677';
const MESSAGE = process.argv[3] || '🌌 [ANTIGRAVITY] Test message from AppForge Swarm!\n🕐 ' + new Date().toISOString();

function sendViaQuantumChannel() {
    console.log(`📱 [WhatsApp Sender] Queueing message via quantum_channel.json...`);
    
    try {
        // Read existing channel or create new
        let channel = {
            outbound: [],
            inbound: [],
            lastUpdated: new Date().toISOString()
        };
        
        if (fs.existsSync(QUANTUM_CHANNEL_PATH)) {
            try {
                const content = fs.readFileSync(QUANTUM_CHANNEL_PATH, 'utf8');
                channel = JSON.parse(content);
            } catch (e) {
                console.log('📝 Creating new quantum channel...');
            }
        }
        
        // Add message to outbound queue
        const messageEntry = {
            id: `msg_${Date.now()}`,
            type: 'whatsapp_push',
            to: TARGET_PHONE,
            message: MESSAGE,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        channel.outbound = channel.outbound || [];
        channel.outbound.push(messageEntry);
        channel.lastUpdated = new Date().toISOString();
        
        // Write back
        fs.writeFileSync(QUANTUM_CHANNEL_PATH, JSON.stringify(channel, null, 2));
        console.log(`✅ [WhatsApp Sender] Message queued successfully!`);
        console.log(`📍 Channel: ${QUANTUM_CHANNEL_PATH}`);
        console.log(`📱 To: ${TARGET_PHONE}`);
        console.log(`💬 Message: ${MESSAGE.substring(0, 50)}...`);
        
    } catch (error) {
        console.error('❌ [WhatsApp Sender] Failed:', error.message);
    }
}

sendViaQuantumChannel();
