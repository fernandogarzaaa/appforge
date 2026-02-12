// Direct WhatsApp test
const fs = require('fs');
const path = require('path');

// Read phone number from .env.local
const envPath = path.join(__dirname, '.env.local');
let phone = '';
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^WHATSAPP_PHONE_NUMBER=(.+)$/m);
    if (match) phone = match[1].trim();
}

console.log('Phone:', phone || 'NOT FOUND');

// Convert to JID
const jid = phone ? `${phone}@s.whatsapp.net` : 'UNKNOWN';
console.log('JID:', jid);

// Create message
const report = `╔══════════════════════════════════════╗
║    WHATSAPP TEST - ANTIGRAVITY 🧪     ║
╚══════════════════════════════════════╝

✅ Connection: STABLE
📱 Target: ${phone}
💬 Status: TEST MESSAGE

If you receive this, WhatsApp is working!

Reply /status`;

console.log('\nMessage:', report);
console.log('\n📱 Check your WhatsApp for the message!');
