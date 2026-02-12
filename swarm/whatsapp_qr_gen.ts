/**
 * 📱 Simple WhatsApp QR Generator
 * Run this to get the QR code for WhatsApp authentication
 */

import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.join(__dirname, 'auth_test');

async function startWhatsApp() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   📱 ANTIGRAVITY WHATSAPP - QR CODE GENERATOR              ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();

        console.log('🔄 Connecting to WhatsApp...\n');

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            logger: { level: 'silent' },
            browser: ['Antigravity Swarm', 'Chrome', '1.0.0']
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, qr, lastDisconnect } = update;

            if (qr) {
                console.log('\n╔═══════════════════════════════════════════════════════════════╗');
                console.log('║   📱 SCAN THIS QR CODE WITH WHATSAPP                       ║');
                console.log('╚═══════════════════════════════════════════════════════════════╝\n');
                
                // Generate QR code as ASCII
                try {
                    const qrAscii = await QRCode.toString(qr, { type: 'terminal', small: true });
                    console.log(qrAscii);
                    console.log('\n⚠️ Scan within 30 seconds!\n');
                } catch (e) {
                    console.log('QR Code ready - check terminal above');
                    console.log(`Raw QR: ${qr.substring(0, 50)}...\n`);
                }
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log('❌ Session expired - run again to get new QR\n');
                } else {
                    console.log(`📡 Connection closed: ${reason}\n`);
                }
            }

            if (connection === 'open') {
                console.log('✅ ✅ ✅ WHATSAPP CONNECTED! ✅ ✅ ✅\n');
                console.log('Swarm will now send notifications to this number.\n');
            }
        });

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

startWhatsApp();
