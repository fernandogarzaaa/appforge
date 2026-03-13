import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Loader2, Binary } from 'lucide-react';
const SafetyAudit = ({ logs }) => {
    const [auditStatus, setAuditStatus] = useState('IDLE');
    const [activePaths, setActivePaths] = useState([]);
    const [oracleLogs, setOracleLogs] = useState([]);
    useEffect(() => {
        // Filter for Q-CORE, QUANTUM_ENGINE, and Rust logs
        const relevant = logs.filter(l => ['Q-CORE', 'QUANTUM_ENGINE', 'RUST_BRIDGE', 'ORACLE'].includes(l.agent)).slice(0, 5);
        setOracleLogs(relevant);
        // Analyze current swarm state
        const lastLog = logs[0]; // Assuming logs are sorted newest first
        if (lastLog) {
            if (lastLog.msg.includes('Superposition')) {
                setAuditStatus('ANALYZING');
                setActivePaths(['Alpha', 'Beta', 'Gamma']);
            }
            else if (lastLog.msg.includes('stability verified') || lastLog.msg.includes('Verified')) {
                setAuditStatus('SECURE');
                setActivePaths([]);
            }
            else if (lastLog.msg.includes('Rejected') || lastLog.msg.includes('DECOHERENCE')) {
                setAuditStatus('VIOLATION');
                setActivePaths([]);
            }
        }
    }, [logs]);
    return (_jsxs("div", { className: "bg-[#0f172a]/90 backdrop-blur-xl border border-blue-500/30 rounded-xl p-5 shadow-[0_0_30px_rgba(59,130,246,0.15)]", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `p-2 rounded-lg ${auditStatus === 'VIOLATION' ? 'bg-red-500/20 text-red-400' :
                                    auditStatus === 'SECURE' ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-blue-500/20 text-blue-400'}`, children: auditStatus === 'VIOLATION' ? _jsx(ShieldAlert, { className: "w-5 h-5" }) : _jsx(ShieldCheck, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-[#f8fafc]", children: "Safety Audit Layer" }), _jsx("p", { className: "text-[10px] text-slate-500 font-bold uppercase tracking-tight", children: "Q-CORE V2.0 Handshake: Stable" })] })] }), auditStatus === 'ANALYZING' && (_jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full animate-pulse", children: [_jsx(Loader2, { className: "w-3 h-3 text-blue-400 animate-spin" }), _jsx("span", { className: "text-[9px] font-black text-blue-400 uppercase", children: "Superposition Active" })] }))] }), _jsx("div", { className: "grid grid-cols-3 gap-3 mb-6", children: ['Alpha', 'Beta', 'Gamma'].map(path => (_jsxs("div", { className: `p-3 rounded-lg border flex flex-col items-center gap-2 transition-all duration-500 ${activePaths.includes(path) ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                        auditStatus === 'SECURE' ? 'bg-slate-900/50 border-emerald-500/30' :
                            'bg-slate-900/50 border-slate-800 opacity-50'}`, children: [_jsx(Binary, { className: `w-4 h-4 ${activePaths.includes(path) ? 'text-blue-400 animate-bounce' : 'text-slate-600'}` }), _jsxs("span", { className: "text-[8px] font-black uppercase text-slate-400", children: ["Path ", path] }), _jsx("div", { className: "w-full h-1 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full bg-blue-500 ${activePaths.includes(path) ? 'w-full animate-[progress_1s_infinite]' : 'w-0'}` }) })] }, path))) }), _jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2", children: "Live Oracle Verdicts" }), _jsx("div", { className: "space-y-1 max-h-32 overflow-hidden", children: oracleLogs.length > 0 ? oracleLogs.map((log, i) => (_jsxs("div", { className: "flex gap-3 text-[10px] items-start p-2 bg-slate-950/50 rounded border border-slate-800", children: [_jsxs("span", { className: `font-black shrink-0 ${log.severity === 'SUCCESS' ? 'text-emerald-400' :
                                        log.severity === 'ERROR' ? 'text-red-400' : 'text-blue-400'}`, children: ["[", log.agent, "]"] }), _jsx("span", { className: "text-slate-400 leading-tight italic truncate", children: log.msg })] }, i))) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-4 border border-dashed border-slate-800 rounded", children: [_jsx(Cpu, { className: "w-5 h-5 text-slate-800 mb-2" }), _jsx("span", { className: "text-[9px] font-bold text-slate-700 uppercase", children: "Idle: Waiting for Synthesis" })] })) })] }), _jsx("style", { children: `
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            ` })] }));
};
export default SafetyAudit;
