import { EventEmitter } from 'events';

export const logBus = new EventEmitter();

export const broadcastLog = (agent: string, msg: string, severity: string) => {
    const isSilent = process.env.SILENT_MODE === 'true';
    if (isSilent && (severity === 'SUCCESS' || severity === 'INFO')) return;

    // Log to console for observability
    const color = severity === 'CRITICAL' ? '\x1b[31m' :
        severity === 'WARN' ? '\x1b[33m' :
            severity === 'SUCCESS' ? '\x1b[32m' : '\x1b[36m';
    const reset = '\x1b[0m';

    console.log(`${color}[${agent}]${reset} ${msg}`);

    logBus.emit('log', { timestamp: new Date(), agent, msg, severity });
};
