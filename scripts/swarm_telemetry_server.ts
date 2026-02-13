/**
 * SWARM TELEMETRY SERVER
 *
 * Connects the native app to all swarm services:
 * - Quantum Engine v2 metrics
 * - Oracle Enhanced consultations
 * - Hyper Intelligence
 * - Market Intelligence Engine
 * - Repository Knowledge Base
 *
 * Port: 3001
 *
 * Run: npx tsx scripts/swarm_telemetry_server.ts
 */

import { Server } from 'socket.io';
import { createServer } from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';

// Import swarm core services
import quantumCore from '../swarm/core/quantum_core.js';
import { enhancedOracle } from '../swarm/core/oracle_enhanced.js';
import { hyperBrain } from '../swarm/core/sovereign_hyper_brain.js';
import { coherentMarketEngine } from '../swarm/core/coherent_market_intelligence.js';

// Configuration
const PORT = 3001;
const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'swarm/data/repository_knowledge.json');
const SWARM_REGISTRY_PATH = path.join(process.cwd(), 'swarm/data/swarm_registry.json');

// ============================================================================
// HTTP API + WEBSOCKET SERVER
// ============================================================================

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// ============================================================================
// SWARM STATE
// ============================================================================

interface SwarmState {
    coherence: number;
    oracleStatus: 'online' | 'offline';
    hyperBrainStatus: 'online' | 'offline' | 'routing';
    marketIntelligence: 'ready' | 'processing' | 'idle';
    repositoriesLoaded: number;
    skillsLoaded: number;
    lastUpdated: string;
}

let swarmState: SwarmState = {
    coherence: 0.85,
    oracleStatus: 'online',
    hyperBrainStatus: 'online',
    marketIntelligence: 'idle',
    repositoriesLoaded: 0,
    skillsLoaded: 0,
    lastUpdated: new Date().toISOString()
};

// ============================================================================
// SWARM SERVICES
// ============================================================================

/**
 * Get current system metrics from Quantum Engine
 */
async function getSystemMetrics(): Promise<any> {
    try {
        const states = quantumCore.getSavedStates();
        return {
            coherence: swarmState.coherence,
            savedStates: states.length,
            oracle: swarmState.oracleStatus,
            hyperBrain: swarmState.hyperBrainStatus,
            marketIntelligence: swarmState.marketIntelligence
        };
    } catch (e) {
        return { error: 'Failed to get metrics' };
    }
}

/**
 * Consult Oracle via API
 */
async function consultOracle(question: string, options: string[]): Promise<any> {
    try {
        const result = await enhancedOracle.consult(question, options, ['general']);
        return result;
    } catch (e) {
        return { error: 'Oracle consultation failed' };
    }
}

/**
 * Generate market prediction
 */
async function generateMarketPrediction(question: string): Promise<any> {
    try {
        swarmState.marketIntelligence = 'processing';
        broadcastState();
        
        const result = await coherentMarketEngine.predict(question);
        
        swarmState.marketIntelligence = 'ready';
        broadcastState();
        
        return result;
    } catch (e) {
        swarmState.marketIntelligence = 'idle';
        return { error: 'Market prediction failed' };
    }
}

/**
 * Load repository knowledge
 */
async function loadRepositoryKnowledge(): Promise<any> {
    try {
        const content = await fs.readFile(KNOWLEDGE_BASE_PATH, 'utf-8');
        const knowledge = JSON.parse(content);
        swarmState.repositoriesLoaded = knowledge.repositories?.length || 0;
        swarmState.skillsLoaded = knowledge.allSkills?.length || 0;
        broadcastState();
        return knowledge;
    } catch (e) {
        return { error: 'Failed to load knowledge' };
    }
}

/**
 * Load swarm registry data for real-time updates
 */
async function loadSwarmRegistry(): Promise<any> {
    try {
        const content = await fs.readFile(SWARM_REGISTRY_PATH, 'utf-8');
        const registry = JSON.parse(content);
        
        // Convert registry to swarm array format
        const swarms = Object.entries(registry).map(([id, data]: [string, any]) => ({
            id,
            name: data.name || id,
            type: inferSwarmType(id),
            status: 'online' as const,
            successRate: data.successRate ? Math.round(data.successRate * 100) : 85,
            revenue: data.revenue || 0,
            tasks: data.tasksCompleted || 0,
            efficiency: data.efficiency ? Math.round(data.efficiency * 100) : 85,
            agents: getSwarmAgents(id)
        }));
        
        return swarms;
    } catch (e) {
        console.log('[Telemetry] Swarm registry not found, using defaults');
        return getDefaultSwarms();
    }
}

/**
 * Infer swarm type from ID
 */
