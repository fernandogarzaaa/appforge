import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
// Heavy components transitioned to Lazy Loading
const EvolutionMap = lazy(() => import('@/components/EvolutionMap'));
const CommandStream = lazy(() => import('@/components/CommandStream'));
const RecordsVault = lazy(() => import('@/components/RecordsVault'));
const OracleInsights = lazy(() => import('@/components/OracleInsights'));

import { useSovereignStatus } from '@/hooks/useSovereignStatus';
import { useNavigation } from '@/contexts/NavigationContext';
import { Shield, Activity, Zap, Cpu, Terminal, Database, Lock, Search, Loader2 } from 'lucide-react';

function SkeletonLoader() {
    return (
        <div className="h-full w-full flex items-center justify-center bg-[#0f172a]/20 animate-pulse rounded-lg border border-slate-800">
            <Loader2 className="w-6 h-6 text-slate-700 animate-spin" />
        </div>
    );
}

export default function CommandCenter() {
    const { currentProject } = useNavigation();
    const status = useSovereignStatus();
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [rightPanelMode, setRightPanelMode] = useState<'records' | 'oracle'>('records');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-[#020617] text-[#f8fafc] overflow-hidden font-sans">

            {/* 🏰 TRUTH-HUD (Phase 46) */}
            <header className="h-14 border-b border-slate-800 bg-[#020617] flex items-center justify-between px-6 z-50 relative pointer-events-auto">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black tracking-tighter uppercase italic leading-none">AppForge <span className="text-blue-500">Sovereign</span></span>
                            <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-1">Kernel v{status?.kernel.version || '1.0.0'}</span>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-800" />

                    {/* Kernel Integrity Indicator */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Kernel Integrity</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 rounded">
                                {status?.kernel.integrity || 'VERIFYING...'}
                            </span>
                        </div>
                    </div>

                    {/* Active Axioms */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active Axioms</span>
                        <div className="flex gap-2">
                            {status?.axioms && Object.entries(status.axioms).map(([key, active]) => (
                                <div key={key} className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border ${active ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-slate-800 bg-slate-900/50 text-slate-600'
                                    }`}>
                                    <Lock className="w-2.5 h-2.5" />
                                    <span className="text-[8px] font-black">{key}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    {/* Throughput */}
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Logic Throughput</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-blue-400">{status?.throughput || 0} <span className="text-[8px] text-slate-600">OPS</span></span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`w-1 h-3 rounded-sm ${i <= (status?.throughput || 0) % 5 + 1 ? 'bg-blue-500 animate-pulse' : 'bg-slate-800'}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-[#94a3b8]">{currentProject?.name || 'LOCAL_HOST'}</span>
                        <span className="text-[10px] font-mono text-[#64748b]">{currentTime}</span>
                    </div>
                </div>
            </header>

            {/* 🌌 MAIN COMMAND INTERFACE */}
            <main className="flex-1 p-4 overflow-hidden bg-[#020617]">
                <PanelGroup direction="horizontal">

                    {/* Left Column: 100% Truth / Evolution */}
                    <Panel defaultSize={60} minSize={40}>
                        <PanelGroup direction="vertical">
                            <Panel defaultSize={70}>
                                <div className="h-full p-2">
                                    <Suspense fallback={<SkeletonLoader />}>
                                        <EvolutionMap />
                                    </Suspense>
                                </div>
                            </Panel>
                            <PanelResizeHandle className="h-1 bg-slate-900 border-y border-slate-800 hover:bg-blue-900/20 transition-colors" />
                            <Panel defaultSize={30}>
                                <div className="h-full p-2">
                                    <Suspense fallback={<SkeletonLoader />}>
                                        <CommandStream />
                                    </Suspense>
                                </div>
                            </Panel>
                        </PanelGroup>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-slate-900 border-x border-slate-800 hover:bg-blue-900/20 transition-colors" />

                    {/* Right Column: Records Vault & Insights */}
                    <Panel defaultSize={40} minSize={30}>
                        <div className="h-full p-2 flex flex-col gap-4">
                            <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800">
                                <button
                                    onClick={() => setRightPanelMode('records')}
                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${rightPanelMode === 'records' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    System Records
                                </button>
                                <button
                                    onClick={() => setRightPanelMode('oracle')}
                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${rightPanelMode === 'oracle' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Oracle Logic
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <Suspense fallback={<SkeletonLoader />}>
                                    {rightPanelMode === 'records' ? <RecordsVault /> : <OracleInsights />}
                                </Suspense>
                            </div>

                            <div className="h-48 bg-[#0f172a]/50 rounded-lg border border-slate-800 p-4 flex flex-col gap-3 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    System Metrics
                                    <Activity className="w-3 h-3 text-blue-500" />
                                </div>
                                <div className="space-y-3">
                                    <MetricItem label="Neural Efficiency" value="98.2%" color="blue" />
                                    <MetricItem label="Sovereignty Guard" value="ACTIVE" color="emerald" />
                                    <MetricItem label="Local Cache" value="2.4 GB" color="purple" />
                                </div>
                            </div>
                        </div>
                    </Panel>

                </PanelGroup>
            </main>

            {/* 🛡️ PRODUCTION LOCKDOWN FOOTER */}
            <footer className="h-8 border-t border-slate-800 bg-[#020617] flex items-center justify-between px-6 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-600">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5 text-blue-500"><Shield className="w-3 h-3" /> SECURE HANDSHAKE: ESTABLISHED</span>
                    <span className="flex items-center gap-1.5 text-emerald-500 animate-pulse"><Lock className="w-3 h-3" /> TRUTH_ANCHOR: SYNCHRONIZED</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>BUILD #600 READY</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">STABLE_RELEASE</span>
                </div>
            </footer>
        </div>
    );
}

function MetricItem({ label, value, color }: { label: string, value: string, color: string }) {
    const colors: any = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    };
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">{label}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${colors[color]}`}>{value}</span>
        </div>
    );
}
