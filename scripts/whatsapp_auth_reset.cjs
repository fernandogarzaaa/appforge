/**
 * WhatsApp Authentication Reset Script
 * 
 * This script deletes all WhatsApp authentication data to force a new QR code scan.
 * 
 * Run this script BEFORE starting the swarm to generate a fresh authentication session.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 [WhatsApp Auth Reset] Starting authentication reset...\n');

// Paths to clean
const pathsToClean = [
    // OpenClaw WhatsApp credentials (used by sovereign_bridge.ts)
    'C:\\Users\\ferna\\.openclaw\\credentials\\whatsapp\\default',
    // Legacy Baileys auth folder
    path.join(process.cwd(), 'auth_info_baileys'),
    // Any QR code images
    path.join(process.cwd(), 'whatsapp_qr.png'),
];

for (const p of pathsToClean) {
    try {
        if (fs.existsSync(p)) {
            if (fs.lstatSync(p).isDirectory()) {
                fs.rmSync(p, { recursive: true, force: true });
                console.log(`🗑️  Deleted directory: ${p}`);
            } else {
                fs.unlinkSync(p);
                console.log(`🗑️  Deleted file: ${p}`);
            }
        } else {
            console.log(`ℹ️  Path doesn't exist (skipped): ${p}`);
        }
    } catch (err) {
        console.error(`❌ Error deleting ${p}: ${err.message}`);
    }
}

console.log('\n✅ [WhatsApp Auth Reset] Complete!');
console.log('\n📟 NEXT STEPS:');
console.log('1. Start the swarm: npx pm2 restart appforge-swarm');
console.log('2. Wait for QR code to appear in terminal');
console.log('3. Open WhatsApp → Linked Devices → Link a Device');
console.log('4. Scan the QR code');
console.log('5. Check quantum_channel.json for connection status\n');
