import express from 'express';
import cors from 'cors';
import { EventEmitter } from 'events';
import { runSwarmTask } from './swarm/orchestrator';

const app = express();
app.use(cors());
app.use(express.json());

export const logBus = new EventEmitter();
export const broadcastLog = (agent: string, msg: string, severity: string) => {
    logBus.emit('log', { timestamp: new Date(), agent, msg, severity });
};

// Stream logs to SovereignIDE.jsx
app.get('/api/stream-logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const listener = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    logBus.on('log', listener);
    req.on('close', () => logBus.off('log', listener));
});

// Command Endpoint
app.post('/api/command', async (req, res) => {
    const { task } = req.body;
    runSwarmTask(task); // Async execution
    res.json({ status: 'Swarm Activated' });
});

app.listen(3001, () => console.log("🚀 ORCHESTRATOR ONLINE: Port 3001"));
