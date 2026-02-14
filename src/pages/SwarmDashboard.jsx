
import React, { useEffect, useState } from 'react';

// NOTE: In a real "Repo-Dweller" setup, the state is in the Git History/Tags/Files.
// Since the frontend is static/separate, we can't easily read "live" GitHub Actions logs without a proxy.
// However, we CAN read the "swarm_state.json" if the bot commits it.
// For now, we will simulate the connection or read from a public endpoint if available.

export default function SwarmDashboard() {
    const [swarmState, setSwarmState] = useState(null);
    const [quantumData, setQuantumData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // In a real app, we might import this JSON directly or fetch it
                // Since it's in src/data, we can try importing it if Vite allows, or fetching if it's in public.
                // For this setup, we'll assume we can import it or it's served.
                // However, dynamic imports of JSON outside of module graph might be tricky in dev without restart.
                // Let's rely on a dynamic import.

                const data = await import('../data/quantum_verification_report.json');
                const predictions = await import('../data/quantum_predictions.json').catch(() => []);
                const hyperparams = await import('../data/quantum_hyperparameters.json').catch(() => null);

                // The import default might be the JSON content
                const baseData = data.default || data;
                setQuantumData({
                    ...baseData,
                    predictions: predictions.default || predictions,
                    hyperparameters: hyperparams.default || hyperparams
                });

                if (baseData.swarmState) {
                    setSwarmState(baseData.swarmState);
                } else {
                    // Fallback if not found in report
                    setSwarmState({
                        status: 'UNKNOWN',
                        activeAgents: [],
                        recentThoughts: [{ source: 'System', msg: 'Swarm state unavailable in quantum report.' }]
                    });
                }

                setLoading(false);
            } catch (e) {
                console.error("Failed to load quantum data:", e);
                // Fallback mock data if file doesn't exist yet
                setSwarmState({
                    status: 'OFFLINE',
                    activeAgents: ['Disconnected'],
                    recentThoughts: [{ source: 'System', msg: 'Quantum Uplink Failed. Run verification script.' }]
                });
                setLoading(false);
            }
        };

        fetchData();

        // Poll every 5 seconds for updates (in case file changes and HMR doesn't catch it, though import usually caches)
        // For a real dashboard we'd use a server endpoint.
    }, []);

    if (loading) return <div className="p-10 text-white min-h-screen bg-black flex items-center justify-center font-mono">Initializing Quantum Uplink...</div>;

    const { entropy, stability, coherence, totalIssues, issues } = quantumData || {};
    const recentThoughts = swarmState?.recentThoughts || [];
    const todoSummary = quantumData?.todoSummary || [];

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-6 overflow-hidden relative">
            {/* Background Grid Animation would go here */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://media.giphy.com/media/U3qYN8S0j3bpK/giphy.gif')] bg-cover"></div>

            <header className="flex justify-between items-center mb-8 border-b border-green-800 pb-4 relative z-10">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <span className="text-4xl animate-pulse">⚛️</span>
                    SWARM COMMAND CENTER
                </h1>
                <div className="text-right">
                    <div className="text-xs text-green-400">SYS.TIME: {new Date().toLocaleTimeString()}</div>
                    <div className="text-xs text-green-600">QUANTUM.VER: v2.4.0</div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

                {/* 1. Quantum Metrics Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="border border-green-900 bg-gray-900 bg-opacity-80 p-5 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                        <h2 className="text-xl font-bold mb-4 text-white border-b border-green-800 pb-2 flex justify-between">
                            SYSTEM HEALTH
                            <span className={`text-sm px-2 py-0.5 rounded ${stability > 80 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {stability > 80 ? 'OPTIMAL' : 'CRITICAL'}
                            </span>
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span>Entropy (Chaos)</span>
                                    <span>{entropy}%</span>
                                </div>
                                <div className="w-full bg-green-900 h-2 rounded overflow-hidden">
                                    <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${entropy}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <span>Coherence (Order)</span>
                                    <span>{coherence}%</span>
                                </div>
                                <div className="w-full bg-green-900 h-2 rounded overflow-hidden">
                                    <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${coherence}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <span>Stability</span>
                                    <span>{stability && stability.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-green-900 h-2 rounded overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${stability > 50 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${stability}%` }}></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-green-900 flex justify-between items-center">
                                <span className="text-gray-400">Total Anomalies</span>
                                <span className="text-2xl font-bold text-white">{totalIssues}</span>
                            </div>
                        </div>
                    </div>

                    {/* Neural Predictions (Ghost Bugs) */}
                    <div className="border border-purple-900 bg-gray-900 bg-opacity-80 p-5 rounded-lg">
                        <h2 className="text-lg font-bold mb-3 text-purple-300 flex items-center gap-2">
                            <span className="animate-pulse">🔮</span> QUANTUM PREDICTIONS
                        </h2>
                        <div className="space-y-3">
                            {quantumData?.predictions ? (
                                quantumData.predictions.map((pred, i) => (
                                    <div key={i} className="text-xs flex justify-between items-center border-b border-purple-900 pb-1">
                                        <span className="text-purple-200">{pred.component}</span>
                                        <span className={`px-2 py-0.5 rounded ${pred.ghostBugs > 2 ? 'bg-red-900 text-red-300' : 'bg-purple-900 text-purple-300'}`}>
                                            {pred.ghostBugs} GHOST BUGS
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-purple-400 italic text-center text-xs">
                                    Neural Network Initializing...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Issues Preview */}
                    <div className="border border-green-900 bg-gray-900 bg-opacity-80 p-5 rounded-lg h-64 overflow-hidden flex flex-col">
                        <h2 className="text-lg font-bold mb-3 text-white">ANOMALY DETECTOR</h2>
                        <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                            {issues && issues.length > 0 ? (
                                issues.map((issue, idx) => (
                                    <div key={idx} className="text-xs border-l-2 border-yellow-600 pl-2 py-1 bg-yellow-900 bg-opacity-10">
                                        <div className="text-yellow-400 font-bold">{issue.type}</div>
                                        <div className="text-gray-400 truncate">{issue.file}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-green-400 italic text-center mt-10">No anomalies detected. System is clean.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Swarm Intelligence & Thoughts */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="border border-green-900 bg-gray-900 bg-opacity-80 p-5 rounded-lg flex-1">
                        <h2 className="text-xl font-bold mb-4 text-white border-b border-green-800 pb-2">HIVE MIND STREAM</h2>
                        <div className="h-[500px] overflow-y-auto custom-scrollbar space-y-4 pr-2">
                            {recentThoughts.slice().reverse().map((log, i) => (
                                <div key={i} className="flex gap-3 animate-fade-in-up">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-green-600 font-bold uppercase tracking-wider mb-0.5">
                                            {log.source || 'UNKNOWN_NODE'}
                                        </div>
                                        <p className="text-green-300 text-sm leading-relaxed border-l border-green-800 pl-3">
                                            {log.msg}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {recentThoughts.length === 0 && (
                                <div className="text-center text-gray-500 mt-20">Silence in the hive...</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Task & Agent Status */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Active Agents */}
                    <div className="border border-green-900 bg-gray-900 bg-opacity-80 p-5 rounded-lg">
                        <h2 className="text-lg font-bold mb-3 text-white">NEURAL NODES ONLINE</h2>
                        <div className="flex flex-wrap gap-2">
                            {swarmState?.activeAgents?.map(agent => (
                                <span key={agent} className="px-3 py-1 bg-green-900 bg-opacity-40 text-green-200 rounded text-sm border border-green-700 shadow flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    {agent}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Genetic Evolution Status */}
                    {quantumData?.hyperparameters && (
                        <div className="border border-cyan-900 bg-gray-900 bg-opacity-80 p-5 rounded-lg">
                            <h2 className="text-lg font-bold mb-3 text-cyan-300 flex items-center gap-2">
                                <span className="animate-spin-slow">🧬</span> GENETIC EVOLUTION
                            </h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-cyan-500 text-xs">GENERATIONS</div>
                                    <div className="text-white text-xl">{quantumData.hyperparameters.generations}</div>
                                </div>
                                <div>
                                    <div className="text-cyan-500 text-xs">FITNESS</div>
                                    <div className="text-white text-xl">{parseFloat(quantumData.hyperparameters.fitness).toFixed(2)}</div>
                                </div>
                                <div className="col-span-2 border-t border-cyan-900 pt-2 mt-2">
                                    <div className="text-center text-xs text-cyan-400">OPTIMIZED PARAMETERS</div>
                                    <div className="flex justify-between mt-1">
                                        <span>Temp: {parseFloat(quantumData.hyperparameters.temperature).toFixed(0)}</span>
                                        <span>Cooling: {parseFloat(quantumData.hyperparameters.coolingRate).toFixed(4)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Todo / Manifest */}
                    <div className="border border-green-900 bg-gray-900 bg-opacity-80 p-5 rounded-lg h-96 flex flex-col">
                        <h2 className="text-lg font-bold mb-3 text-white">EVOLUTION MANIFEST (TODO)</h2>
                        <div className="overflow-y-auto flex-1 space-y-2 font-mono text-sm">
                            {todoSummary && todoSummary.length > 0 ? (
                                todoSummary.map((item, idx) => (
                                    <div key={idx} className={`p-2 rounded ${item.includes('[x]') ? 'text-gray-500 line-through' : 'text-green-300 bg-green-900 bg-opacity-20'}`}>
                                        {item.replace('- [ ]', '☐').replace('- [x]', '☑')}
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500">No active directives found in TODO.md</div>
                            )}
                            <div className="text-center pt-4">
                                <span className="text-xs text-green-600">
                                    View Full Manifest in Repo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="mt-8 text-center text-xs text-gray-600 relative z-10">
                APF-SWARM-V2.4 // CONNECTION: {swarmState ? swarmState.status : 'NEGOTIATING'}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 20, 0, 0.3);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 100, 0, 0.5);
                    border-radius: 3px;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
