import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const APP_ID = process.env.VITE_BASE44_APP_ID || process.env.BASE44_APP_ID;
const API_KEY = process.env.BASE44_API_KEY;
const API_URL = process.env.BASE44_API_URL || 'https://appforge.fun/api';

async function pushSchema() {
    console.log(`🚀 Pushing 'Task' Entity Schema to App: ${APP_ID}`);

    if (!APP_ID || !API_KEY) {
        console.error('❌ Missing APP_ID or BASE44_API_KEY');
        process.exit(1);
    }

    try {
        const schemaPath = path.resolve(process.cwd(), 'base44/entities/Task.json');
        if (!fs.existsSync(schemaPath)) {
            throw new Error('Task.json not found in base44/entities');
        }

        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
        console.log('   📄 Loaded Schema:', schema.name);

        // Try to create the entity (Schema definition)
        // Endpoint guess: POST /apps/:appId/entities
        const url = `${API_URL}/apps/${APP_ID}/entities`;

        console.log(`   📡 POST ${url}`);

        const response = await axios.post(url, schema, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'X-Base44-Api-Key': API_KEY // Try both common headers
            }
        });

        console.log('   ✅ Schema Pushed Successfully!');
        console.log('   🆔 Entity ID:', response.data.id);

    } catch (error: any) {
        console.error('   ❌ Push Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

pushSchema();
