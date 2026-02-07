
import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Loader } from 'lucide-react';

const GodModeTerminal = () => {
    const [logs, setLogs] = useState([
        { type: 'info', text: 'Initializing God Mode Uplink...', timestamp: new Date().toISOString() },
        { type: 'success', text: 'Connection Established.', timestamp: new Date().toISOString() }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Polling for updates (Mocked for now, in real app would fetch from API/Entity)
    useEffect(() => {
        const interval = setInterval(() => {
            // In a real implementation, this would fetch the latest "AuditLog" entries tagged with [GOD_MODE]
            // For this demo, we simulate occasional "thinking" logs if processing
            if (Math.random() > 0.9) {
                setLogs(prev => [...prev, { type: 'info', text: 'System Check: All systems nominal.', timestamp: new Date().toISOString() }]);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCommand = async () => {
        if (!input.trim()) return;

        const command = input;
        setInput('');
        setIsProcessing(true);

        // Add user command to log
        setLogs(prev => [...prev, { type: 'command', text: `> ${command}`, timestamp: new Date().toISOString() }]);

        // Simulate sending command to God Mode Bot (via TODO.md or API)
        // In a real deployed version, we would POST to an endpoint that writes to the Queue
        try {
            // Simulating the "write to TODO" delay
            setTimeout(() => {
                setLogs(prev => [...prev, { type: 'info', text: `[GOD_MODE] Task received: "${command}"`, timestamp: new Date().toISOString() }]);
                setLogs(prev => [...prev, { type: 'info', text: `[GOD_MODE] Analyzing requirements...`, timestamp: new Date().toISOString() }]);
                setIsProcessing(false);
            }, 1500);
        } catch (e) {
            setLogs(prev => [...prev, { type: 'error', text: `Transmission Failed: ${e.message}`, timestamp: new Date().toISOString() }]);
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCommand();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-green-400 font-mono p-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-green-800 pb-2 mb-4">
                <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-green-500" />
                    <h1 className="text-xl font-bold tracking-widest">GOD_MODE // TERMINAL_UPLINK</h1>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span>ONLINE</span>
                </div>
            </div>

            {/* Log Output */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-black">
                {logs.map((log, i) => (
                    <div key={i} className={`flex gap-2 text-sm ${log.type === 'error' ? 'text-red-500' : log.type === 'command' ? 'text-white font-bold' : 'text-green-400'}`}>
                        <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span>{log.text}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="relative">
                <div className="absolute left-0 top-3 text-green-600 pl-3">{'>'}</div>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-gray-900 border border-green-800 rounded p-3 pl-8 text-green-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    placeholder="Enter command for Autonomous Agent..."
                    autoFocus
                />
                <button
                    onClick={handleCommand}
                    disabled={isProcessing}
                    className="absolute right-2 top-2 p-1 bg-green-900 hover:bg-green-800 text-green-100 rounded transition-colors disabled:opacity-50"
                >
                    {isProcessing ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>

            <div className="text-xs text-green-800 mt-2 text-center">
                CAUTION: AUTHORIZED PERSONNEL ONLY. ALL COMMANDS ARE LOGGED AND EXECUTED WITH FULL PRIVILEGES.
            </div>
        </div>
    );
};

export default GodModeTerminal;
