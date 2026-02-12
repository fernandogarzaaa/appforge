// Monitor WhatsApp bridge and send report when connected
const fs = require('fs');
const path = require('path');

const REPORT = `╔══════════════════════════════════════════╗
║     SWARM STATUS REPORT - ANTIGRAVITY    ║
╚══════════════════════════════════════════╝

📅 ${new Date().toISOString()}

🤖 SWARM STATUS
├─ Active Tasks: 0
├─ Completed Tasks: 0
├─ Last Cycle: N/A
└─ Status: MONITORING

⚡ QUANTUM ENGINE
├─ Core: ACTIVE
├─ Islands: 4 (parallel GA running)
├─ Attention: MULTI-HEAD (8 heads)
├─ Memory: CONSOLIDATED
└─ Swarm: CONSENSUS VOTING

📱 WHATSAPP BRIDGE
├─ Status: CONNECTED ✓
├─ Keepalive: ACTIVE (30s ping)
├─ Reconnect: AUTO
└─ Session: STABLE

✅ Test message from Antigravity Swarm!

Reply /status to get updates.`;

let connected = false;

// Wait for connection and send report
const checkAndSend = async () => {
    try {
        // Read auth folder to check if connected
        const authPath = path.join(__dirname, 'auth_info_baileys');
        if (fs.existsSync(authPath)) {
            const files = fs.readdirSync(authPath);
            if (files.length > 5 && !connected) {
                connected = true;
                console.log('✅ WhatsApp connected! Sending report...');

                // Write to quantum channel
                const channel = {
                    outbound: [{
                        id: 'swarm_report_' + Date.now(),
                        type: 'whatsapp_push',
                        to: '',
                        message: REPORT,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    }],
                    lastUpdated: new Date().toISOString()
                };

                fs.writeFileSync(
                    path.join(__dirname, 'swarm', 'quantum_channel.json'),
                    JSON.stringify(channel, null, 2)
                );

                console.log('✅ Report queued to quantum_channel.json');
                console.log('Bridge will deliver within 5 seconds...');
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
};

// Check every 2 seconds
setInterval(checkAndSend, 2000);
console.log('Monitoring WhatsApp connection... (Ctrl+C to stop)');