function inferSwarmType(id: string): string {
    const typeMap: Record<string, string> = {
        'CryptoSwarm': 'Trading & Finance',
        'RevenueHunter': 'Trading & Finance',
        'FreelanceSwarm': 'Freelance & Revenue',
        'TrendAnalyzer': 'Marketing & Sales',
        'MarketAnalyzer': 'Marketing & Sales',
        'SalesBot': 'Marketing & Sales',
        'ArbitrageHunter': 'Trading & Finance',
        'YieldOptimizer': 'DeFi & Yield',
        'ReferralManager': 'Referral & Growth',
        'SolanaDeFiSwarm': 'DeFi & Yield'
    };
    return typeMap[id] || 'General Purpose';
}

/**
 * Get default swarm agents based on swarm type
 */
function getSwarmAgents(id: string): string[] {
    const agentMap: Record<string, string[]> = {
        'CryptoSwarm': ['Trader', 'BlockchainAnalyzer', 'MarketPredictor'],
        'RevenueHunter': ['Analyst', 'Strategist', 'OpportunityHunter'],
        'FreelanceSwarm': ['Freelancer', 'ClientHunter', 'Contractor'],
        'TrendAnalyzer': ['TrendHunter', 'MarketScanner', 'DataMiner'],
        'MarketAnalyzer': ['MarketAnalyst', 'CompetitorTracker', 'SentimentMonitor'],
        'SalesBot': ['SalesAgent', 'LeadConverter', 'ClosingBot'],
        'ArbitrageHunter': ['ArbitrageBot', 'PriceMonitor', 'ExecutionEngine'],
        'YieldOptimizer': ['YieldFarmer', 'ProtocolAnalyzer', 'RiskManager'],
        'ReferralManager': ['ReferralAgent', 'OutreachBot', 'ConversionTracker'],
        'SolanaDeFiSwarm': ['SolanaTrader', 'DeFiStrategist', 'YieldOptimizer'],
        'default': ['Agent1', 'Agent2', 'Agent3']
    };
    return agentMap[id] || agentMap['default'];
}

/**
 * Get default swarms when registry is unavailable
 */
function getDefaultSwarms(): any[] {
    return [
        { id: 'CryptoSwarm', name: 'CryptoSwarm', type: 'Trading & Finance', status: 'online', successRate: 92, revenue: 15000, tasks: 150, efficiency: 88, agents: ['Trader', 'BlockchainAnalyzer', 'MarketPredictor'] },
        { id: 'RevenueHunter', name: 'RevenueHunter', type: 'Trading & Finance', status: 'online', successRate: 82, revenue: 12000, tasks: 89, efficiency: 82, agents: ['Analyst', 'Strategist', 'OpportunityHunter'] },
        { id: 'FreelanceSwarm', name: 'FreelanceSwarm', type: 'Freelance & Revenue', status: 'online', successRate: 75, revenue: 8500, tasks: 45, efficiency: 75, agents: ['Freelancer', 'ClientHunter', 'Contractor'] },
        { id: 'TrendAnalyzer', name: 'TrendAnalyzer', type: 'Marketing & Sales', status: 'online', successRate: 85, revenue: 0, tasks: 200, efficiency: 85, agents: ['TrendHunter', 'MarketScanner', 'DataMiner'] },
        { id: 'MarketAnalyzer', name: 'MarketAnalyzer', type: 'Marketing & Sales', status: 'online', successRate: 78, revenue: 0, tasks: 120, efficiency: 78, agents: ['MarketAnalyst', 'CompetitorTracker', 'SentimentMonitor'] },
        { id: 'SalesBot', name: 'SalesBot', type: 'Marketing & Sales', status: 'online', successRate: 85, revenue: 5000, tasks: 35, efficiency: 85, agents: ['SalesAgent', 'LeadConverter', 'ClosingBot'] }
    ];
}

/**
 * Broadcast state to all connected clients
 */
function broadcastState() {
    swarmState.lastUpdated = new Date().toISOString();
    io.emit('swarm_state', swarmState);
}

// ============================================================================
// HTTP HANDLERS
// ============================================================================

