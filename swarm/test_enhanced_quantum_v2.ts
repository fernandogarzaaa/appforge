/**
 * 🧪 REAL TEST: Enhanced Quantum Engine v2.0
 * Tests all components with REAL data
 */

import { EnhancedQuantumEngine } from './core/enhanced_quantum_engine_v2.js';

async function httpsGet(url: string): Promise<any> {
    const https = require('https');
    return new Promise((resolve) => {
        https.get(url, (res: any) => {
            let data = '';
            res.on('data', (chunk: string) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } 
                catch { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

async function runRealTests(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('    🧪 ENHANCED QUANTUM ENGINE v2.0 - REAL TESTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const engine = new EnhancedQuantumEngine();
    const cryptoData = await httpsGet('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum
