import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MaintenanceGuard } from '../swarm/core/maintenance_guard.js';
import { promptHandler } from './prompt_handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const LOGS_DIR = path.join(process.cwd(), 'swarm/logs');
const DATA_DIR = path.join(process.cwd(), 'src/data');

// Telemetry State
const telemetry = {
    logs: [] as any[],
    swarmStatus: {} as any,
    maintenance: false
};

// Log Watchers
const logFiles = ['agents.log', 'hyper_v2.log', 'universal.log', 'whatsapp.log'];

logFiles.forEach(file => {
    const filePath = path.join(LOGS_DIR, file);
    if (fs.existsSync(filePath)) {
        // Initial read of last 50 lines
        const content = fs.readFileSync(filePath, 'utf8').split('\n').slice(-50);
        content.forEach(line => {
            if (line.trim()) {
                telemetry.logs.push({ source: file.split('.')[0], message: line, timestamp: new Date().toISOString() });
            }
        });

        // Watch for changes
        fs.watch(filePath, (event) => {
            if (event === 'change') {
                // In a real app we'd use a more efficient tail, but for now we'll just read the last line
                const newContent = fs.readFileSync(filePath, 'utf8').split('\n').pop();
                if (newContent?.trim()) {
                    const entry = { source: file.split('.')[0], message: newContent, timestamp: new Date().toISOString() };
                    telemetry.logs.push(entry);
                    if (telemetry.logs.length > 500) telemetry.logs.shift();
                    io.emit('log', entry);
                }
            }
        });
    }
});

// Swarm Status Polling
setInterval(async () => {
    try {
        const active = await MaintenanceGuard.isMaintenanceActive();
        if (active !== telemetry.maintenance) {
            telemetry.maintenance = active;
            io.emit('maintenance', active);
        }

        const statusPath = path.join(process.cwd(), 'swarm/swarm_status_log.json');
        if (fs.existsSync(statusPath)) {
            const status = JSON.parse(fs.readFileSync(statusPath, 'utf8')).pop();
            io.emit('status', status);
        }
    } catch (e) {
        // Silent error
    }
}, 2000);

io.on('connection', (socket) => {
    console.log('📡 [SCC] Admin Connected:', socket.id);

    // Send initial state
    socket.emit('init', {
        logs: telemetry.logs.slice(-100),
        maintenance: telemetry.maintenance
    });

    socket.on('command', async (cmd) => {
        console.log(`🕹️ [SCC] Command Received: ${cmd.action}`);
        if (cmd.action === 'MAINTENANCE_ON') {
            await MaintenanceGuard.activate();
            io.emit('maintenance', true);
        } else if (cmd.action === 'MAINTENANCE_OFF') {
            await MaintenanceGuard.deactivate();
            io.emit('maintenance', false);
        }
    });

    socket.on('prompt', async (data) => {
        const { text, id } = data;
        const reply = await promptHandler.handlePrompt(text);
        socket.emit('reply', { text: reply, id });
    });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 [SCC] Telemetry Server running on port ${PORT}`);
});
