import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Zap, Terminal, Lock, Unlock, Globe, Smartphone, Cpu, TrendingUp, Send, Loader2, Brain } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import SignalDensityDisplay from '@/components/common/SignalDensityDisplay';
const SocketContext = React.createContext(null);
const socketUrl = import.meta.env.VITE_WS_URL;
const AdminSovereign = () => {
    const [socket, setSocket] = useState(null);
    const [logs, setLogs] = useState([]);
    const [maintenance, setMaintenance] = useState(false);
    const [isNative, setIsNative] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [revenueData, setRevenueData] = useState([]);
    const [status, setStatus] = useState({ overall: 0, reasoning: 0, learning: 0, creativity: 0, gain: 0, phase: 'IDLE', bridge: { online: true, latency: 0 } });
    const [bridgeStatus, setBridgeStatus] = useState({ online: true, latency: 0 });
    const [compressionRatio, setCompressionRatio] = useState(0.65);
    const [aiChat, setAiChat] = useState([]);
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef(null);
    useEffect(() => {
        if (!socketUrl) {
            return;
        }
        const newSocket = io(socketUrl);
        setSocket(newSocket);
        // Check if running in Electron
        const isElectron = /electron/i.test(navigator.userAgent);
        setIsNative(isElectron);
        newSocket.on('init', (data) => {
            setLogs(data.logs);
            setMaintenance(data.maintenance);
        });
        newSocket.on('log', (entry) => {
            setLogs(prev => [...prev.slice(-499), entry]);
        });
        newSocket.on('status', (newStatus) => {
            setStatus(newStatus);
            setRevenueData(prev => [...prev.slice(-29), { time: new Date().toLocaleTimeString(), val: newStatus.overall * 100 }]);
        });
        newSocket.on('maintenance', (active) => {
            setMaintenance(active);
        });
        newSocket.on('bridge_update', (data) => {
            setBridgeStatus({ online: data.online, latency: data.latency });
            if (data.compression)
                setCompressionRatio(data.compression);
        });
        newSocket.on('swarm_state', (state) => {
            if (state.bridge)
                setBridgeStatus(state.bridge);
        });
        newSocket.on('reply', (data) => {
            setAiChat(prev => [...prev, { id: data.id, role: 'assistant', text: data.text }]);
            setIsThinking(false);
        });
        return () => {
            newSocket.close();
        };
    }, []);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);
    const toggleMaintenance = () => {
        socket?.emit('command', { action: maintenance ? 'MAINTENANCE_OFF' : 'MAINTENANCE_ON' });
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#020817] text-slate-50 p-6 font-sans", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent italic", children: "SOVEREIGN COMMAND CENTER" }), _jsxs("p", { className: "text-slate-400 flex items-center gap-2 text-sm mt-1", children: [_jsx(Globe, { className: "w-4 h-4 text-indigo-500 animate-pulse" }), "AUTONOMOUS INTELLIGENCE INTERFACE v3.0"] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [isNative && (_jsx(Badge, { variant: "outline", className: "py-1 px-3 border-indigo-500/50 text-indigo-400 bg-indigo-500/10", children: "NATIVE SHELL ACTIVE" })), _jsx(Badge, { variant: "outline", className: `py-1 px-3 border-2 ${maintenance ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'}`, children: maintenance ? 'MAINTENANCE MODE ACTIVE' : 'REAL-TIME OPS ACTIVE' }), _jsxs(Button, { variant: "outline", size: "sm", onClick: toggleMaintenance, className: `font-bold transition-all ${maintenance ? 'hover:bg-emerald-500/20 border-emerald-500/50' : 'hover:bg-amber-500/20 border-amber-500/50'}`, children: [maintenance ? _jsx(Unlock, { className: "w-4 h-4 mr-2" }) : _jsx(Lock, { className: "w-4 h-4 mr-2" }), maintenance ? 'RESUME SWARM' : 'WARM RESTART'] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6", children: [_jsxs(Card, { className: "lg:col-span-3 bg-slate-900/50 border-slate-800 backdrop-blur-xl border-2", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2", children: [_jsx(Cpu, { className: "w-4 h-4" }), " INTELLIGENCE MATRIX"] }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "text-center py-4", children: [_jsxs("div", { className: "text-6xl font-black text-indigo-400 tracking-tighter", children: [Math.round(status.overall * 100), "%"] }), _jsx("div", { className: "text-xs font-bold text-slate-500 mt-1", children: "CORE COHERENCE" })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(StatBar, { label: "Reasoning", value: status.reasoning * 100, color: "bg-blue-500" }), _jsx(StatBar, { label: "Learning", value: status.learning * 100, color: "bg-emerald-500" }), _jsx(StatBar, { label: "Creativity", value: status.creativity * 100, color: "bg-purple-500" }), _jsx(StatBar, { label: "Gain Rate", value: status.gain * 100, color: "bg-amber-500" })] }), _jsxs("div", { className: "pt-4 border-t border-slate-800", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-widest", children: "Bridge Resonance" }), _jsx(Badge, { variant: "outline", className: `text-[8px] ${bridgeStatus.online ? 'border-indigo-500 text-indigo-400' : 'border-red-500 text-red-400'}`, children: bridgeStatus.online ? 'STABLE' : 'UNSTABLE' })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${bridgeStatus.online ? 'bg-indigo-400 animate-pulse' : 'bg-red-500'}` }), _jsxs("span", { className: "text-xl font-mono font-bold text-white", children: [bridgeStatus.latency, "ms"] }), _jsx("span", { className: "text-[8px] text-slate-600 font-bold", children: "LATENCY" })] })] }), _jsx(SignalDensityDisplay, { compressionRatio: compressionRatio })] })] }), _jsxs(Card, { className: "lg:col-span-6 bg-slate-900/50 border-slate-800 backdrop-blur-xl border-2", children: [_jsxs(CardHeader, { className: "pb-2 flex flex-row items-center justify-between", children: [_jsx("div", { children: _jsxs(CardTitle, { className: "text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), " SWARM TELEMETRY"] }) }), _jsxs(Badge, { className: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", children: ["Phase: ", status.phase] })] }), _jsx(CardContent, { className: "h-[300px] w-full pt-4", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: revenueData, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorVal", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#6366f1", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#6366f1", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#1e293b", vertical: false }), _jsx(XAxis, { dataKey: "time", stroke: "#475569", fontSize: 10, hide: true }), _jsx(YAxis, { stroke: "#475569", fontSize: 10, domain: [0, 100] }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }, itemStyle: { color: '#818cf8' } }), _jsx(Area, { type: "monotone", dataKey: "val", stroke: "#818cf8", strokeWidth: 3, fillOpacity: 1, fill: "url(#colorVal)", animationDuration: 500 })] }) }) })] }), _jsxs(Card, { className: "lg:col-span-3 bg-slate-900/50 border-slate-800 backdrop-blur-xl border-2 overflow-hidden relative group", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" }), _jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2", children: [_jsx(Smartphone, { className: "w-4 h-4" }), " MOBILE SYNC"] }) }), _jsxs(CardContent, { className: "flex flex-col items-center justify-center h-full pb-8", children: [_jsx("div", { className: "w-32 h-32 bg-white/5 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center mb-4 transition-all group-hover:border-indigo-500/50", children: _jsx(Zap, { className: "w-12 h-12 text-slate-700 group-hover:text-indigo-400 group-hover:animate-pulse transition-colors" }) }), _jsx("p", { className: "text-[10px] text-slate-500 text-center px-4 uppercase tracking-tighter leading-tight font-bold", children: "ACCESS SECURE TUNNEL VIA CLOUDFLARE TO SYNC WITH IPHONE" })] })] }), _jsxs(Card, { className: "lg:col-span-12 bg-[#020617] border-slate-800 border-2 overflow-hidden shadow-2xl", children: [_jsxs("div", { className: "bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Terminal, { className: "w-3 h-3 text-emerald-500" }), _jsx("span", { className: "text-[10px] font-bold tracking-widest uppercase text-slate-400", children: "UNIFIED INTELLIGENCE STREAM" })] }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-slate-700" }), _jsx("div", { className: "w-2 h-2 rounded-full bg-slate-700" }), _jsx("div", { className: "w-2 h-2 rounded-full bg-slate-700" })] })] }), _jsxs(CardContent, { className: "p-0", children: [_jsx(ScrollArea, { className: "h-[400px] w-full p-4 font-mono text-xs", ref: scrollRef, children: _jsxs("div", { className: "space-y-1", children: [logs.map((log, i) => (_jsxs("div", { className: "flex gap-3 hover:bg-slate-900/50 transition-colors py-0.5 px-2 rounded", children: [_jsxs("span", { className: "text-slate-600 w-24 shrink-0", children: ["[", new Date(log.timestamp).toLocaleTimeString(), "]"] }), _jsx(Badge, { variant: "outline", className: `h-4 text-[9px] px-1 font-bold ${getSourceColor(log.source)}`, children: log.source.toUpperCase() }), _jsx("span", { className: "text-slate-300 break-all", children: log.message })] }, i))), aiChat.map((msg, i) => (_jsxs("div", { className: `flex gap-3 py-2 px-2 rounded ${msg.role === 'assistant' ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'bg-slate-800/30'}`, children: [_jsxs("span", { className: "text-slate-600 w-24 shrink-0", children: ["[", new Date().toLocaleTimeString(), "]"] }), _jsx(Badge, { variant: "outline", className: `h-4 text-[9px] px-1 font-bold ${msg.role === 'assistant' ? 'border-purple-500/50 text-purple-400' : 'border-blue-400/50 text-blue-400'}`, children: msg.role === 'assistant' ? 'SOVEREIGN' : 'ADMIN' }), _jsx("span", { className: `${msg.role === 'assistant' ? 'text-indigo-300' : 'text-slate-300'} italic`, children: msg.text })] }, i))), isThinking && (_jsxs("div", { className: "flex gap-3 py-2 px-2 bg-indigo-500/5 animate-pulse", children: [_jsxs("span", { className: "text-slate-600 w-24 shrink-0", children: ["[", new Date().toLocaleTimeString(), "]"] }), _jsx(Badge, { variant: "outline", className: "h-4 text-[9px] px-1 font-bold border-purple-500/50 text-purple-400", children: "SOVEREIGN" }), _jsxs("span", { className: "text-indigo-400/50 flex items-center gap-2", children: [_jsx(Loader2, { className: "w-3 h-3 animate-spin" }), " Collapsing probability waves..."] })] })), logs.length === 0 && aiChat.length === 0 && (_jsx("div", { className: "text-slate-600 italic", children: "Waiting for telemetry heartbeat..." }))] }) }), _jsxs("div", { className: "border-t border-slate-800 p-3 bg-slate-900/50 flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Brain, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/50" }), _jsx(Input, { className: "bg-slate-950 border-slate-800 pl-10 text-xs focus-visible:ring-indigo-500", placeholder: "COMMAND THE SWARM...", value: prompt, onChange: (e) => setPrompt(e.target.value), onKeyDown: (e) => {
                                                            if (e.key === 'Enter' && prompt.trim()) {
                                                                const id = Date.now().toString();
                                                                setAiChat(prev => [...prev, { id, role: 'user', text: prompt }]);
                                                                socket?.emit('prompt', { text: prompt, id });
                                                                setPrompt('');
                                                                setIsThinking(true);
                                                            }
                                                        } })] }), _jsx(Button, { size: "sm", className: "bg-indigo-600 hover:bg-indigo-500", onClick: () => {
                                                    if (prompt.trim()) {
                                                        const id = Date.now().toString();
                                                        setAiChat(prev => [...prev, { id, role: 'user', text: prompt }]);
                                                        socket?.emit('prompt', { text: prompt, id });
                                                        setPrompt('');
                                                        setIsThinking(true);
                                                    }
                                                }, children: _jsx(Send, { className: "w-4 h-4" }) })] })] })] })] }), _jsxs("div", { className: "mt-8 pt-6 border-t border-slate-900 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold text-slate-700", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx(Shield, { className: "w-3 h-3" }), " REALITY MODE: TRUE"] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx(Zap, { className: "w-3 h-3 text-amber-500" }), " AUTONOMY LEVEL: SINGULARITY"] })] }), _jsx("div", { children: "SECURE CONNECTION: SHA-256 ENCRYPTED" })] })] }));
};
const StatBar = ({ label, value, color }) => (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400", children: [_jsx("span", { children: label }), _jsxs("span", { children: [Math.round(value), "%"] })] }), _jsx("div", { className: "h-1.5 w-full bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${color} transition-all duration-1000`, style: { width: `${value}%` } }) })] }));
const getSourceColor = (source) => {
    switch (source) {
        case 'agents': return 'border-blue-500/50 text-blue-400 bg-blue-500/10';
        case 'hyper_v2': return 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10';
        case 'universal': return 'border-purple-500/50 text-purple-400 bg-purple-500/10';
        case 'whatsapp': return 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10';
        default: return 'border-slate-500/50 text-slate-400 bg-slate-500/10';
    }
};
export default AdminSovereign;
