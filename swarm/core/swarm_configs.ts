/**
 * PM2 Ecosystem Configurations for Multi-Swarm Architecture
 * 
 * This file defines the ecosystem configurations for deploying
 * multiple swarms with different objectives.
 */

const SWARM_CONFIGS = {
    main: {
        name: 'appforge-swarm-main',
        script: './swarm/core/loop.ts',
        args: '--mode main',
        interpreter: 'node',
        interpreter_args: '--import tsx',
        env: {
            SWARM_MODE: 'main',
            SWARM_OBJECTIVE: 'Make money in reality no simulation'
        }
    },
    finance: {
        name: 'appforge-swarm-finance',
        script: './swarm/core/loop.ts',
        args: '--mode finance',
        interpreter: 'node',
        interpreter_args: '--import tsx',
        env: {
            SWARM_MODE: 'finance',
            SWARM_OBJECTIVE: 'Make money in reality no simulation'
        }
    },
    crypto: {
        name: 'appforge-swarm-crypto',
        script: './swarm/core/loop.ts',
        args: '--mode crypto',
        interpreter: 'node',
        interpreter_args: '--import tsx',
        env: {
            SWARM_MODE: 'crypto',
            SWARM_OBJECTIVE: 'Make money in reality no simulation'
        }
    },
    god: {
        name: 'appforge-swarm-god',
        script: './swarm/core/loop.ts',
        args: '--mode god',
        interpreter: 'node',
        interpreter_args: '--import tsx',
        env: {
            SWARM_MODE: 'god',
            SWARM_OBJECTIVE: 'Self-evolution and swarm coordination'
        }
    }
};

export const ecosystemConfig = {
    apps: Object.values(SWARM_CONFIGS)
};

export const swarmCommands = {
    startAll: 'pm2 start ecosystem.multiswarm.config.cjs',
    startMain: 'pm2 start ecosystem.multiswarm.config.cjs --only appforge-swarm-main',
    startFinance: 'pm2 start ecosystem.multiswarm.config.cjs --only appforge-swarm-finance',
    startCrypto: 'pm2 start ecosystem.multiswarm.config.cjs --only appforge-swarm-crypto',
    startGod: 'pm2 start ecosystem.multiswarm.config.cjs --only appforge-swarm-god',
    stopAll: 'pm2 stop all',
    restartAll: 'pm2 restart all',
    logsAll: 'pm2 logs --raw',
    statusAll: 'pm2 list'
};

export default SWARM_CONFIGS;
