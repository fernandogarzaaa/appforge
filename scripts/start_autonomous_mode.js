/**
 * Autonomous Bot Runner
 * 
 * This script runs the autonomous bots in a loop.
 * Ideally, this should be run via a process manager like PM2 or a cron job.
 * 
 * Usage: node scripts/start_autonomous_mode.js
 */

import fetch from 'node-fetch'; // Ensure you have node-fetch or use native fetch in Node 18+

import fs from 'fs';
import path from 'path';

// Load .env.local if exists
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log('Loaded configuration from .env.local');
    }
} catch (e) {
    console.warn('Could not load .env.local:', e.message);
}

import { checkSecurty } from './bots/sentinel.js';
import { huntBugs } from './bots/bug_hunter.js';
import { optimizeSystem } from './bots/optimizer.js';
import { runGodMode } from './bots/god_mode.js';

// Configuration
// Default to production if not specified, or localhost if explicitly set
const API_URL_VAR = process.env.VITE_BASE44_API_URL;
const BASE_URL = API_URL_VAR ? `${API_URL_VAR}/functions/v1` : 'http://localhost:54321/functions/v1';
const RUN_INTERVAL_MS = 15 * 60 * 1000; // Run every 15 minutes
const REPORT_EMAIL = 'fernandogarzaaa@gmail.com';

// Direct API Configuration
const APP_ID = process.env.BASE44_APP_ID;
const API_KEY = process.env.BASE44_API_KEY;

console.log(`Using API URL: ${BASE_URL}`);
if (APP_ID && API_KEY) console.log('Direct API access enabled for heartbeat.');

async function runBot() {
    console.log(`[${new Date().toISOString()}] Starting Autonomous Bot Cycle...`);

    // 1. Direct API Heartbeat (if credentials exist)
    if (APP_ID && API_KEY) {
        try {
            // Update project stats to show bot activity
            await fetch(`https://app.base44.com/api/apps/${APP_ID}/entities/Project`, {
                method: 'GET',
                headers: { 'api_key': API_KEY, 'Content-Type': 'application/json' }
            }).then(async res => {
                if (res.ok) {
                    const projects = await res.json();
                    if (projects.length > 0) {
                        const pid = projects[0]._id || projects[0].id;
                        await fetch(`https://app.base44.com/api/apps/${APP_ID}/entities/Project/${pid}`, {
                            method: 'PUT',
                            headers: { 'api_key': API_KEY, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                stats: {
                                    ...projects[0].stats,
                                    last_bot_check: new Date().toISOString(),
                                    quantum_status: 'Active 🟢'
                                }
                            })
                        });
                        console.log('✅ Heartbeat sent to Base44 API');

                        // Send Direct Email Report (since we have the keys)
                        await fetch(`https://app.base44.com/api/apps/${APP_ID}/integration-endpoints/Core/SendEmail`, {
                            method: 'POST',
                            headers: { 'api_key': API_KEY, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: REPORT_EMAIL,
                                subject: `[Quantum Intelligence] Bot Active 🟢 - ${new Date().toLocaleTimeString()}`,
                                body: `
                                    <h2>Autonomous Bot Heartbeat</h2>
                                    <p><strong>Status:</strong> Active (Direct API Mode)</p>
                                    <p><strong>Project:</strong> ${projects[0].name}</p>
                                    <p><strong>Quantum Status:</strong> ${projects[0].stats?.quantum_status || 'Initializing...'}</p>
                                    <hr/>
                                    <p><em>The bot is monitoring your repository and waiting for the backend functions to process code repairs.</em></p>
                                `
                            })
                        }).then(res => {
                            if (res.ok) console.log('📧 Email Report sent successfully');
                            else console.warn('❌ Failed to send email report');
                        });

                        // --- RUN SPECIALIST BOTS ---
                        console.log('\n--- 🤖 Launching Specialist Bots ---');

                        const botConfig = {
                            appId: APP_ID,
                            apiKey: API_KEY,
                            reportEmail: REPORT_EMAIL
                        };

                        await checkSecurty(botConfig);
                        await huntBugs(botConfig);
                        await optimizeSystem(botConfig);
                        await runGodMode(botConfig);
                        console.log('------------------------------------\n');
                    }
                }
            });
        } catch (e) {
            console.warn('Heartbeat failed:', e.message);
        }
    }

    // 2. Run Bot Logic (via Function)
    try {
        // Call autoFixCode function
        // Note: In a real deployment, you might need an Authorization header (Service Key)
        const response = await fetch(`${BASE_URL}/autoFixCode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cron-auth': 'true' // Simulating internal cron auth
            },
            body: JSON.stringify({
                report_email: REPORT_EMAIL,
                dry_run: false
            })
        });

        if (!response.ok) {
            // If 404, it might mean the function isn't being served at this exact URL or port.
            // If this is running against a local 'npm run dev', functions might be mocked or served via a specific route.
            // Assuming the user will deploy this, or we are simulating.
            throw new Error(`Bot API returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[${new Date().toISOString()}] Bot Cycle Completed.`);
        console.log('Logs:', result.logs);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Bot Cycle Failed:`, error.message);
        console.error('TIP: Ensure your backend functions server is running (e.g., Supabase, Deno, or a deployed URL).');
        console.error('     If running locally, you may need to install Deno and start the functions.');
        console.error('     Check VITE_BASE44_API_URL in .env.local');
    }

    // Schedule next run
    console.log(`Waiting ${(RUN_INTERVAL_MS / 1000 / 60).toFixed(1)} minutes...`);
    setTimeout(runBot, RUN_INTERVAL_MS);
}

// Start
console.log('--- AppForge Autonomous Mode ---');
console.log('Press Ctrl+C to stop.');
runBot();
