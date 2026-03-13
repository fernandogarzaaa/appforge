import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuditStore } from '@/store/auditStore';
import { Shield, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
const SecurityAudit = () => {
    const logs = useAuditStore((state) => state.logs);
    const getIcon = (status) => {
        switch (status) {
            case 'PASS': return _jsx(CheckCircle, { className: "w-3 h-3 text-emerald-400" });
            case 'WARN': return _jsx(AlertTriangle, { className: "w-3 h-3 text-yellow-400" });
            case 'BLOCKED': return _jsx(XCircle, { className: "w-3 h-3 text-red-400" });
            default: return _jsx(Shield, { className: "w-3 h-3 text-slate-400" });
        }
    };
    const getColor = (status) => {
        switch (status) {
            case 'PASS': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            case 'WARN': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
            case 'BLOCKED': return 'text-red-400 border-red-500/30 bg-red-500/10';
            default: return 'text-slate-400 border-slate-500/30';
        }
    };
    return (_jsxs("div", { className: "h-full flex flex-col bg-slate-900 border-l border-slate-800 w-80 font-mono text-[10px]", children: [_jsxs("div", { className: "p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "w-4 h-4 text-blue-400" }), _jsx("span", { className: "font-bold text-slate-200 uppercase tracking-wider", children: "Glass Firewall" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }), _jsx("span", { className: "text-emerald-500 font-bold", children: "LIVE" })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-800", children: [logs.length === 0 && (_jsxs("div", { className: "text-center p-8 text-slate-600 italic", children: ["No active threats detected.", _jsx("br", {}), "System Secure."] })), logs.map((log) => (_jsxs("div", { className: `p-2 rounded border ${getColor(log.status)} mb-1`, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 font-bold", children: [getIcon(log.status), _jsxs("span", { children: ["[", log.status, "]"] })] }), _jsx("span", { className: "text-slate-500", children: new Date(log.timestamp).toLocaleTimeString() })] }), _jsx("div", { className: "text-slate-300 break-words leading-tight", children: log.message }), log.programId && (_jsxs("div", { className: "mt-1 pt-1 border-t border-dashed border-white/10 text-[9px] text-slate-500", children: ["PID: ", log.programId.slice(0, 8), "..."] })), _jsx("div", { className: "mt-1 flex justify-end", children: _jsxs("span", { className: `px-1 rounded text-[9px] font-bold ${log.riskScore > 0.5 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`, children: ["RISK: ", log.riskScore.toFixed(2)] }) })] }, log.id)))] }), _jsx("div", { className: "p-2 border-t border-slate-800 bg-slate-950 text-center text-slate-600 text-[9px]", children: "IRON GUARD ACTIVE \u2022 ZERO TRUST MODE" })] }));
};
export default SecurityAudit;
