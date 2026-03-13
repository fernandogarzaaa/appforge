import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { startRaydiumScanner } from '../raydium_scanner';
import { Shield, Eye, Lock } from 'lucide-react';
import { useWallet } from '../../../stubs/solana-adapters';
const RaydiumScout = () => {
    const { connected } = useWallet();
    const [events, setEvents] = useState([]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    useEffect(() => {
        if (!connected)
            return;
        const stopScanner = startRaydiumScanner((event) => {
            setEvents(prev => [event, ...prev].slice(0, 50));
        });
        return () => stopScanner();
    }, [connected]);
    return (_jsxs("div", { className: "flex flex-col h-full text-slate-300 font-mono text-[10px]", children: [_jsx("div", { className: "flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-800", children: !connected ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full gap-4 text-center px-4", children: [_jsx("div", { className: "p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20", children: _jsx(Shield, { className: "w-8 h-8 text-indigo-500" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-white font-black tracking-widest uppercase", children: "Encryption Locked" }), _jsx("div", { className: "text-slate-500 leading-relaxed italic", children: "Synchronize Sovereign Wallet to decrypt Raydium liquidity signals." })] })] })) : events.length === 0 ? (_jsx("div", { className: "flex flex-col items-center justify-center h-full opacity-30 italic", children: _jsx("span", { className: "animate-pulse", children: "Waiting for chain signals..." }) })) : (events.map((event, i) => (_jsxs("div", { className: "p-2 border border-slate-800 bg-slate-900/50 rounded flex flex-col gap-1", children: [_jsxs("div", { className: "flex justify-between items-center text-purple-400 font-bold uppercase tracking-tighter", children: [_jsx("span", { children: "\uD83D\uDEA8 NEW LIQUIDITY POOL" }), _jsxs("span", { className: "text-slate-500 font-normal", children: ["SLOT: ", event.slot] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-slate-500", children: "MINT:" }), _jsx("span", { className: `transition-all duration-500 ${!isUnlocked ? 'blur-[4px] select-none' : ''}`, children: event.signature })] }), _jsxs("div", { className: "text-slate-600 text-[8px]", children: ["DETECTED: ", new Date(event.timestamp).toLocaleTimeString()] })] }, i)))) }), _jsx("div", { className: "mt-4 pt-4 border-t border-slate-800/50", children: !connected ? (_jsx("div", { className: "w-full py-3 bg-slate-900 border border-slate-800 text-slate-600 font-black rounded uppercase tracking-widest text-center", children: "Awaiting Linkage" })) : !isUnlocked ? (_jsxs("button", { onClick: () => setIsUnlocked(true), className: "w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 group", children: [_jsx(Lock, { className: "w-4 h-4 group-hover:scale-110 transition-transform" }), "Unlock Feed (0.1 SOL)"] })) : (_jsxs("div", { className: "w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center font-black uppercase tracking-widest rounded flex items-center justify-center gap-2", children: [_jsx(Eye, { className: "w-3 h-3" }), " Signal Active"] })) })] }));
};
export default RaydiumScout;
