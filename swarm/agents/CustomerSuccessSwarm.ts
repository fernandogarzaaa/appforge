/**
 * CustomerSuccessSwarm - Churn prevention and expansion automation.
 */

import * as fs from 'fs/promises';
import path from 'path';
import { QuantumSwarmCore } from '../core/quantum_core.js';
import { memory } from '../core/persistent_memory.js';
import { swarmCollaboration } from '../core/swarm_collaboration.js';

type Tier = 'free' | 'pro' | 'enterprise';

interface CustomerAccount {
    id: string;
    tier: Tier;
    monthlyRevenue: number;
    usageScore: number;
    nps: number;
    ticketVolume: number;
    lastActiveDays: number;
}

interface AccountDecision {
    accountId: string;
    churnRisk: number;
    action: 'retain_call' | 'inapp_nudge' | 'upsell' | 'onboarding_boost';
    recommendation: string;
    confidence: number;
}

interface CustomerSuccessReport {
    timestamp: string;
    accountsProcessed: number;
    highRiskAccounts: number;
    upsellTargets: number;
    retentionActions: number;
    decisions: AccountDecision[];
}

export class CustomerSuccessSwarm {
    private quantumCore: QuantumSwarmCore;
    private reportPath: string;
    private latestReport: CustomerSuccessReport | null;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
        this.reportPath = path.join(process.cwd(), 'swarm', 'data', 'customer_success_swarm_report.json');
        this.latestReport = null;
    }

    async runCycle(): Promise<CustomerSuccessReport> {
        console.log('🤝 [CustomerSuccessSwarm] Starting churn and expansion cycle...');

        const accounts = this.loadAccounts();
        const decisions: AccountDecision[] = [];

        let highRiskAccounts = 0;
        let upsellTargets = 0;
        let retentionActions = 0;

        for (const account of accounts) {
            const decision = await this.decideAction(account);
            decisions.push(decision);

            if (decision.churnRisk >= 0.65) highRiskAccounts++;
            if (decision.action === 'upsell') upsellTargets++;
            if (decision.action === 'retain_call' || decision.action === 'inapp_nudge') retentionActions++;

            await memory.learn('CustomerSuccessSwarm', `tier:${account.tier}`, true, 5);

            if (decision.action === 'upsell') {
                await swarmCollaboration.sendSignal({
                    fromAgent: 'CustomerSuccessSwarm',
                    toAgent: 'SalesBot',
                    type: 'FINDING',
                    payload: {
                        type: 'CUSTOMER_EXPANSION_LEAD',
                        accountId: account.id,
                        tier: account.tier,
                        monthlyRevenue: account.monthlyRevenue
                    },
                    priority: 'HIGH'
                });
            }

            if (decision.action === 'retain_call' && decision.churnRisk >= 0.7) {
                await swarmCollaboration.sendSignal({
                    fromAgent: 'CustomerSuccessSwarm',
                    toAgent: 'ReferralManager',
                    type: 'FINDING',
                    payload: {
                        type: 'RETENTION_INTERVENTION',
                        accountId: account.id,
                        churnRisk: decision.churnRisk
                    },
                    priority: 'MEDIUM'
                });
            }
        }

        const report: CustomerSuccessReport = {
            timestamp: new Date().toISOString(),
            accountsProcessed: accounts.length,
            highRiskAccounts,
            upsellTargets,
            retentionActions,
            decisions
        };

        await this.persistReport(report);
        await memory.set('customer_success_swarm:last_report', report, 60 * 60 * 24 * 7);

        this.latestReport = report;
        console.log(
            `✅ [CustomerSuccessSwarm] Cycle complete | Accounts: ${accounts.length}, High Risk: ${highRiskAccounts}, Upsells: ${upsellTargets}`
        );

        return report;
    }

    getLatestReport(): CustomerSuccessReport | null {
        return this.latestReport;
    }

    private loadAccounts(): CustomerAccount[] {
        return [
            { id: 'acct_001', tier: 'enterprise', monthlyRevenue: 3200, usageScore: 0.48, nps: 4, ticketVolume: 9, lastActiveDays: 5 },
            { id: 'acct_002', tier: 'pro', monthlyRevenue: 399, usageScore: 0.81, nps: 9, ticketVolume: 2, lastActiveDays: 1 },
            { id: 'acct_003', tier: 'pro', monthlyRevenue: 249, usageScore: 0.39, nps: 5, ticketVolume: 7, lastActiveDays: 8 },
            { id: 'acct_004', tier: 'free', monthlyRevenue: 0, usageScore: 0.67, nps: 8, ticketVolume: 1, lastActiveDays: 2 }
        ];
    }

    private async decideAction(account: CustomerAccount): Promise<AccountDecision> {
        const churnRisk = this.estimateChurnRisk(account);
        const decision = await this.quantumCore.consultOracle(
            `Customer account health: tier=${account.tier}, mrr=${account.monthlyRevenue}, usage=${account.usageScore.toFixed(2)}, nps=${account.nps}, tickets=${account.ticketVolume}, inactiveDays=${account.lastActiveDays}, churnRisk=${churnRisk.toFixed(2)}.`,
            [
                'RETAIN_CALL with proactive success manager outreach',
                'INAPP_NUDGE with guided adoption checklist and health tips',
                'UPSELL with higher-tier value pitch and ROI framing',
                'ONBOARDING_BOOST with feature walkthrough and activation milestones'
            ],
            ['churn_reduction', 'expansion_revenue', 'customer_experience', 'execution_speed']
        );

        await this.quantumCore.reportOutcome(decision.predictionId, true, {
            source: 'customer_success_swarm_decision',
            tier: account.tier,
            churnRisk
        });

        const recommendation = decision.recommendation.toUpperCase();
        const action = recommendation.startsWith('RETAIN_CALL')
            ? 'retain_call'
            : recommendation.startsWith('INAPP_NUDGE')
                ? 'inapp_nudge'
                : recommendation.startsWith('UPSELL')
                    ? 'upsell'
                    : 'onboarding_boost';

        return {
            accountId: account.id,
            churnRisk,
            action,
            recommendation: decision.recommendation,
            confidence: decision.confidence
        };
    }

    private estimateChurnRisk(account: CustomerAccount): number {
        const usageRisk = 1 - account.usageScore;
        const npsRisk = (10 - account.nps) / 10;
        const inactivityRisk = Math.min(account.lastActiveDays / 14, 1);
        const supportRisk = Math.min(account.ticketVolume / 10, 1);
        const raw = (usageRisk * 0.35) + (npsRisk * 0.25) + (inactivityRisk * 0.25) + (supportRisk * 0.15);
        return Math.max(0, Math.min(1, Number(raw.toFixed(3))));
    }

    private async persistReport(report: CustomerSuccessReport): Promise<void> {
        await fs.mkdir(path.dirname(this.reportPath), { recursive: true });
        await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2), 'utf8');
    }
}

