import { createClient } from '@base44/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.BASE44_API_KEY;
const appId = process.env.VITE_BASE44_APP_ID;

if (!apiKey) {
    console.error('Missing BASE44_API_KEY');
    process.exit(1);
}

const client = createClient({
    token: apiKey,
    appId: appId,
    serverUrl: process.env.BASE44_API_URL || 'https://appforge.fun'
} as any);

console.log('--- Inspector Gadget ---');
console.log('Client Keys:', Object.keys(client));
if (client.entities) console.log('Client.entities Keys:', Object.keys(client.entities));
if (client.apps) console.log('Client.apps Keys:', Object.keys(client.apps));
// Check for schema/model related methods
console.log('Full Client:', client);
