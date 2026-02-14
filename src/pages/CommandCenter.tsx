import React, { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import SwarmConsole from '@/components/ide/SwarmConsole';
import ProjectCanvas from '@/components/ide/ProjectCanvas';
import WalletBalance from '@/components/WalletBalance';
import CodeVendingMachine from '@/components/CodeVendingMachine';
import SolanaMerchant from '@/components/SolanaMerchant';
import RaydiumScout from '@/components/RaydiumScout';
import QCoreVisualizer from '@/components/QCoreVisualizer';
import SafetyAudit from '@/components/SafetyAudit';
import { useQuantumOracle } from '@/hooks/useQuantumOracle';
import { useNavigation } from '@/contexts/NavigationContext';
import { Brain, Zap, Activity, Globe, Rocket, Shield, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AIAgent } from '@/utils/aiAgentCore';
import { base44 } from '@/api/base44Client';
import { SovereignWallet } from '@/components/auth/SovereignWallet';

export default function CommandCenter() {
    const { currentProject } = useNavigation();
    const [logs, setLogs] = useState([]);
    const [sessionStatus, setSessionStatus] = useState('AppForge Orchestrator Online');
    const [agent, setAgent] = useState(null);
    const [plan, setPlan] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const { isOracleOnline, validateCode } = useQuantumOracle();
    const resonance = 99; // Peak alignment for v1.0

    useEffect(() => {
        console.log("🔌 CONNECTING TO APPFORGE CORE...");
        const eventSource = new EventSource('http://localhost:3001/api/stream-logs');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setLogs(prev => [data, ...prev].slice(0, 100));

            // Trigger visualizer scan pulse on log activity
            if (data.severity === 'INFO' || data.severity === 'SUCCESS') {
                setIsScanning(true);
                setTimeout(() => setIsScanning(false), 2000);
            }
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
            setSessionStatus('Synthesizing AppForge Idea...');
            swarmAgent.processRequest(idea).then(({ plan }) => {
                setPlan(plan);
                setSessionStatus('Safety Mission Defined');
            });
        }
    }, []);

    return (
        <SovereignWallet>
            <div className="flex flex-col h-screen bg-[#0f172a] text-[#f8fafc] overflow-hidden font-sans">
                {/* 🌌 APPFORGE HUD (Toolbar) */}
                <header className="h-12 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                <Terminal className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-black tracking-tighter uppercase italic">AppForge <span className="text-blue-400">V1.0</span></span>
                        </div>
                        <div className="h-4 w-px bg-slate-800" />
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Globe className="w-3 h-3" />
                            <span>NODE: <span className="text-blue-200">{currentProject?.name || 'ROOT_STATION'}</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sessionStatus}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-slate-500 uppercase">Integrity</span>
                                <span className="text-xs font-mono font-bold text-blue-400">{resonance}%</span>
                            </div>
                            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${resonance}%` }} />
                            </div>
                        </div>
                        <Badge className={`bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[10px] font-bold ${isOracleOnline ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                            <Shield className="w-3 h-3 mr-1.5" />
                            {isOracleOnline ? 'HYBRID IRON ONLINE' : 'ORACLE OFFLINE'}
                        </Badge>
                    </div>
                </header>

                {/* 🚀 COMMAND GRID */}
                <main className="flex-1 overflow-hidden relative">
                    <PanelGroup direction="horizontal">
                        <Panel defaultSize={25} minSize={20}>
                            <SwarmConsole agent={agent} initialPlan={plan} logs={logs} />
                        </Panel>

                        <PanelResizeHandle className="w-1 bg-[#1e293b] hover:bg-blue-500/50 transition-colors cursor-col-resize" />

                        <Panel defaultSize={75}>
                            <ProjectCanvas />
                        </Panel>
                    </PanelGroup>

                    {/* 🛡️ APPFORGE SAFETY LAYER (Safety Audit) */}
                    <div className="absolute top-4 left-4 w-96 z-50 pointer-events-auto">
                        <SafetyAudit logs={logs} />
                    </div>

                    {/* 🛡️ APPFORGE SAFETY LAYER (Q-CORE Visualizer) */}
                    <div className="absolute top-4 right-4 w-80 z-50 pointer-events-auto">
                        <QCoreVisualizer logs={logs} isScanning={isScanning} />
                    </div>

                    {/* 🏦 UTILITY DOCK */}
                    <div className="absolute bottom-10 right-10 w-[500px] z-50 pointer-events-auto flex flex-col gap-4">
                        <div className="p-4 border border-blue-500/30 bg-[#0f172a]/90 backdrop-blur-xl rounded-xl h-64 overflow-hidden flex flex-col shadow-2xl">
                            <div className="flex justify-between mb-4 border-b border-blue-500/20 pb-2">
                                <h3 className="text-blue-400 font-bold tracking-widest text-[10px] uppercase flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-blue-500" /> SIGNAL SCOUT
                                </h3>
                                <span className="animate-pulse text-green-500 text-[10px] font-black uppercase tracking-widest">● SYNCED</span>
                            </div>
                            <RaydiumScout />
                        </div>

                        <div className="p-4 border border-slate-700 bg-[#1e293b]/80 backdrop-blur-xl rounded-lg shadow-2xl">
                            <h2 className="text-[#f8fafc] text-[12px] font-black uppercase tracking-widest mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-blue-400" /> COMMAND TERMINAL
                                </div>
                                <span className="text-[10px] text-slate-500">AUTH: LOCAL_HOST</span>
                            </h2>
                            <div className="flex flex-col gap-4">
                                <CodeVendingMachine />
                                <div className="pt-4 border-t border-slate-700">
                                    <SolanaMerchant />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* 🛡️ MISSION STATUS BAR */}
                <footer className="h-6 border-t border-slate-800 bg-[#020617] flex items-center justify-between px-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-blue-500" /> AppForge Guard: Enabled</span>
                        <span className="flex items-center gap-1.5 text-blue-400/70"><Zap className="w-3 h-3" /> Q-CORE 2.0: Synchronized</span>
                    </div>
                    <div className="text-slate-700">STABLE_RELEASE_V1.0</div>
                </footer>
            </div>
        </SovereignWallet>
    );
}
