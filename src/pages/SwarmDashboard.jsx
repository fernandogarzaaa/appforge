
import React, { useEffect, useState } from 'react';

// NOTE: In a real "Repo-Dweller" setup, the state is in the Git History/Tags/Files.
// Since the frontend is static/separate, we can't easily read "live" GitHub Actions logs without a proxy.
// However, we CAN read the "swarm_state.json" if the bot commits it.
// For now, we will simulate the connection or read from a public endpoint if available.

export default function SwarmDashboard() {
    const [swarmState, setSwarmState] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Poll for swarm state (simulated for now, would fetch from raw.githubusercontent...)
        const fetchState = async () => {
            try {
                // This URL would need to be the RAW version of the file committed by the bot
                // const res = await fetch('https://raw.githubusercontent.com/fernandogarzaaa/appforge/main/swarm_state.json');
                // const data = await res.json();

                // Mock Data for Visualization
                const mockData = {
                    lastRun: new Date().toISOString(),
                    status: 'ACTIVE',
                    activeAgents: ['Sentinel', 'BugHunter', 'GodMode', 'ProductOwner'],
                    recentThoughts: [
                        { source: 'ProductOwner', msg: 'Analyzed README. Identified missing "Terms of Services".' },
                        { source: 'GodMode', msg: 'Implemented TOS page. Committing...' },
                        { source: 'Sentinel', msg: 'Scan complete. No vulnerabilities found.' }
                    ]
                };

                setSwarmState(mockData);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        };

        fetchState();
    }, []);

    if (loading) return <div className="p-10 text-white">Connecting to Swarm Matrix...</div>;

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-8">
            <h1 className="text-3xl font-bold mb-6 border-b border-green-800 pb-2">
                <span className="mr-2">🐝</span> SWARM COMMAND CENTER
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Panel */}
                <div className="border border-green-900 p-4 rounded bg-gray-900 bg-opacity-50">
                    <h2 className="text-xl font-bold mb-4 text-white">OFFLINE STATE</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="text-green-400 font-bold">{swarmState.status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Last Pulse:</span>
                            <span>{new Date(swarmState.lastRun).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Next Pulse:</span>
                            <span>{new Date(Date.now() + 15 * 60000).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                {/* Active Agents */}
                <div className="border border-green-900 p-4 rounded bg-gray-900 bg-opacity-50">
                    <h2 className="text-xl font-bold mb-4 text-white">ACTIVE NEURAL NODES</h2>
                    <div className="flex gap-2 flex-wrap">
                        {swarmState.activeAgents.map(agent => (
                            <span key={agent} className="px-3 py-1 bg-green-900 text-green-200 rounded text-sm border border-green-700">
                                {agent}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Neural Stream */}
            <div className="mt-8 border border-green-900 p-4 rounded bg-gray-900 bg-opacity-50 h-96 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-white">QUANTUM THOUGHT STREAM</h2>
                <div className="space-y-3">
                    {swarmState.recentThoughts.map((log, i) => (
                        <div key={i} className="border-l-2 border-green-700 pl-3 py-1">
                            <span className="text-xs text-green-600 uppercase tracking-widest">{log.source}</span>
                            <p className="text-green-300">{log.msg}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-600">
                APF-SWARM-V1.0 // AUTONOMOUS_MODE: ENABLED
            </div>
        </div>
    );
}
