import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Activity,
    Shield,
    Zap,
    Terminal,
    Lock,
    Unlock,
    RefreshCw,
    Globe,
    Smartphone,
    Cpu,
    TrendingUp,
    AlertTriangle,
    Send,
    Loader2,
    Brain
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const SocketContext = React.createContext<any>(null);

const AdminSovereign = () => {
    const [socket, setSocket] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [maintenance, setMaintenance] = useState(false);
    const [isNative, setIsNative] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [aiChat, setAiChat] = useState<{ id: string, role: 'user' | 'assistant', text: string }[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
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

    return (
        <div className="min-h-screen bg-[#020817] text-slate-50 p-6 font-sans">
            {/* 🌌 HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent italic">
                        SOVEREIGN COMMAND CENTER
                    </h1>
                    <p className="text-slate-400 flex items-center gap-2 text-sm mt-1">
                        <Globe className="w-4 h-4 text-indigo-500 animate-pulse" />
                        AUTONOMOUS INTELLIGENCE INTERFACE v3.0
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isNative && (
                        <Badge variant="outline" className="py-1 px-3 border-indigo-500/50 text-indigo-400 bg-indigo-500/10">
                            NATIVE SHELL ACTIVE
                        </Badge>
                    )}
                    <Badge variant="outline" className={`py-1 px-3 border-2 ${maintenance ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'}`}>
                        {maintenance ? 'MAINTENANCE MODE ACTIVE' : 'REAL-TIME OPS ACTIVE'}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleMaintenance}
                        className={`font-bold transition-all ${maintenance ? 'hover:bg-emerald-500/20 border-emerald-500/50' : 'hover:bg-amber-500/20 border-amber-500/50'}`}
                    >
                        {maintenance ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                        {maintenance ? 'RESUME SWARM' : 'WARM RESTART'}
                    </Button>
                </div>
            </div>

            {/* 📊 GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6">

                {/* 🧠 INTELLIGENCE MATRIX */}
                <Card className="lg:col-span-3 bg-slate-900/50 border-slate-800 backdrop-blur-xl border-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Cpu className="w-4 h-4" /> INTELLIGENCE MATRIX
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center py-4">
                            <div className="text-6xl font-black text-indigo-400 tracking-tighter">
                                {Math.round(status.overall * 100)}%
                            </div>
                            <div className="text-xs font-bold text-slate-500 mt-1">CORE COHERENCE</div>
                        </div>
                        <div className="space-y-4">
                            <StatBar label="Reasoning" value={status.reasoning * 100} color="bg-blue-500" />
                            <StatBar label="Learning" value={status.learning * 100} color="bg-emerald-500" />
                            <StatBar label="Creativity" value={status.creativity * 100} color="bg-purple-500" />
                            <StatBar label="Gain Rate" value={status.gain * 100} color="bg-amber-500" />
                        </div>
                    </CardContent>
                </Card>

                {/* 📈 REAL-TIME TELEMETRY */}
                <Card className="lg:col-span-6 bg-slate-900/50 border-slate-800 backdrop-blur-xl border-2">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> SWARM TELEMETRY
                            </CardTitle>
                        </div>
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">Phase: {status.phase}</Badge>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="time" stroke="#475569" fontSize={10} hide />
                                <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#818cf8' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="val"
                                    stroke="#818cf8"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorVal)"
                                    animationDuration={500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 📱 MOBILE SYNC */}
                <Card className="lg:col-span-3 bg-slate-900/50 border-slate-800 backdrop-blur-xl border-2 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Smartphone className="w-4 h-4" /> MOBILE SYNC
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-full pb-8">
                        <div className="w-32 h-32 bg-white/5 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center mb-4 transition-all group-hover:border-indigo-500/50">
                            <Zap className="w-12 h-12 text-slate-700 group-hover:text-indigo-400 group-hover:animate-pulse transition-colors" />
                        </div>
                        <p className="text-[10px] text-slate-500 text-center px-4 uppercase tracking-tighter leading-tight font-bold">
                            ACCESS SECURE TUNNEL VIA CLOUDFLARE TO SYNC WITH IPHONE
                        </p>
                    </CardContent>
                </Card>

                {/* 🖥️ COMMAND TERMINAL (FULL WIDTH) */}
                <Card className="lg:col-span-12 bg-[#020617] border-slate-800 border-2 overflow-hidden shadow-2xl">
                    <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">UNIFIED INTELLIGENCE STREAM</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px] w-full p-4 font-mono text-xs" ref={scrollRef}>
                            <div className="space-y-1">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-3 hover:bg-slate-900/50 transition-colors py-0.5 px-2 rounded">
                                        <span className="text-slate-600 w-24 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <Badge variant="outline" className={`h-4 text-[9px] px-1 font-bold ${getSourceColor(log.source)}`}>
                                            {log.source.toUpperCase()}
                                        </Badge>
                                        <span className="text-slate-300 break-all">{log.message}</span>
                                    </div>
                                ))}

                                {/* 🧠 AI CHAT LAYER */}
                                {aiChat.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 py-2 px-2 rounded ${msg.role === 'assistant' ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'bg-slate-800/30'}`}>
                                        <span className="text-slate-600 w-24 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                        <Badge variant="outline" className={`h-4 text-[9px] px-1 font-bold ${msg.role === 'assistant' ? 'border-purple-500/50 text-purple-400' : 'border-blue-400/50 text-blue-400'}`}>
                                            {msg.role === 'assistant' ? 'SOVEREIGN' : 'ADMIN'}
                                        </Badge>
                                        <span className={`${msg.role === 'assistant' ? 'text-indigo-300' : 'text-slate-300'} italic`}>{msg.text}</span>
                                    </div>
                                ))}

                                {isThinking && (
                                    <div className="flex gap-3 py-2 px-2 bg-indigo-500/5 animate-pulse">
                                        <span className="text-slate-600 w-24 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                        <Badge variant="outline" className="h-4 text-[9px] px-1 font-bold border-purple-500/50 text-purple-400">SOVEREIGN</Badge>
                                        <span className="text-indigo-400/50 flex items-center gap-2">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Collapsing probability waves...
                                        </span>
                                    </div>
                                )}

                                {logs.length === 0 && aiChat.length === 0 && (
                                    <div className="text-slate-600 italic">Waiting for telemetry heartbeat...</div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* 🕹️ SOVEREIGN PROMPT BAR */}
                        <div className="border-t border-slate-800 p-3 bg-slate-900/50 flex gap-2">
                            <div className="relative flex-1">
                                <Brain className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/50" />
                                <Input
                                    className="bg-slate-950 border-slate-800 pl-10 text-xs focus-visible:ring-indigo-500"
                                    placeholder="COMMAND THE SWARM..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && prompt.trim()) {
                                            const id = Date.now().toString();
                                            setAiChat(prev => [...prev, { id, role: 'user', text: prompt }]);
                                            socket?.emit('prompt', { text: prompt, id });
                                            setPrompt('');
                                            setIsThinking(true);
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-500"
                                onClick={() => {
                                    if (prompt.trim()) {
                                        const id = Date.now().toString();
                                        setAiChat(prev => [...prev, { id, role: 'user', text: prompt }]);
                                        socket?.emit('prompt', { text: prompt, id });
                                        setPrompt('');
                                        setIsThinking(true);
                                    }
                                }}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* 🛡️ REALITY FOOTER */}
            <div className="mt-8 pt-6 border-t border-slate-900 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold text-slate-700">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> REALITY MODE: TRUE</span>
                    <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" /> AUTONOMY LEVEL: SINGULARITY</span>
                </div>
                <div>SECURE CONNECTION: SHA-256 ENCRYPTED</div>
            </div>
        </div>
    );
};

const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>{label}</span>
            <span>{Math.round(value)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
        </div>
    </div>
);

const getSourceColor = (source: string) => {
    switch (source) {
        case 'agents': return 'border-blue-500/50 text-blue-400 bg-blue-500/10';
        case 'hyper_v2': return 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10';
        case 'universal': return 'border-purple-500/50 text-purple-400 bg-purple-500/10';
        case 'whatsapp': return 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10';
        default: return 'border-slate-500/50 text-slate-400 bg-slate-500/10';
    }
};

export default AdminSovereign;
