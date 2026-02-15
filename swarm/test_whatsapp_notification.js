/**
 * 📱 WhatsApp Notification Test Script
 * 
 * Quick test to verify WhatsApp integration is working
 * Run this to get immediate updates on WhatsApp
 */

const fs = require('fs');
const path = require('path');

const QUANTUM_CHANNEL_PATH = path.join(process.cwd(), 'swarm', 'quantum_channel.json');

function sendWhatsAppMessage(message) {
    const phone = process.env.WHATSAPP_PHONE_NUMBER || '';
    if (!phone) {
        console.log('⚠️ WHATSAPP_PHONE_NUMBER not set in .env');
        console.log('📝 Add WHATSAPP_PHONE_NUMBER=+1234567890 to .env');
        return false;
    }

    // Read current channel
    let channel = { outbound: [], inbound: [] };
    try {
        if (fs.existsSync(QUANTUM_CHANNEL_PATH)) {
            const content = fs.readFileSync(QUANTUM_CHANNEL_PATH, 'utf8');
            channel = JSON.parse(content);
        }
    } catch (e) {
        // File doesn't exist yet
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
    console.log(`✅ Message queued for WhatsApp`);
    console.log(`📱 Will be sent to: ${phone}`);
    return true;
}

// Send immediate test
console.log('═══════════════════════════════════════════════════');
console.log('  📱 ANTIGRAVITY SWARM - WhatsApp Test');
console.log('═══════════════════════════════════════════════════\n');

const testMessage = `
🌌 *ANTIGRAVITY SWARM - TEST MESSAGE*

✅ WhatsApp integration is working!
🧠 Swarm is operating autonomously
📊 Learning and optimizing 24/7

Primary Directive: Making you money 💰
Secondary Directive: Autonomous evolution 🧬
Objective: Superior intelligence ⚡

⏰ ${new Date().toLocaleString()}
`.trim();

if (sendWhatsAppMessage(testMessage)) {
    console.log('\n📝 Next steps:');
    console.log('1. Start WhatsApp bridge: npx tsx swarm/core/whatsapp_bridge.ts');
    console.log('2. Scan QR code with WhatsApp');
    console.log('3. Messages will be delivered automatically!');
}
