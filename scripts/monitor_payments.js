#!/usr/bin/env node
/**
 * Payment Monitor - Finance Swarm Revenue System
 * 
 * Actively monitors for incoming payments and generates revenue opportunities.
 * Run this script to check for new payments and process them.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@base44/sdk';
import fs from 'fs';
import path from 'path';

const SOLANA_WALLET = 'DFrYV3rd6hNdT3jmQ5Z3Xx1Nm3Gmr4JZ2x6zN1Xyj3B4';

async function monitorPayments() {
    console.log('💰 [PaymentMonitor] Starting payment monitoring...');
    
    const apiKey = process.env.BASE44_API_KEY;
    const appId = process.env.BASE44_APP_ID;
    
    if (!apiKey) {
        console.error('❌ [PaymentMonitor] BASE44_API_KEY not found');
        return;
    }

    const client = createClient({
        key: apiKey,
        appId: appId,
        serverUrl: 'https://appforge.fun'
    });

    // Monitor incoming payments
    try {
        // Check AuditLog for recent payment activity
        const logs = await client.entities.AuditLog.list({
            filter: {
                action_type: { contains: 'PAYMENT' }
            },
            sort: { createdAt: 'desc' },
            limit: 10
        });

        console.log(`📊 [PaymentMonitor] Found ${logs?.items?.length || 0} recent payment logs`);

        // Create revenue opportunity for each payment
        for (const log of logs?.items || []) {
            if (log.action_type.includes('PAYMENT') && log.changes?.status === 'PENDING') {
                console.log(`💰 [PaymentMonitor] Payment pending: ${JSON.stringify(log)}`);
                
                // Create a SWARM_SIGNAL for processing
                await client.entities.AuditLog.create({
                    action_type: 'SWARM_SIGNAL',
                    description: `RevenueHunter: Process payment from ${log.changes?.source || 'unknown'}`,
                    resource_type: 'payment_processing',
                    performed_by: 'RevenueHunter',
                    changes: {
                        status: 'PENDING',
                        type: 'subscription',
                        amount: log.changes?.amount || 19,
                        currency: 'USDC',
                        source: log.changes?.source || log.performed_by,
                        metadata: log
                    }
                });

                console.log(`✅ [PaymentMonitor] Created revenue task for processing`);
            }
        }

        // Generate revenue report
        const stats = {
            lastCheck: new Date().toISOString(),
            walletAddress: SOLANA_WALLET,
            paymentsProcessed: logs?.items?.length || 0,
            pendingTasks: 1
        };

        // Save stats
        const dataDir = path.join(process.cwd(), 'swarm', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(path.join(dataDir, 'payment_monitor_stats.json'), JSON.stringify(stats, null, 2));

        console.log(`
💰 **PAYMENT MONITOR REPORT**
═══════════════════════════════
📈 Wallet: ${SOLANA_WALLET}
📊 Payments Detected: ${stats.paymentsProcessed}
🕐 Last Check: ${stats.lastCheck}
✅ Status: Monitoring Active

Next Steps:
1. Await user payments to wallet
2. Process pending transactions
3. Generate recurring revenue

═══════════════════════════════
        `);

    } catch (error) {
        console.error('❌ [PaymentMonitor] Error:', error.message);
    }
}

// Run if called directly
monitorPayments().catch(console.error);

export default monitorPayments;
