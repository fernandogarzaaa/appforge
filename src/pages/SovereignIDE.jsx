import React, { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import SwarmConsole from '@/components/ide/SwarmConsole';
import ProjectCanvas from '@/components/ide/ProjectCanvas';
import WalletBalance from '@/components/WalletBalance';
import CodeVendingMachine from '@/components/CodeVendingMachine';
import { useNavigation } from '@/contexts/NavigationContext';
import { Brain, Zap, Activity, Globe, Rocket, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AIAgent } from '@/utils/aiAgentCore';
import { base44 } from '@/api/base44Client';

export default function SovereignIDE() {
    const { currentProject } = useNavigation();
    const [logs, setLogs] = useState([]);
    const [sessionStatus, setSessionStatus] = useState('Sovereign Orchestrator Online');
    const [agent, setAgent] = useState(null);
    const [plan, setPlan] = useState(null);
    const resonance = 98; // Increased for God Mode

    useEffect(() => {
        console.log("🔌 CONNECTING TO GOD MODE STREAM...");
        const eventSource = new EventSource('http://localhost:3001/api/stream-logs');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Add log to top of stack
            setLogs(prev => [data, ...prev].slice(0, 100));
        };

        eventSource.onerror = (e) => {
            console.error("Stream disconnected", e);
            eventSource.close();
        };

        return () => eventSource.close();
    }, []);

    useEffect(() => {
        const swarmAgent = new AIAgent(base44);
        setAgent(swarmAgent);

        const params = new URLSearchParams(window.location.search);
        const autoStart = params.get('auto_start');
        const idea = params.get('idea');

        if (autoStart && idea) {
            setSessionStatus('Synthesizing App Idea...');
            swarmAgent.processRequest(idea).then(({ plan }) => {
                setPlan(plan);
                setSessionStatus('Project Defined');
            });
        }
    }, []);

    return (
        <div className="flex flex-col h-screen bg-[#020617] text-slate-50 overflow-hidden">
            {/* 🌌 QUANTUM HUD (Toolbar) */}
            <header className="h-12 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-black tracking-tighter uppercase italic">Sovereign <span className="text-indigo-400">SAI</span></span>
                    </div>
                    <div className="h-4 w-px bg-slate-800" />
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <Globe className="w-3 h-3" />
                        <span>Project: <span className="text-slate-300">{currentProject?.name || 'New App'}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sessionStatus}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-slate-600 uppercase">Resonance</span>
                            <span className="text-xs font-mono font-bold text-indigo-400">{resonance}%</span>
                        </div>
                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: `${resonance}%` }} />
                        </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-1 text-[10px] font-bold">
                        <Rocket className="w-3 h-3 mr-1.5" />
                        BASE44 READY
                    </Badge>
                </div>
            </header>

            {/* 🚀 WORKSPACE GRID */}
            <main className="flex-1 overflow-hidden">
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={25} minSize={20}>
                        <SwarmConsole agent={agent} initialPlan={plan} logs={logs} />
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-slate-900 hover:bg-indigo-500/50 transition-colors cursor-col-resize" />

                    <Panel defaultSize={75}>
                        <ProjectCanvas />
                    </Panel>
                </PanelGroup>

                {/* 🏦 THE CODE VENDING MACHINE (Phase 9.5) */}
                <div className="absolute bottom-10 right-10 w-[500px] z-50 pointer-events-auto flex flex-col gap-4">
                    <div className="p-4 border border-green-500/30 bg-green-900/20 backdrop-blur-md rounded shadow-2xl">
                        <h3 className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Shield className="w-3 h-3" /> MY VAULT
                        </h3>
                        <WalletBalance endpoint="https://api.mainnet-beta.solana.com" />
                    </div>

                    <div className="p-4 border border-indigo-500/30 bg-slate-900/80 backdrop-blur-xl rounded-lg shadow-2xl">
                        <h2 className="text-indigo-400 text-[12px] font-black uppercase tracking-widest mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" /> SWARM VENDING MACHINE
                            </div>
                            <span className="text-[10px] text-slate-500">PAY-PER-LABOR</span>
                        </h2>
                        <CodeVendingMachine />
                    </div>
                </div>
            </main>

            {/* 🛡️ REALITY STATUS BAR */}
            <footer className="h-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between px-3 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Encrypted: SHA-256</span>
                    <span className="flex items-center gap-1.5 text-indigo-500/70"><Zap className="w-3 h-3" /> Quantum Core: Synchronized</span>
                </div>
                <div>v1.0.0-AGENTIC.STABLE</div>
            </footer>
        </div>
    );
}
