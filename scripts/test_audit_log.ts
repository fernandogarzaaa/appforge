import { Base44Tool } from '../swarm/tools/base44.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testAuditLog() {
    console.log('📡 Testing Base44 AuditLog Creation...');
    const base44 = new Base44Tool();

    try {
        await base44.logActivity('CuriosityTest', 'Testing API Key Connectivity');
        console.log('✅ AuditLog Created Successfully! API Key is VALID.');
    } catch (error: any) {
        console.error('❌ AuditLog Creation Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

testAuditLog();
