
import fs from 'fs';
import path from 'path';

const MEMORY_FILE = 'bot_memory.json';

// Ensure memory file exists
function initMemory() {
    if (!fs.existsSync(MEMORY_FILE)) {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify({ signals: [] }, null, 2));
    }
}

export function writeSignal(source, type, priority, data) {
    initMemory();
    const memory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));

    // Deduplicate: Don't add if same type/source exists and is pending
    const exists = memory.signals.some(s => s.source === source && s.type === type && s.status === 'PENDING');
    if (!exists) {
        memory.signals.push({
            id: Date.now().toString(),
            source,
            type,
            priority, // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
            data,
            status: 'PENDING',
            created_at: new Date().toISOString()
        });
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
        console.log(`🧠 Swarm Memory: Signal received from ${source} [${type}]`);
    }
}

export function readPendingSignals() {
    initMemory();
    const memory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    return memory.signals.filter(s => s.status === 'PENDING');
}

export function markSignalComplete(id, resolution) {
    initMemory();
    const memory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    const signal = memory.signals.find(s => s.id === id);
    if (signal) {
        signal.status = 'COMPLETED';
        signal.resolution = resolution;
        signal.completed_at = new Date().toISOString();
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
    }
}