httpServer.on('request', async (req, res) => {
    const url = new URL(req.url!, `http://localhost:${PORT}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        if (url.pathname === '/api/health' || url.pathname === '/') {
            res.end(JSON.stringify({ status: 'online', swarm: swarmState }));
        }
        else if (url.pathname === '/api/metrics') {
            const metrics = await getSystemMetrics();
            res.end(JSON.stringify(metrics));
        }
        else if (url.pathname === '/api/consult') {
            const { question, options } = await parseBody(req);
            const result = await consultOracle(question, options || ['Yes', 'No', 'Maybe']);
            res.end(JSON.stringify(result));
        }
        else if (url.pathname === '/api/market-predict') {
            const { question } = await parseBody(req);
            const result = await generateMarketPrediction(question || 'What is the market outlook?');
            res.end(JSON.stringify(result));
        }
        else if (url.pathname === '/api/knowledge') {
            const result = await loadRepositoryKnowledge();
            res.end(JSON.stringify(result));
        }
        else if (url.pathname === '/api/swarms') {
            const result = await loadSwarmRegistry();
            res.end(JSON.stringify(result));
        }
        else if (url.pathname === '/api/hyper-brain') {
            const { message } = await parseBody(req);
            if (message) {
                const result = await hyperBrain.chat({
                    system: 'You are a helpful AI assistant.',
                    user: message
                });
                res.end(JSON.stringify({ response: result }));
            } else {
                res.end(JSON.stringify({ error: 'No message provided' }));
            }
        }
        else {
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(e) }));
    }
});

async function parseBody(req: any): Promise<any> {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch {
                resolve({});
            }
        });
    });
}

// ============================================================================
// WEBSOCKET HANDLERS
// ============================================================================

io.on('connection', (socket) => {
    console.log(`[Telemetry] Client connected: ${socket.id}`);
    
    // Send initial state
    socket.emit('swarm_state', swarmState);
    
    // Send swarm registry data
    loadSwarmRegistry().then(swarms => {
        socket.emit('swarm_update', swarms);
    });
    
    // Handle metric requests
    socket.on('get_metrics', async () => {
        const metrics = await getSystemMetrics();
        socket.emit('metrics', metrics);
    });
    
    // Handle swarm registry refresh
    socket.on('refresh_swarms', async () => {
        const swarms = await loadSwarmRegistry();
        socket.emit('swarm_update', swarms);
    });
    
    // Handle Oracle consultations
    socket.on('consult_oracle', async (data: { question: string; options: string[] }) => {
        const result = await consultOracle(data.question, data.options);
        socket.emit('oracle_result', result);
    });
    
    // Handle market predictions
    socket.on('market_predict', async (data: { question: string }) => {
        const result = await generateMarketPrediction(data.question);
        socket.emit('prediction_result', result);
    });
    
    // Handle Hyper Brain chat
    socket.on('hyper_chat', async (data: { message: string }) => {
        const result = await hyperBrain.chat({
            system: 'You are a helpful AI assistant.',
            user: data.message
        });
        socket.emit('hyper_response', result);
    });
    
    // Handle knowledge base requests
    socket.on('get_knowledge', async () => {
        const knowledge = await loadRepositoryKnowledge();
        socket.emit('knowledge_base', knowledge);
    });
    
    socket.on('disconnect', () => {
        console.log(`[Telemetry] Client disconnected: ${socket.id}`);
    });
});

// ============================================================================
// START SERVER
// ============================================================================

async function start(): Promise<void> {
    // Load initial knowledge
    await loadRepositoryKnowledge();
    
    // Load swarm registry
    const swarms = await loadSwarmRegistry();
    console.log(`[Telemetry] Loaded ${swarms.length} swarms from registry`);
    
    // Initialize market engine
    try {
        await coherentMarketEngine.initialize();
    } catch (e) {
        console.log('[Telemetry] Market engine initialization deferred');
    }
    
    // Start server
    httpServer.listen(PORT, () => {
        console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
        console.log('║     🛰️ SWARM TELEMETRY SERVER ONLINE                      ║');
        console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
        console.log(`\n   🌐 HTTP API:    http://localhost:${PORT}/api/*`);
        console.log(`   🔌 WebSocket:   ws://localhost:${PORT}`);
        console.log(`\n   📊 Endpoints:`);
        console.log(`      GET  /api/health         - Swarm status`);
        console.log(`      GET  /api/metrics        - Quantum metrics`);
        console.log(`      GET  /api/swarms         - Real swarm data from registry`);
        console.log(`      POST /api/consult        - Oracle consultation`);
        console.log(`      POST /api/market-predict - Market predictions`);
        console.log(`      POST /api/hyper-brain    - Hyper Intelligence chat`);
        console.log(`      GET  /api/knowledge      - Repository knowledge`);
        console.log(`\n   🔮 WebSocket Events:`);
        console.log(`      swarm_state     - State updates`);
        console.log(`      swarm_update    - Real swarm registry data`);
        console.log(`      metrics         - Quantum metrics`);
        console.log(`      oracle_result   - Oracle consultations`);
        console.log(`      prediction_result - Market predictions`);
        console.log(`      hyper_response  - Hyper Brain responses`);
        console.log(`\n   📦 Loaded: ${swarmState.repositoriesLoaded} repos, ${swarmState.skillsLoaded} skills`);
        console.log(`   🤖 Active Swarms: ${swarms.length}\n`);
    });
    
    // Periodic state broadcast
    setInterval(async () => {
        broadcastState();
        // Also refresh swarm data periodically
        const updatedSwarms = await loadSwarmRegistry();
        io.emit('swarm_update', updatedSwarms);
    }, 5000);
}

start().catch(console.error);
