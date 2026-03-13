import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Shield, Search, Database } from 'lucide-react';
export default function RecordsVault() {
    const [records, setRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => {
        // In a real system, we'd fetch this from the server.
        // For now, we simulate recent ledger entries from AGENTS.md
        setRecords([
            { id: 1, type: 'HANDSHAKE', status: 'BLESSED', file: 'Inference.ts', gain: '+24%', time: '2m ago' },
            { id: 2, type: 'MUTATION', status: 'BLESSED', file: 'orchestrator.ts', gain: '+15%', time: '5m ago' },
            { id: 3, type: 'VIOLATION', status: 'PURGED', file: 'gitWorkflow.ts', msg: 'AXIOM_REJECTION', time: '12m ago' },
            { id: 4, type: 'HEAL', status: 'COMPLETED', file: 'server.ts', gain: '+31%', time: '1h ago' },
        ]);
    }, []);
    return (_jsxs("div", { className: "flex flex-col h-full bg-[#020617] border border-slate-800 rounded-lg overflow-hidden", children: [_jsxs("div", { className: "h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/20", children: [_jsxs("div", { className: "flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest", children: [_jsx(Database, { className: "w-3.5 h-3.5" }), "Evolution Ledger"] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" }), _jsx("input", { type: "text", placeholder: "Search Ledger...", className: "bg-slate-900/50 border border-slate-800 rounded px-7 py-1 text-[10px] text-slate-300 outline-none focus:border-blue-500/50 transition-colors", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-3", children: records.map(record => (_jsxs("div", { className: "p-3 bg-slate-900/30 border border-slate-800/50 rounded flex items-center justify-between group hover:border-slate-700 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `p-1.5 rounded bg-opacity-20 ${record.type === 'VIOLATION' ? 'bg-red-500 text-red-500' :
                                        record.type === 'HANDSHAKE' ? 'bg-blue-500 text-blue-500' : 'bg-emerald-500 text-emerald-500'}`, children: _jsx(Shield, { className: "w-3.5 h-3.5" }) }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-[10px] font-bold text-slate-200", children: record.file }), _jsxs("span", { className: "text-[8px] text-slate-500 uppercase tracking-tighter", children: [record.type, " \u00B7 ", record.time] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: `text-[10px] font-black ${record.status === 'PURGED' ? 'text-red-400' : 'text-emerald-400'}`, children: record.status }), record.gain && _jsxs("div", { className: "text-[8px] text-slate-500", children: ["Efficiency ", record.gain] })] })] }, record.id))) })] }));
}
