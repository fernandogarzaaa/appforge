import express from 'express';
import cors from 'cors';
import { EventEmitter } from 'events';
import { runSwarmTask } from './swarm/orchestrator.js';
import { runFactory } from './swarm/factory.js';
import { swarmComms, SwarmEvent } from './swarm/comms.js';
import { startRaydiumScanner } from './utils/raydium_scanner.js';

const app = express();
app.use(cors());
app.use(express.json());

export const logBus = new EventEmitter();

// --- SECURITY BRIDGE (Phase 18) ---
const API_KEY = process.env.VITE_BASE44_API_KEY || 'appforge_local_dev_key';

const secureAPI = (req: any, res: any, next: any) => {
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid AppForge Bridge Key' });
    }
    next();
};

export const broadcastLog = (agent: string, msg: string, severity: string) => {
    logBus.emit('log', { timestamp: new Date(), agent, msg, severity });
};

// --- SWARM CROSS-TALK (Phase 12) ---
swarmComms.subscribe(SwarmEvent.SIGNAL_DETECTED, (payload) => {
    broadcastLog('COMMS', `Cross-Talk: Signal Detected! Triggering Factory Build.`, 'SUCCESS');
    runFactory(); // Autonomous mass-production trigger
});

// Start Backend Scout for Autonomous Intelligence
startRaydiumScanner((event) => {
    swarmComms.publish(SwarmEvent.SIGNAL_DETECTED, event);
});

// --- API ENDPOINTS ---
app.get('/api/stream-logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const listener = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    logBus.on('log', listener);
    req.on('close', () => logBus.off('log', listener));
});

app.post('/api/command', secureAPI, async (req, res) => {
    const { task } = req.body;
    runSwarmTask(task).catch(() => { }); // Fire and forget with safety
    res.json({ status: 'Swarm Activated' });
});

app.post('/api/factory/start', secureAPI, async (req, res) => {
    runFactory();
    res.json({ status: 'Factory Started' });
});

app.listen(3001, () => console.log("🚀 ORCHESTRATOR ONLINE: Port 3001"));
