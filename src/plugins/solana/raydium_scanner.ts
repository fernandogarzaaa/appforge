import { Connection, PublicKey } from '@solana/web3.js';

const RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';

export interface NewPoolEvent {
    signature: string;
    slot: number;
    timestamp: number;
}

export function startRaydiumScanner(onNewPool: (event: NewPoolEvent) => void) {
    // In a production environment, use a dedicated RPC URL with WSS support
    const endpoint = 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(endpoint, 'confirmed');
    const programId = new PublicKey(RAYDIUM_LIQUIDITY_PROGRAM_ID_V4.trim());

    console.log('🚨 Raydium Scout Engaged. Monitoring logs...');

    const subscriptionId = connection.onLogs(
        programId,
        (logs, ctx) => {
            if (logs.err) return;

            // Look for 'initialize2' which denotes a new pool creation in Raydium V4
            if (logs.logs.some(log => log.includes('initialize2'))) {
                const event: NewPoolEvent = {
                    signature: logs.signature,
                    slot: ctx.slot,
                    timestamp: Date.now()
                };
                onNewPool(event);
            }
        },
        'confirmed'
    );

    return () => {
        connection.removeOnLogsListener(subscriptionId);
    };
}
