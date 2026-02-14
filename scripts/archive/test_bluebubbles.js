#!/usr/bin/env node
/**
 * BlueBubbles Connection Test Script
 * Tests connection to BlueBubbles server and iMessage functionality
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

async function testBlueBubblesConnection() {
    console.log('🔵 Testing BlueBubbles Connection...\n');

    const serverUrl = process.env.BLUEBUBBLES_SERVER_URL;
    const password = process.env.BLUEBUBBLES_PASSWORD;

    if (!serverUrl || !password) {
        console.log('❌ Missing configuration:');
        console.log('   BLUEBUBBLES_SERVER_URL:', serverUrl || 'NOT SET');
        console.log('   BLUEBUBBLES_PASSWORD:', password ? '***' : 'NOT SET');
        console.log('\n📝 Update .env.local with:');
        console.log('   BLUEBUBBLES_SERVER_URL=http://YOUR_MAC_IP:1234');
        console.log('   BLUEBUBBLES_PASSWORD=your_password');
        return;
    }

    console.log(`📡 Server URL: ${serverUrl}`);
    console.log(`🔑 Password: ${password ? '***' : 'NOT SET'}\n`);

    // Test 1: Server Info
    console.log('─────────────────────────────────────────────');
    console.log('TEST 1: Server Info');
    console.log('─────────────────────────────────────────────');

    try {
        const infoRes = await fetch(`${serverUrl}/api/v1/server/info`, {
            headers: { 'Password': password }
        });

        if (infoRes.ok) {
            const info = await infoRes.json();
            console.log('✅ Server Connected!');
            console.log(`   Version: ${info.data?.version || 'Unknown'}`);
            console.log(`   OS: ${info.data?.os || 'Unknown'}`);
        } else {
            console.log(`❌ Server Error: ${infoRes.status} ${infoRes.statusText}`);
        }
    } catch (err) {
        console.log(`❌ Connection Failed: ${err.message}`);
        console.log('   Possible causes:');
        console.log('   - BlueBubbles not running');
        console.log('   - Wrong IP or port');
        console.log('   - Firewall blocking connection');
    }

    // Test 2: List Chats
    console.log('\n─────────────────────────────────────────────');
    console.log('TEST 2: List Chats');
    console.log('─────────────────────────────────────────────');

    try {
        const chatsRes = await fetch(`${serverUrl}/api/v1/chat`, {
            headers: { 'Password': password }
        });

        if (chatsRes.ok) {
            const chats = await chatsRes.json();
            console.log('✅ Chats Retrieved!');
            console.log(`   Total Chats: ${chats.data?.length || 0}`);

            // Find target chat
            const targetEmail = process.env.IMESSAGE_RECIPIENT || 'fernandogarzaaa@gmail.com';
            const targetChat = chats.data?.find(c =>
                c.participants?.includes(targetEmail) ||
                c.displayName === targetEmail
            );

            if (targetChat) {
                console.log(`   ✅ Target chat found: ${targetChat.guid}`);
            } else {
                console.log(`   ⚠️ Target chat (${targetEmail}) not found`);
            }
        } else {
            console.log(`❌ Error: ${chatsRes.status}`);
        }
    } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
    }

    // Test 3: Send Test Message
    console.log('\n─────────────────────────────────────────────');
    console.log('TEST 3: Send Test Message');
    console.log('─────────────────────────────────────────────');

    const recipient = process.env.IMESSAGE_RECIPIENT;

    if (!recipient) {
        console.log('⚠️ IMESSAGE_RECIPIENT not set in .env.local');
        console.log('   Cannot send test message');
    } else {
        try {
            const sendRes = await fetch(`${serverUrl}/api/v1/chat/text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Password': password
                },
                body: JSON.stringify({
                    guid: recipient,
                    text: '🧪 Test message from AppForge Swarm!'
                })
            });

            if (sendRes.ok) {
                console.log('✅ Test Message Sent!');
                console.log(`   To: ${recipient}`);
            } else {
                const error = await sendRes.json();
                console.log(`❌ Send Failed: ${error.message || sendRes.status}`);
            }
        } catch (err) {
            console.log(`❌ Failed: ${err.message}`);
        }
    }

    // Summary
    console.log('\n─────────────────────────────────────────────');
    console.log('📋 Next Steps');
    console.log('─────────────────────────────────────────────');
    console.log('1. If all tests passed: iMessage is ready!');
    console.log('2. Restart swarm: npx pm2 restart appforge-swarm');
    console.log('3. Send "transport" command to verify iMessage is primary');
}

testBlueBubblesConnection().catch(console.error);
