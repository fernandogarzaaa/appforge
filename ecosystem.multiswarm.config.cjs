/**
 * PM2 Multi-Swarm Ecosystem Configuration
 * 
 * Deploy all swarms with their specific objectives:
 * - Main: Admin-controlled operations
 * - Finance: Revenue generation
 * - Crypto: Trading & blockchain analysis
 * - God: Self-evolution & coordination
 */

module.exports = {
    apps: [
        {
            name: 'appforge-swarm-main',
            script: './swarm/core/loop.ts',
            interpreter: 'node',
            interpreter_args: '--import tsx',
            env: {
                NODE_ENV: 'production',
                SWARM_MODE: 'main',
                SWARM_OBJECTIVE: 'Default admin-controlled operations',
                SWARM_COLOR: '🟢'
            }
        },
        {
            name: 'appforge-swarm-finance',
            script: './swarm/core/loop.ts',
            interpreter: 'node',
            interpreter_args: '--import tsx',
            env: {
                NODE_ENV: 'production',
                SWARM_MODE: 'finance',
                SWARM_OBJECTIVE: 'Revenue generation and financial optimization',
                SWARM_COLOR: '💰',
                AUTONOMOUS_CYCLE_MINUTES: 1 // Run revenue cycle every minute
            }
        },
        {
            name: 'appforge-swarm-crypto',
            script: './swarm/core/loop.ts',
            interpreter: 'node',
            interpreter_args: '--import tsx',
            env: {
                NODE_ENV: 'production',
                SWARM_MODE: 'crypto',
                SWARM_OBJECTIVE: 'Cryptocurrency trading and blockchain analysis',
                SWARM_COLOR: '🪙'
            }
        },
        {
            name: 'appforge-swarm-god',
            script: './swarm/core/loop.ts',
            interpreter: 'node',
            interpreter_args: '--import tsx',
            env: {
                NODE_ENV: 'production',
                SWARM_MODE: 'god',
                SWARM_OBJECTIVE: 'Self-evolution and swarm coordination',
                SWARM_COLOR: '🌌'
            }
        },
        {
            name: 'appforge-payment-monitor',
            script: './scripts/monitor_payments.js',
            interpreter: 'node',
            cron_restart: '*/5 * * * *', // Run every 5 minutes
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
