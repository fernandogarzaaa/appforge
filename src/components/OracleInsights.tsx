import React, { useState, useEffect } from 'react';
import { Activity, Brain, TrendingUp, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface OracleState {
    timestamp: string;
    state: {
        feedbackStats: {
            total: number;
            success: number;
        };
        learningParams: {
            bias: number;
            exploration: number;
        };
    };
}

export default function OracleInsights() {
    const [oracleData, setOracleData] = useState<OracleState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOracleState = async () => {
            try {
                // In a real app, this would be an API call
                // For now, we simulate by fetching the static JSON if available
                const response = await fetch('/src/data/quantum_oracle_state.json');
                if (response.ok) {
                    const data = await response.json();
                    setOracleData(data);
                }
            } catch (err) {
                console.error('Failed to load Oracle state:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOracleState();
        const interval = setInterval(fetchOracleState, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0f172a]/40 rounded-xl border border-slate-800/50">
                <Brain className="w-8 h-8 text-blue-500/40 animate-pulse" />
            </div>
        );
    }

    const stats = oracleData?.state.feedbackStats || { total: 0, success: 0 };
    const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;

    return (
        <div className="h-full bg-[#0f172a]/60 backdrop-blur-md rounded-xl border border-slate-800/50 p-5 flex flex-col gap-5 overflow-hidden group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Brain className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-200">Oracle Decision Logic</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    SOVEREIGN_MODE
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 flex flex-col gap-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Resonance Fidelity</div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-blue-400">{successRate.toFixed(1)}%</span>
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                    </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 flex flex-col gap-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Feedback Cycles</div>
                    <div className="text-xl font-black text-slate-300">{stats.total}</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">
                    Strategic Weights
                </div>
                <div className="space-y-2">
                    <WeightBar label="Stability" value={85} color="emerald" />
                    <WeightBar label="Performance" value={92} color="blue" />
                    <WeightBar label="Complexity" value={45} color="amber" />
                </div>

                <div className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">
                    Latest Reasoning Trace
                </div>
                <div className="bg-black/20 rounded p-3 font-mono text-[10px] text-slate-400 leading-relaxed border border-slate-800/30">
                    <div className="flex items-start gap-2 mb-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                        <span>Detected chunk size violation in <span className="text-blue-400">vendor.js</span>. Triggering performance-hardened re-roll.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Clock className="w-3 h-3 text-slate-600 mt-0.5" />
                        <span className="text-slate-500 italic">Self-correction cycle initiated: 48ms latency.</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-600">
                    <Activity className="w-3 h-3" />
                    LAST_UPDATE: {new Date(oracleData?.timestamp || Date.now()).toLocaleTimeString()}
                </div>
                <div className="text-[9px] font-black text-blue-500/60 uppercase">Kernel v3.5.2</div>
            </div>
        </div>
    );
}

function WeightBar({ label, value, color }: { label: string, value: number, color: 'blue' | 'emerald' | 'amber' }) {
    const colors = {
        blue: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
        emerald: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
        amber: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-200">{value}%</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${colors[color]}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
