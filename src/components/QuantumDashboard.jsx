
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const QuantumDashboard = () => {
    const [systemState, setSystemState] = useState({
        agents: [],
        coherence: 0,
        energy: 0,
        taskId: 'Connecting...'
    });

    useEffect(() => {
        const fetchSystemData = async () => {
            try {
                // Fetch from the real MCP backend
                const response = await fetch('http://localhost:8000/mcp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'tools/call',
                        params: {
                            name: 'get_system_status',
                            arguments: {}
                        },
                        id: 1
                    })
                });

                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();
                
                // Assuming the response structure based on common agent patterns
                // Adjusting to what the dashboard expects
                if (data.result) {
                    setSystemState({
                        agents: data.result.agents || [],
                        coherence: data.result.coherence || 0,
                        energy: data.result.energy || 0,
                        taskId: data.result.taskId || 'IDLE'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch system metrics:', error);
                // Graceful degradation or error display
            }
        };

        // Poll every 2 seconds
        const interval = setInterval(fetchSystemData, 2000);
        
        // Initial fetch
        fetchSystemData();

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-cyan-400 p-8 font-mono relative overflow-hidden">
            {/* Holographic Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-6xl mx-auto"
            >
                <header className="mb-8 border-b border-cyan-500/30 pb-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 shadow-cyan-500/50 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            QUANTUM ENGINE <span className="text-xs align-top border border-cyan-500 px-1 rounded">V1.0</span>
                        </h1>
                        <p className="text-sm text-cyan-300/60 mt-1">
                            SUPERPOSITION: <span className="text-white">{systemState.taskId || 'IDLE'}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-cyan-300/60">SYSTEM COHERENCE</div>
                        <div className="text-2xl font-bold text-cyan-300">{(systemState.coherence * 100).toFixed(1)}%</div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Live Agent Status */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-slate-800/50 backdrop-blur-md border border-cyan-500/30 rounded-lg p-6 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400"></div>

                        <h2 className="text-xl mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            ACTIVE SWARM AGENTS
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {systemState.agents.length > 0 ? (
                                systemState.agents.map((agent, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-black/40 border border-cyan-500/20 p-4 rounded hover:border-cyan-400/60 transition-colors"
                                    >
                                        <div className="text-xs text-purple-400 mb-1">{agent.role ? agent.role.toUpperCase() : 'AGENT'}</div>
                                        <div className="text-lg font-bold">{agent.name || 'Unnamed Agent'}</div>
                                        <div className="mt-2 w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                                            <motion.div
                                                className="bg-cyan-400 h-full"
                                                style={{ width: `${agent.load || 50}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-right mt-1 text-cyan-500/60">CPU: {agent.load || 50}%</div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-cyan-500/50 italic">No agents detected.</div>
                            )}
                        </div>
                    </div>

                    {/* System Vitals (Circular/Abstract) */}
                    <div className="bg-slate-800/50 backdrop-blur-md border border-purple-500/30 rounded-lg p-6 relative">
                        <h2 className="text-xl mb-4 text-purple-300">ENTANGLEMENT METRICS</h2>
                        <div className="flex items-center justify-center h-48 relative">
                            {/* Animated Rings */}
                            <motion.div
                                className="absolute w-32 h-32 border-2 border-cyan-500/30 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            />
                            <motion.div
                                className="absolute w-24 h-24 border-2 border-purple-500/40 rounded-full dashed"
                                style={{ borderStyle: 'dashed' }}
                                animate={{ rotate: -360 }}
                                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                            />
                            <div className="text-center z-10">
                                <div className="text-3xl font-bold text-white">{Math.floor(systemState.energy)}</div>
                                <div className="text-xs text-slate-400">Q-FLOPS</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terminal Log */}
                <div className="mt-6 bg-black/80 border border-slate-700 rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto shadow-inner">
                    <div className="opacity-50 mb-2">// QUANTUM TERMINAL STREAM</div>
                    <div className="mb-1">
                        <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> Connected to Backend: http://localhost:8000/mcp
                    </div>
                    <div className="animate-pulse">_</div>
                </div>
            </motion.div>
        </div>
    );
};

export default QuantumDashboard;
