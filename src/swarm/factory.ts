import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSwarmTask } from './orchestrator.js';
import { broadcastLog } from '../server.js';
import { swarmComms, SwarmEvent } from './comms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsPath = path.join(__dirname, 'products.json');
const PRODUCTS = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

export async function runFactory() {
    broadcastLog('FACTORY', '🏭 FACTORY MODE ENGAGED. Scanning for profitable assets...', 'INFO');
    swarmComms.publish(SwarmEvent.FACTORY_START, { productCount: PRODUCTS.length });

    for (const product of PRODUCTS) {
        broadcastLog('FACTORY', `Constructing Asset: ${product.name}...`, 'INFO');

        const task = `Create a standalone React component 'src/components/${product.filename}'. 
    It must fulfill this requirement: ${product.description}. 
    IMPORTANT: It must perform the action securely.`;

        try {
            await runSwarmTask(task);
            broadcastLog('FACTORY', `✅ Asset Built: ${product.name}`, 'SUCCESS');
        } catch (error: any) {
            broadcastLog('FACTORY', `❌ Failed to build ${product.name}: ${error.message}`, 'CRITICAL');
        }
    }

    broadcastLog('FACTORY', '🎉 BATCH COMPLETE. Assets ready for deployment.', 'SUCCESS');
}

// Support for direct execution if needed
if (process.argv[1] === __filename) {
    runFactory();
}
