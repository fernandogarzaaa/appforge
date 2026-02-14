/**
 * SafetyGuard - Centralized Financial Validation Layer
 * 
 * Enforces risk limits, stop-losses, and authorization checks
 * for all autonomous financial transactions within the Swarm.
 */

import fs from 'fs';
import path from 'path';

interface SafetyLimits {
    maxDailySpend: number;      // Maximum USDC spend per 24h
    maxTransactionValue: number; // Maximum single transaction value
    stopLossThreshold: number;   // Cumulative loss % before shutdown
    authorizedWallets: string[]; // List of allowed destination addresses
}

export class SafetyGuard {
    private limits: SafetyLimits;
    private stateFile: string;
    private state: {
        dailySpend: Record<string, number>;
        lastReset: string;
        cumulativeLoss: number;
    };

    constructor() {
        this.stateFile = path.join(process.cwd(), 'swarm', 'data', 'safety_state.json');

        // Default conservative limits
        this.limits = {
            maxDailySpend: 1000,
            maxTransactionValue: 100,
            stopLossThreshold: 0.15, // 15% loss limit
            authorizedWallets: (process.env.AUTHORIZED_TREASURY_WALLETS || '').split(',')
        };

        this.state = this.loadState();
        this.checkReset();
    }

    /**
     * Validate a proposed transaction
     */
    public validateTransaction(
        amount: number,
        currency: string,
        destination: string
    ): { authorized: boolean; reason?: string } {

        // 1. Authorization Check
        if (!this.limits.authorizedWallets.includes(destination)) {
            return { authorized: false, reason: 'UNAUTHORIZED_DESTINATION_WALLET' };
        }

        // 2. Transaction Size Check
        if (amount > this.limits.maxTransactionValue) {
            return { authorized: false, reason: 'TRANSACTION_VALUE_EXCEEDS_LIMIT' };
        }

        // 3. Daily Velocity Check
        const currentDaily = this.state.dailySpend[this.today()] || 0;
        if (currentDaily + amount > this.limits.maxDailySpend) {
            return { authorized: false, reason: 'DAILY_SPEND_LIMIT_REACHED' };
        }

        // 4. Stop-Loss Check
        if (this.state.cumulativeLoss > this.limits.stopLossThreshold) {
            return { authorized: false, reason: 'GLOBAL_STOP_LOSS_ACTIVATED' };
        }

        return { authorized: true };
    }

    /**
     * Record a successful spend
     */
    public recordSpend(amount: number): void {
        const date = this.today();
        this.state.dailySpend[date] = (this.state.dailySpend[date] || 0) + amount;
        this.saveState();
    }

    private today(): string {
        return new Date().toISOString().split('T')[0];
    }

    private loadState() {
        if (fs.existsSync(this.stateFile)) {
            return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        }
        return { dailySpend: {}, lastReset: this.today(), cumulativeLoss: 0 };
    }

    private saveState() {
        fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    }

    private checkReset() {
        if (this.state.lastReset !== this.today()) {
            this.state.dailySpend = {};
            this.state.lastReset = this.today();
            this.saveState();
        }
    }
}

export const safetyGuard = new SafetyGuard();
