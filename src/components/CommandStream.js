import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu } from 'lucide-react';
import { io } from 'socket.io-client';
const socketUrl = import.meta.env.VITE_WS_URL;
const socket = socketUrl ? io(socketUrl) : null;
export default function CommandStream() {
    const [input, setInput] = useState('');
    const [prediction, setPrediction] = useState('');
    const [load, setLoad] = useState(12);
    const [history, setHistory] = useState([
        'AppForge Sovereign Kernel [v1.0.2-PROD]',
        '> Kernel initialized via Truth Anchor.',
        '> Pulse synchronization complete.'
    ]);
    const commands = [
        'SOVEREIGN_AUDIT',
        'HEAL_BACKLOG',
        'KERNEL_BLESS',
        'ORACLE_SYNC',
        'AXIOM_RELOAD',
        'FACTORY_IGNITE',
        'STATUS',
        'PING'
    ];
    useEffect(() => {
        if (!socket)
            return;
        socket.on('reply', (data) => {
            const lines = data.text.split('\n');
            setHistory(prev => [...prev, ...lines.map(l => `> ${l}`)]);
        });
        return () => {
            socket.off('reply');
        };
    }, []);
    const handleInput = (e) => {
        const val = e.target.value;
        setInput(val);
        if (val.length > 0) {
            const found = commands.find(c => c.startsWith(val.toUpperCase()));
            setPrediction(found ? found.slice(val.length) : '');
        }
        else {
            setPrediction('');
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && input.trim()) {
            const cmd = input.trim();
            setHistory(prev => [...prev, `§ ${cmd}`]);
            if (socket) {
                socket.emit('prompt', { text: cmd, id: Date.now().toString() });
            }
            else {
                setHistory(prev => [...prev, '> Real-time channel unavailable (VITE_WS_URL not configured).']);
            }
            setInput('');
            setPrediction('');
        }
    };
    useEffect(() => {
        const interval = setInterval(() => {
            setLoad(prev => Math.max(5, Math.min(85, prev + (Math.random() - 0.5) * 10)));
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const scrollRef = useRef(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);
    return (_jsxs("div", { className: "flex flex-col h-full bg-[#020617]/80 backdrop-blur-xl border border-slate-800 rounded-lg overflow-hidden font-mono", children: [_jsxs("div", { className: "h-8 border-b border-slate-800 flex items-center justify-between px-3 bg-[#1e293b]/30", children: [_jsxs("div", { className: "flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest", children: [_jsx(Terminal, { className: "w-3 h-3" }), "Command Stream"] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Cpu, { className: "w-3 h-3 text-emerald-500" }), _jsxs("span", { className: "text-[10px] text-emerald-500/70", children: [load.toFixed(0), "%"] })] }) })] }), _jsxs("div", { ref: scrollRef, className: "flex-1 p-4 overflow-y-auto space-y-1 text-[10px] leading-relaxed", children: [history.map((line, i) => (_jsx("div", { className: line.startsWith('§') ? 'text-blue-400 font-bold' :
                            line.startsWith('>') ? 'text-emerald-400/80' : 'text-slate-500', children: line }, i))), _jsxs("div", { className: "text-slate-300 flex gap-2 pt-1", children: [_jsx("span", { className: "text-blue-500 font-bold", children: "\u00A7" }), _jsxs("div", { className: "relative flex-1", children: [_jsx("input", { type: "text", className: "bg-transparent border-none outline-none w-full text-slate-200 caret-blue-500", value: input, onChange: handleInput, onKeyDown: handleKeyDown, spellCheck: false, autoFocus: true }), _jsxs("span", { className: "absolute left-0 pointer-events-none text-slate-600", children: [_jsx("span", { className: "invisible", children: input }), prediction] })] })] })] }), _jsx("div", { className: "h-1 bg-slate-900 overflow-hidden", children: _jsx("div", { className: "h-full bg-blue-500 shadow-[0_0_10px_#3b82f6] transition-all duration-300", style: { width: `${load}%` } }) })] }));
}
