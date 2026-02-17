import { Base44Tool } from '../swarm/tools/base44.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
    console.log('🔌 Testing Base44 Connection...');
    console.log('   API Key Present:', !!process.env.BASE44_API_KEY);

    try {
        const base44 = new Base44Tool();
        console.log('   ✅ Tool Instantiated');

        // Try a simple list operation (or checking client existence)
        console.log('   Client initialized:', !!base44.client);

    } catch (error: any) {
        console.error('   ❌ Connection Failed:', error.message);
        process.exit(1);
    }
}

testConnection();
