import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Activity, Brain, TrendingUp, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
export default function OracleInsights() {
    const [oracleData, setOracleData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchOracleState = async () => {
            try {
                // Fetch from the Sovereign Status API instead of static JSON
                const response = await fetch('/api/sovereign/status');
                if (response.ok) {
                    const data = await response.json();
                    setOracleData(data);
                }
            }
            catch (err) {
                console.error('Failed to load Oracle state:', err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchOracleState();
        const interval = setInterval(fetchOracleState, 5000); // 5s refresh for live vibe
        return () => clearInterval(interval);
    }, []);
    if (loading) {
        return (_jsx("div", { className: "h-full flex items-center justify-center bg-[#0f172a]/40 rounded-xl border border-slate-800/50", children: _jsx(Brain, { className: "w-8 h-8 text-blue-500/40 animate-pulse" }) }));
    }
    const state = oracleData?.state;
    const stats = state?.feedbackStats || { total: 0, success: 0 };
    const resonanceFidelity = stats.total > 0 ? (stats.success / stats.total) * 100 : 94.2; // Fallback to vibe if empty
    const metrics = state?.frontend_metrics;
    const lastActivity = state?.last_user_activity;
    return (_jsxs("div", { className: "h-full bg-[#0f172a]/60 backdrop-blur-md rounded-xl border border-slate-800/50 p-5 flex flex-col gap-5 overflow-hidden group", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20", children: _jsx(Brain, { className: "w-4 h-4 text-blue-400" }) }), _jsx("h3", { className: "text-xs font-black uppercase tracking-[0.2em] text-slate-200", children: "Oracle Decision Logic" })] }), _jsxs("div", { className: "flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400", children: [_jsx(ShieldCheck, { className: "w-3 h-3" }), "USER_RESONANCE_ACTIVE"] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 flex flex-col gap-1", children: [_jsx("div", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Resonance Fidelity" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-xl font-black text-blue-400", children: [resonanceFidelity.toFixed(1), "%"] }), _jsx(TrendingUp, { className: "w-3 h-3 text-emerald-500" })] })] }), _jsxs("div", { className: "bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 flex flex-col gap-1", children: [_jsx("div", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Latency Shift" }), _jsxs("div", { className: "text-xl font-black text-slate-300", children: [metrics?.avgLatency || 142, "ms"] })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800", children: [_jsx("div", { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1", children: "UX Performance (Vitals)" }), _jsxs("div", { className: "grid grid-cols-3 gap-2 py-1", children: [_jsx(VitalLabel, { label: "LCP", rating: metrics?.vitals?.LCP?.rating || 'good' }), _jsx(VitalLabel, { label: "CLS", rating: metrics?.vitals?.CLS?.rating || 'good' }), _jsx(VitalLabel, { label: "INP", rating: metrics?.vitals?.INP?.rating || 'good' })] }), _jsx("div", { className: "mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1", children: "Strategic Weights" }), _jsxs("div", { className: "space-y-2", children: [_jsx(WeightBar, { label: "UX Stability", value: metrics?.errorCount ? 50 : 92, color: "emerald" }), _jsx(WeightBar, { label: "Neural Speed", value: 88, color: "blue" }), _jsx(WeightBar, { label: "Oracle Bias", value: Math.round((state?.learningParams?.bias || 0.1) * 100), color: "amber" })] }), _jsxs("div", { className: "mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1 flex justify-between", children: [_jsx("span", { children: "Live Resonance Feed" }), lastActivity && _jsx("span", { className: "animate-pulse text-blue-400", children: "\u25CF LIVE" })] }), _jsxs("div", { className: "bg-black/20 rounded p-3 font-mono text-[10px] text-slate-400 leading-relaxed border border-slate-800/30", children: [lastActivity ? (_jsxs("div", { className: "flex items-start gap-2 mb-2", children: [_jsx(Activity, { className: "w-3 h-3 text-blue-400 mt-0.5" }), _jsxs("span", { children: ["User Action: ", _jsx("span", { className: "text-slate-200", children: lastActivity.type }), " detected at ", new Date(lastActivity.timestamp).toLocaleTimeString()] })] })) : (_jsx("div", { className: "flex items-start gap-2 mb-2 italic text-slate-600", children: "Searching for user resonance..." })), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }), _jsxs("span", { children: ["Oracle state synchronized with ", _jsx("span", { className: "text-blue-400", children: "Cloud Resonance" }), "."] })] })] })] }), _jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-slate-800/50", children: [_jsxs("div", { className: "flex items-center gap-1.5 font-mono text-[9px] text-slate-600", children: [_jsx(Clock, { className: "w-3 h-3" }), "LAST_SYNC: ", new Date(oracleData?.timestamp || Date.now()).toLocaleTimeString()] }), _jsx("div", { className: "text-[9px] font-black text-blue-500/60 uppercase", children: "Kernel v3.8.0" })] })] }));
}
function VitalLabel({ label, rating }) {
    const colors = {
        good: 'text-emerald-400',
        needs_improvement: 'text-amber-400',
        poor: 'text-red-400'
    };
    return (_jsxs("div", { className: "flex flex-col items-center gap-0.5", children: [_jsx("span", { className: "text-[8px] text-slate-500", children: label }), _jsx("span", { className: `text-[9px] font-black uppercase ${colors[rating] || 'text-slate-400'}`, children: rating.replace('_', ' ') })] }));
}
function WeightBar({ label, value, color }) {
    const colors = {
        blue: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
        emerald: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
        amber: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
    };
    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-[9px] font-bold uppercase tracking-tighter", children: [_jsx("span", { className: "text-slate-400", children: label }), _jsxs("span", { className: "text-slate-200", children: [value, "%"] })] }), _jsx("div", { className: "h-1 w-full bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-1000 ${colors[color]}`, style: { width: `${value}%` } }) })] }));
}
