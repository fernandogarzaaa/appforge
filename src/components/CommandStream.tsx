import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Zap, Cpu } from 'lucide-react';

export default function CommandStream() {
    const [input, setInput] = useState('');
    const [prediction, setPrediction] = useState('');
    const [load, setLoad] = useState(12);

    const commands = [
        'SOVEREIGN_AUDIT',
        'HEAL_BACKLOG',
        'KERNEL_BLESS',
        'ORACLE_SYNC',
        'AXIOM_RELOAD',
        'FACTORY_IGNITE'
    ];

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);

        if (val.length > 0) {
            const found = commands.find(c => c.startsWith(val.toUpperCase()));
            setPrediction(found ? found.slice(val.length) : '');
        } else {
            setPrediction('');
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setLoad(prev => Math.max(5, Math.min(85, prev + (Math.random() - 0.5) * 10)));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#020617]/80 backdrop-blur-xl border border-slate-800 rounded-lg overflow-hidden font-mono">
            <div className="h-8 border-b border-slate-800 flex items-center justify-between px-3 bg-[#1e293b]/30">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Terminal className="w-3 h-3" />
                    Command Stream
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-500/70">{load.toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs">
                <div className="text-slate-500">AppForge Sovereign Kernel [v1.0.0-PROD]</div>
                <div className="text-emerald-400">&gt; Kernel initialized via Truth Anchor.</div>
                <div className="text-blue-400">&gt; Pulse synchronization complete.</div>
                <div className="text-slate-300 flex gap-2">
                    <span className="text-blue-500">§</span>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            className="bg-transparent border-none outline-none w-full text-slate-200 caret-blue-500"
                            value={input}
                            onChange={handleInput}
                            spellCheck={false}
                            autoFocus
                        />
                        <span className="absolute left-0 pointer-events-none text-slate-600">
                            <span className="invisible">{input}</span>
                            {prediction}
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-1 bg-slate-900 overflow-hidden">
                <div
                    className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6] transition-all duration-300"
                    style={{ width: `${load}%` }}
                />
            </div>
        </div>
    );
}
