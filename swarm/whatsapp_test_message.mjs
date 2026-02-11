/**
 * WhatsApp Test Message Script
 * Sends a test message to verify the WhatsApp bridge is working
 */

import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sendTestMessage() {
    let TARGET_PHONE = process.argv[2] || '+639761267704';
    const openClawAuthPath = 'C:\\Users\\ferna\\.openclaw\\credentials\\whatsapp\\default';

    // Format phone number for WhatsApp JID
    if (TARGET_PHONE.includes('@s.whatsapp.net')) {
        TARGET_PHONE = TARGET_PHONE.split('@')[0];
    } else {
        TARGET_PHONE = TARGET_PHONE.replace(/\D/g, ''); // Remove non-digits
    }

    console.log(`📱 [WhatsApp Test] Sending test message to ${TARGET_PHONE}...`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState(openClawAuthPath);
        const { version, isLatest } = await fetchLatestBaileysVersion();

        console.log(`📡 [WhatsApp] Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

        const sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            logger: pino({ level: 'silent' }),
            browser: ["Sovereign Swarm Test", "Chrome", "1.0.0"]
        });

        sock.ev.on('creds.update', saveCreds);

        // Wait for connection
        await new Promise((resolve) => {
            sock.ev.on('connection.update', (update) => {
                if (update.connection === 'open') {
                    console.log('✅ [WhatsApp] Connected!');
                    resolve();
                } else if (update.connection === 'close') {
                    console.log('❌ [WhatsApp] Connection closed');
                }
            });
        });

        // Give time for auth to settle
        await new Promise(r => setTimeout(r, 1000));

        // Send test message using JID format
        const message = `🤖 Hello from AppForge Swarm!\n\n✅ WhatsApp Direct Bridge is operational.\n🕐 Timestamp: ${new Date().toISOString()}`;
        const jid = `${TARGET_PHONE}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: message });
        console.log(`✅ [WhatsApp] Test message sent to ${TARGET_PHONE}`);

        // Exit after sending
        setTimeout(() => process.exit(0), 2000);

    } catch (error) {
        console.error('❌ [WhatsApp Test] Failed:', error.message);
        process.exit(1);
    }
}

sendTestMessage();
