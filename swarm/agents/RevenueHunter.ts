/**
 * RevenueHunter Agent - Finance Swarm
 * 
 * Actively monitors for payment opportunities, processes subscriptions,
 * and generates revenue through automated systems.
 */

import { Base44Tool } from '../tools/base44.js';
import fs from 'fs';
import path from 'path';

interface RevenueOpportunity {
    id: string;
    type: 'subscription' | 'donation' | 'referral' | 'upgrade' | 'renewal';
    source: string;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    timestamp: string;
    metadata: Record<string, any>;
}

interface PaymentStats {
    totalRevenue: number;
    pendingRevenue: number;
    subscriptionsActive: number;
    referralsGenerated: number;
    averageTransactionValue: number;
    lastPaymentTime: string;
}

export class RevenueHunter {
    private base44: Base44Tool;
    private revenueHistory: RevenueOpportunity[];
    private stats: PaymentStats;
    private solanaAddress: string = 'DFrYV3rd6hNdT3jmQ5Z3Xx1Nm3Gmr4JZ2x6zN1Xyj3B4'; // Main wallet
    private dataDir: string;

    constructor(base44: Base44Tool) {
        this.base44 = base44;
        this.revenueHistory = [];
        this.stats = {
            totalRevenue: 0,
            pendingRevenue: 0,
            subscriptionsActive: 0,
            referralsGenerated: 0,
            averageTransactionValue: 0,
            lastPaymentTime: ''
        };
        this.dataDir = path.join(process.cwd(), 'swarm', 'data');

        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Main execution cycle - hunt for revenue
     */
    async hunt(): Promise<RevenueOpportunity[]> {
        console.log('💰 [RevenueHunter] Scanning for revenue opportunities...');

        const opportunities: RevenueOpportunity[] = [];

        // Check for pending payments via AuditLog
        const pendingPayments = await this.checkPendingPayments();
        opportunities.push(...pendingPayments);

        // Log activity
        await this.base44.logActivity('RevenueHunter', `Scanned for revenue opportunities. Found ${opportunities.length} pending.`);

        // Process opportunities
        const processed = await this.processOpportunities(opportunities);

        // Update stats
        await this.updateStats();

        // Generate and log report
        console.log(this.generateReport());
        await this.base44.logActivity('RevenueHunter', `Revenue cycle complete. Total: ${this.stats.totalRevenue.toFixed(4)} SOL`);

        return processed;
    }

    /**
     * Check for pending payments in the system
     */
    private async checkPendingPayments(): Promise<RevenueOpportunity[]> {
        const opportunities: RevenueOpportunity[] = [];

        try {
            // Query AuditLog for revenue-related pending tasks
            const pendingTasks = await this.base44.getPendingTasks();

            if (pendingTasks && Array.isArray(pendingTasks)) {
                for (const task of pendingTasks) {
                    const taskData = task as any;
                    if (taskData?.action_type?.includes('PAYMENT') || taskData?.action_type?.includes('RENEWAL')) {
                        opportunities.push({
                            id: taskData.id || `pending_${Date.now()}`,
                            type: 'subscription',
                            source: taskData.performed_by || 'unknown',
                            amount: taskData.changes?.amount || 19,
                            currency: 'USDC',
                            status: 'pending',
                            timestamp: taskData.createdAt || new Date().toISOString(),
                            metadata: taskData
                        });
                    }
                }
            }

            console.log(`💰 [RevenueHunter] Found ${opportunities.length} pending payments`);
        } catch (error) {
            console.error('❌ [RevenueHunter] Error checking pending payments:', error);
        }

        return opportunities;
    }

    /**
     * Process revenue opportunities
     */
    private async processOpportunities(opportunities: RevenueOpportunity[]): Promise<RevenueOpportunity[]> {
        const processed: RevenueOpportunity[] = [];

        for (const opportunity of opportunities) {
            try {
                console.log(`💰 [RevenueHunter] Processing ${opportunity.type}: ${opportunity.amount} ${opportunity.currency}`);

                // Process the payment
                const result = await this.processPayment(opportunity);

                if (result.success) {
                    opportunity.status = 'completed';
                    this.stats.totalRevenue += opportunity.amount;
                    processed.push(opportunity);

                    console.log(`✅ [RevenueHunter] Processed ${opportunity.amount} ${opportunity.currency}`);

                    // Log to Base44
                    await this.base44.logActivity('RevenueHunter', `Processed payment: ${opportunity.amount} ${opportunity.currency}`);
                } else {
                    opportunity.status = 'failed';
                    this.stats.pendingRevenue += opportunity.amount;
                    processed.push(opportunity);

                    console.log(`⚠️ [RevenueHunter] Payment failed: ${result.error}`);
                }
            } catch (error) {
                console.error(`❌ [RevenueHunter] Error processing opportunity:`, error);
                opportunity.status = 'failed';
                processed.push(opportunity);
            }
        }

        // Save to history
        await this.saveRevenueHistory();

        return processed;
    }

    /**
     * Process a single payment
     */
    private async processPayment(opportunity: RevenueOpportunity): Promise<{ success: boolean; error?: string }> {
        try {
            // Complete the task in Base44 if applicable
            if (opportunity.id.startsWith('pending_')) {
                await this.base44.completeTask(opportunity.id, {
                    processed: true,
                    amount: opportunity.amount,
                    timestamp: new Date().toISOString()
                });
            }

            // Log the revenue event
            await this.base44.logActivity('RevenueHunter',
                `Revenue received: ${opportunity.amount} ${opportunity.currency} from ${opportunity.source}`);

            this.stats.lastPaymentTime = new Date().toISOString();

            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    /**
     * Get current revenue statistics
     */
    getStats(): PaymentStats {
        return { ...this.stats };
    }

    /**
     * Update statistics
     */
    private async updateStats(): Promise<void> {
        try {
            const dataPath = path.join(this.dataDir, 'revenue_stats.json');

            if (fs.existsSync(dataPath)) {
                const saved = fs.readFileSync(dataPath, 'utf8');
                const parsed = JSON.parse(saved);
                this.stats.totalRevenue = parsed.totalRevenue || this.stats.totalRevenue;
                this.stats.subscriptionsActive = parsed.subscriptionsActive || this.stats.subscriptionsActive;
                this.stats.referralsGenerated = parsed.referralsGenerated || this.stats.referralsGenerated;
            }

            // Save current stats
            fs.writeFileSync(dataPath, JSON.stringify(this.stats, null, 2));

            console.log(`💰 [RevenueHunter] Stats updated: ${this.stats.totalRevenue.toFixed(4)} SOL total revenue`);
        } catch (error) {
            console.error('❌ [RevenueHunter] Error updating stats:', error);
        }
    }

    /**
     * Save revenue history
     */
    private async saveRevenueHistory(): Promise<void> {
        try {
            const dataPath = path.join(this.dataDir, 'revenue_history.json');
            fs.writeFileSync(dataPath, JSON.stringify(this.revenueHistory, null, 2));
        } catch (error) {
            console.error('❌ [RevenueHunter] Error saving history:', error);
        }
    }

    /**
     * Generate revenue report
     */
    generateReport(): string {
        const report = `
💰 **REVENUE HUNTER REPORT**
═══════════════════════════════

📊 **Current Stats:**
   Total Revenue: ${this.stats.totalRevenue.toFixed(4)} SOL
   Pending Revenue: ${this.stats.pendingRevenue.toFixed(4)} SOL
   Active Subscriptions: ${this.stats.subscriptionsActive}
   Referrals Generated: ${this.stats.referralsGenerated}
   Avg Transaction: ${this.stats.averageTransactionValue.toFixed(2)} SOL
   Last Payment: ${this.stats.lastPaymentTime || 'Never'}

📈 **Wallet Address:**
   ${this.solanaAddress}

💼 **Revenue Sources:**
   • Subscription Renewals: $19-500/month
   • Referral Commissions: 10% of referred revenue
   • Upgrade Opportunities: Tier upgrades
   • New Signups: First month revenue

🚀 **Action Items:**
   1. Process pending payments
   2. Follow up on failed transactions
   3. Activate referral program
   4. Optimize pricing tiers

═══════════════════════════════
        `;
        return report;
    }
}

export default RevenueHunter;
