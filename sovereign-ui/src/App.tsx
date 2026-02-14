import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { realDataService } from './realDataService';
import {
  Activity,
  Terminal,
  Zap,
  Lock,
  Unlock,
  TrendingUp,
  Send,
  Loader2,
  Brain,
  Monitor,
  Users,
  Radio,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Target,
  Cpu
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';

import MemoryGraph from './components/MemoryGraph';
import QuantumParameterTuner from './components/QuantumParameterTuner';
import LiveAgentStatus from './components/LiveAgentStatus';
import SignalDensityMonitor from './components/SignalDensityMonitor';

// --- Swarm Data Interface (now uses real data from quantum engine) ---
interface Swarm {
  id: string;
  name: string;
  type: string;
  successRate: number;
  revenue: number;
  tasks: number;
  status: 'online' | 'offline' | 'training' | 'error';
  efficiency: number;
  agents: string[];
  selected: boolean;
  lastResponse?: string;
  executionStatus?: 'pending' | 'executing' | 'completed' | 'failed';
}

// Initial empty state - data will be loaded from realDataService

// --- Lightweight Standalone Components ---
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-slate-900/40 border border-slate-800/50 rounded-xl backdrop-blur-md overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className = "", variant = "default" }: { children: React.ReactNode, className?: string, variant?: string }) => {
  const styles: Record<string, string> = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    outline: "border bg-transparent",
    destructive: "bg-red-500/10 text-red-400 border-red-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "amber-500/10 amber-400 amber-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[variant] || styles.default} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({ children, onClick, className = "", variant = "primary", size = "md", disabled = false }: { children: React.ReactNode, onClick?: () => void, className?: string, variant?: string, size?: string, disabled?: boolean }) => {
  const variants: Record<string, string> = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    outline: "border border-slate-700 hover:bg-slate-800 text-slate-300",
    destructive: "bg-red-600 hover:bg-red-500 text-white",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
    purple: "bg-purple-600 hover:bg-purple-500 text-white"
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${className}`}
    {...props}
  />
);

// --- Swarm Card Component ---
const SwarmCard: React.FC<{
  swarm: Swarm;
  onToggle: (id: string) => void;
  onSendCommand: (id: string, command: string) => void;
  command: string;
  setCommand: (cmd: string) => void;
}> = ({ swarm, onToggle, onSendCommand, command, setCommand }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-red-500';
      case 'training': return 'bg-amber-500';
      case 'error': return 'bg-red-400';
      default: return 'bg-slate-500';
    }
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-400';
    if (rate >= 65) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-slate-900/30 border rounded-xl p-4 transition-all duration-200 ${swarm.selected ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800/50 hover:border-slate-700'
      }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={swarm.selected}
            onChange={() => onToggle(swarm.id)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
          />
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {swarm.name}
              <span className={`w-2 h-2 rounded-full ${getStatusColor(swarm.status)} ${swarm.status === 'online' ? 'animate-pulse' : ''}`} />
            </h4>
            <p className="text-[10px] text-slate-500">{swarm.type}</p>
          </div>
        </div>
        <Badge variant={swarm.status === 'online' ? 'success' : swarm.status === 'error' ? 'destructive' : 'default'}>
          {swarm.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-slate-800/30 rounded-lg">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Success</p>
          <p className={`text-sm font-mono font-bold ${getSuccessColor(swarm.successRate)}`}>{swarm.successRate}%</p>
        </div>
        <div className="text-center p-2 bg-slate-800/30 rounded-lg">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Revenue</p>
          <p className="text-sm font-mono font-bold text-emerald-400">${swarm.revenue.toLocaleString()}</p>
        </div>
        <div className="text-center p-2 bg-slate-800/30 rounded-lg">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tasks</p>
          <p className="text-sm font-mono font-bold text-white">{swarm.tasks}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Efficiency</span>
          <span className="text-[10px] text-slate-400 font-mono">{swarm.efficiency}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${swarm.efficiency}%` }}
          />
        </div>
      </div>

      <div className="mb-3">
        <LiveAgentStatus agents={swarm.agents} />
      </div>

      {swarm.selected && (
        <div className="border-t border-slate-700/50 pt-3 mt-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter command..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="text-xs h-8"
              onKeyDown={(e) => e.key === 'Enter' && onSendCommand(swarm.id, command)}
            />
            <Button
              size="sm"
              variant={swarm.executionStatus === 'executing' ? 'purple' : 'primary'}
              onClick={() => onSendCommand(swarm.id, command)}
              disabled={!command.trim() || swarm.executionStatus === 'executing'}
              className="h-8 px-3"
            >
              {swarm.executionStatus === 'executing' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Radio className="w-3 h-3" />
              )}
            </Button>
          </div>
          {swarm.lastResponse && (
            <div className="mt-2 p-2 bg-slate-800/30 rounded text-[10px] text-slate-400 font-mono">
              <span className="text-indigo-400">→</span> {swarm.lastResponse}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Command Queue Component ---
const CommandQueue: React.FC<{
  commands: Array<{
    id: string;
    swarm: string;
    command: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    timestamp: Date;
  }>;
}> = ({ commands }) => (
  <Card>
    <div className="p-4 border-b border-slate-800/50 flex justify-between items-center">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-400" /> COMMAND QUEUE
      </h3>
      <Badge variant="outline">{commands.length} pending</Badge>
    </div>
    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
      {commands.length === 0 ? (
        <p className="text-[10px] text-slate-500 text-center py-4 italic">No commands in queue</p>
      ) : (
        commands.map((cmd) => (
          <div key={cmd.id} className="flex items-center gap-2 p-2 bg-slate-800/20 rounded-lg text-xs">
            {cmd.status === 'executing' ? (
              <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
            ) : cmd.status === 'completed' ? (
              <CheckCircle className="w-3 h-3 text-emerald-400" />
            ) : cmd.status === 'failed' ? (
              <XCircle className="w-3 h-3 text-red-400" />
            ) : (
              <Clock className="w-3 h-3 text-amber-400" />
            )}
            <span className="text-slate-400 font-bold">{cmd.swarm}</span>
            <span className="text-slate-500 truncate flex-1">{cmd.command}</span>
          </div>
        ))
      )}
    </div>
  </Card>
);

// --- Main App Component ---
function App() {
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [logs, setLogs] = useState<{ timestamp: number; source: string; message: string }[]>([]);
  const [maintenance, setMaintenance] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiChat, setAiChat] = useState<{ id: string, role: 'user' | 'assistant', text: string }[]>([]);
  // Real-time data state
  const [revenueData] = useState<{ time: number; value: number }[]>(
    () => realDataService.getRevenueData()
  );
  const [bridgeStatus, setBridgeStatus] = useState<{ online: boolean; latency: number }>({ online: true, latency: 0 });
  const [compressionRatio, setCompressionRatio] = useState(0.65);

  // Swarm Dashboard State - load from realDataService
  const [swarms, setSwarms] = useState<Swarm[]>(
    () => realDataService.getRealSwarmData().map(s => ({ ...s, selected: false }))
  );
  const [swarmCommand, setSwarmCommand] = useState('');
  const [commandQueue, setCommandQueue] = useState<Array<{
    id: string;
    swarm: string;
    command: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    timestamp: Date;
  }>>([]);
  const [viewMode, setViewMode] = useState<'dashboard' | 'swarm'>('swarm');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const newSocket = io('http://localhost:3001', {
        timeout: 5000,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        console.log('🔗 [Sovereign] Connected to Telemetry Stream');
        setSocketConnected(true);
        setSocketError(false);
      });

      newSocket.on('disconnect', () => {
        setSocketConnected(false);
      });

      newSocket.on('connect_error', (err: Error) => {
        console.warn('Socket connection error:', err.message);
        setSocketConnected(false);
        setSocketError(true);
      });

      newSocket.on('connect_timeout', () => {
        console.warn('Socket connection timeout, running in offline mode');
        setSocketConnected(false);
        setSocketError(true);
      });

      newSocket.on('telemetry', (data: { timestamp: number; source: string; message: string }) => {
        setLogs(prev => [...prev.slice(-100), data]);
      });

      newSocket.on('maintenance', (active: boolean) => {
        setMaintenance(active);
      });

      newSocket.on('reply', (data: { id: string, text: string }) => {
        setAiChat(prev => [...prev, { id: data.id, role: 'assistant', text: data.text }]);
        setIsThinking(false);
      });

      return () => {
        newSocket.close();
      };
    } catch {
      console.warn('Socket connection failed, offline mode active');
      setTimeout(() => setSocketError(true), 0);
    }
  }, []);

  // Initialize real-time data updates
  useEffect(() => {
    const unsubscribe = realDataService.subscribe((data) => {
      if (data.bridgeStatus) setBridgeStatus(data.bridgeStatus);
      if (data.systemMetrics.compressionRatio) setCompressionRatio(data.systemMetrics.compressionRatio);

      setSwarms(prev => {
        const newData = data.swarms;
        // If the number of swarms changed, replace the whole list
        if (newData.length !== prev.length) {
          return newData.map(s => ({ ...s, selected: false }));
        }
        // Otherwise merge updates for existing swarms
        return prev.map(swarm => {
          const updated = newData.find(s => s.id === swarm.id);
          if (updated) {
            return { ...swarm, ...updated };
          }
          return swarm;
        });
      });
    });

    realDataService.startRealTimeUpdates(5000);

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, aiChat]);

  const sendPrompt = () => {
    if (prompt.trim() && socketRef.current) {
      const id = Date.now().toString();
      setAiChat(prev => [...prev, { id, role: 'user', text: prompt }]);
      socketRef.current.emit('prompt', { text: prompt, id });
      setPrompt('');
      setIsThinking(true);
    }
  };

  const toggleMaintenance = () => {
    if (socketRef.current) {
      socketRef.current.emit('toggle_maintenance', !maintenance);
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'loop': return 'border-blue-500/50 text-blue-400';
      case 'intelligence': return 'border-purple-500/50 text-purple-400';
      case 'whatsapp': return 'border-green-500/50 text-green-400';
      default: return 'border-slate-500/50 text-slate-400';
    }
  };

  // Swarm Dashboard Functions
  const toggleSwarmSelection = (id: string) => {
    setSwarms(prev => prev.map(s =>
      s.id === id ? { ...s, selected: !s.selected } : s
    ));
  };

  const sendCommandToSwarm = (id: string, command: string) => {
    const swarm = swarms.find(s => s.id === id);
    if (!swarm || !command.trim()) return;

    const cmdId = `cmd_${Date.now()}`;

    // Add to queue
    setCommandQueue(prev => [...prev, {
      id: cmdId,
      swarm: swarm.name,
      command,
      status: 'executing',
      timestamp: new Date()
    }]);

    // Simulate command execution
    setTimeout(() => {
      setSwarms(prev => prev.map(s =>
        s.id === id ? {
          ...s,
          lastResponse: `Command "${command}" executed successfully`,
          executionStatus: 'completed' as const
        } : s
      ));
      setCommandQueue(prev => prev.map(c =>
        c.id === cmdId ? { ...c, status: 'completed' as const } : c
      ));
    }, 1500 + Math.random() * 2000);

    // Clear command input
    setSwarmCommand('');
  };

  const broadcastToSelected = () => {
    const selectedSwarms = swarms.filter(s => s.selected);
    if (selectedSwarms.length === 0 || !swarmCommand.trim()) return;

    selectedSwarms.forEach(swarm => {
      const cmdId = `cmd_${Date.now()}_${swarm.id}`;
      setCommandQueue(prev => [...prev, {
        id: cmdId,
        swarm: swarm.name,
        command: swarmCommand,
        status: 'executing',
        timestamp: new Date()
      }]);

      setTimeout(() => {
        setSwarms(prev => prev.map(s =>
          s.id === swarm.id ? {
            ...s,
            lastResponse: `Broadcast "${swarmCommand}" received`,
            executionStatus: 'completed' as const
          } : s
        ));
        setCommandQueue(prev => prev.map(c =>
          c.id === cmdId ? { ...c, status: 'completed' as const } : c
        ));
      }, 1000 + Math.random() * 1500);
    });

    setSwarmCommand('');
  };

  const selectAllSwarms = () => {
    setSwarms(prev => prev.map(s => ({ ...s, selected: true })));
  };

  const deselectAllSwarms = () => {
    setSwarms(prev => prev.map(s => ({ ...s, selected: false })));
  };

  const totalRevenue = swarms.reduce((acc, s) => acc + s.revenue, 0);
  const totalTasks = swarms.reduce((acc, s) => acc + s.tasks, 0);
  const avgSuccessRate = Math.round(swarms.reduce((acc, s) => acc + s.successRate, 0) / swarms.length);
  const onlineSwarms = swarms.filter(s => s.status === 'online').length;

  return (
    <div className="h-screen w-screen flex flex-col p-6 space-y-6 overflow-hidden relative">

      {/* --- CONNECTION GUARD SPLASH --- */}
      {!socketConnected && !socketError && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center">
          <div className="flex flex-col items-center space-y-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-slate-900 border border-indigo-500/30 rounded-3xl flex items-center justify-center shadow-2xl">
                <Brain className="w-12 h-12 text-indigo-500 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter text-white">COLLECTING INTELLIGENCE</h2>
              <p className="text-slate-500 text-sm max-w-xs italic font-medium">
                Sovereign Command Center is establishing a secure link to the swarm telemetry relay...
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-xs font-mono text-slate-400">Waiting for Port 3001...</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-white"
              >
                Force Re-synchronization
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- OFFLINE MODE INDICATOR --- */}
      {socketError && (
        <div className="absolute top-4 right-4 z-40 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Offline Mode</span>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
              SOVEREIGN AI COMMAND
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-indigo-400 border-indigo-500/30">NATIVE STANDALONE</Badge>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 bg-slate-900/40 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setViewMode('swarm')}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'swarm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
          >
            Swarm Command
          </button>
        </div>

        <div className="flex gap-3">
          <Button
            variant={maintenance ? "destructive" : "outline"}
            size="sm"
            onClick={toggleMaintenance}
            className="flex items-center gap-2"
          >
            {maintenance ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {maintenance ? "MAINTENANCE ACTIVE" : "NORMAL OPERATION"}
          </Button>
        </div>
      </header>

      {/* --- MAIN GRID --- */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {viewMode === 'dashboard' ? (
          // Original Dashboard View
          <>
            {/* LEFT COL: METRICS & CONTROLS */}
            <div className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
              {/* MEMORY RESONANCE */}
              <MemoryGraph swarms={swarms} />

              {/* QUANTUM TUNER */}
              <QuantumParameterTuner
                onUpdate={(params) => realDataService.tuneQuantum(params)}
                bridgeStatus={bridgeStatus}
              />

              {/* SIGNAL DENSITY MONITOR */}
              <SignalDensityMonitor compressionRatio={compressionRatio} />

              {/* REVENUE CHART */}
              <Card className="flex-1 min-h-[200px] flex flex-col">
                <div className="p-4 border-b border-slate-800/50 flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> PROFIT ASCENSION
                  </h3>
                </div>
                <div className="flex-1 min-h-0 w-full p-2">
                  <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* RIGHT COL: UNIFIED FEED & PROMPT */}
            <div className="col-span-8 flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col min-h-0 border-indigo-500/20">
                <div className="p-4 border-b border-slate-800/50 flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" /> COGNITIVE FEED
                  </h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400">LOOP</Badge>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400">INTEL</Badge>
                    <Badge variant="outline" className="border-green-500/30 text-green-400">BRIDGE</Badge>
                  </div>
                </div>

                {/* FEED AREA */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 scroll-smooth"
                >
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 hover:bg-slate-800/20 py-0.5 px-2 rounded group transition-all">
                      <span className="text-slate-600 w-20 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                      <Badge variant="outline" className={`h-4 text-[8px] px-1 font-bold shrink-0 ${getSourceColor(log.source)}`}>
                        {log.source.toUpperCase()}
                      </Badge>
                      <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                  ))}

                  {/* AI CHAT LAYER */}
                  {aiChat.map((msg, i) => (
                    <div key={i} className={`flex gap-3 py-3 px-3 rounded-lg border my-2 ${msg.role === 'assistant' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-slate-800/30 border-slate-700/50'}`}>
                      <span className="text-slate-600 w-20 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                      <Badge variant="outline" className={`h-4 text-[8px] px-1 font-bold shrink-0 ${msg.role === 'assistant' ? 'border-purple-500/50 text-purple-400' : 'border-blue-400/50 text-blue-400'}`}>
                        {msg.role === 'assistant' ? 'SOVEREIGN' : 'ADMIN'}
                      </Badge>
                      <span className={`text-sm ${msg.role === 'assistant' ? 'text-indigo-200 leading-relaxed' : 'text-slate-300'} italic`}>
                        {msg.text}
                      </span>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex gap-3 py-3 px-3 bg-indigo-500/5 border border-indigo-500/10 animate-pulse rounded-lg my-2">
                      <span className="text-slate-600 w-20 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                      <Badge variant="outline" className="h-4 text-[8px] px-1 font-bold border-purple-500/50 text-purple-400">SOVEREIGN</Badge>
                      <span className="text-indigo-400/50 flex items-center gap-2 text-xs italic">
                        <Loader2 className="w-3 h-3 animate-spin" /> Collapsing probability waves...
                      </span>
                    </div>
                  )}

                  {logs.length === 0 && aiChat.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center space-y-2">
                      <Monitor className="w-8 h-8 opacity-20" />
                      <p className="italic">Waiting for telemetry heartbeat...</p>
                    </div>
                  )}
                </div>

                {/* STANDALONE PROMPT BAR */}
                <div className="p-4 border-t border-slate-800/50 bg-slate-900/40 shrink-0">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-10 group-focus-within:opacity-25 transition-all"></div>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <Brain className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/50" />
                        <Input
                          className="pl-10 h-11 border-slate-700/50 bg-slate-950/80"
                          placeholder="COMMAND THE SWARM..."
                          value={prompt}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendPrompt()}
                        />
                      </div>
                      <Button
                        className="h-11 w-11 flex items-center justify-center"
                        onClick={sendPrompt}
                      >
                        <Send className="w-5 h-5 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : (
          // Swarm Command Dashboard View
          <>
            {/* SWARM COMMAND DASHBOARD */}
            <div className="col-span-12 flex flex-col gap-6 overflow-hidden">
              {/* Overview Stats */}
              <div className="grid grid-cols-5 gap-4 shrink-0">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Registered Swarms</p>
                      <p className="text-xl font-mono font-bold text-white">{swarms.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Online</p>
                      <p className="text-xl font-mono font-bold text-emerald-400">{onlineSwarms}/{swarms.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Success</p>
                      <p className="text-xl font-mono font-bold text-purple-400">{avgSuccessRate}%</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Revenue</p>
                      <p className="text-xl font-mono font-bold text-amber-400">${totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Tasks</p>
                      <p className="text-xl font-mono font-bold text-blue-400">{totalTasks}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Command Input Bar */}
              <Card className="p-4 shrink-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-bold text-white">BROADCAST COMMAND</span>
                  </div>
                  <Input
                    placeholder="Enter command to broadcast to selected swarms..."
                    value={swarmCommand}
                    onChange={(e) => setSwarmCommand(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && broadcastToSelected()}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllSwarms}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllSwarms}
                    >
                      Deselect All
                    </Button>
                    <Button
                      variant="success"
                      size="lg"
                      onClick={broadcastToSelected}
                      disabled={swarms.filter(s => s.selected).length === 0 || !swarmCommand.trim()}
                      className="min-w-[180px]"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Broadcast ({swarms.filter(s => s.selected).length})
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Main Content: Swarm Grid & Command Queue */}
              <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
                {/* Swarm Grid */}
                <div className="col-span-8 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    {swarms.map((swarm) => (
                      <SwarmCard
                        key={swarm.id}
                        swarm={swarm}
                        onToggle={toggleSwarmSelection}
                        onSendCommand={sendCommandToSwarm}
                        command={swarmCommand}
                        setCommand={setSwarmCommand}
                      />
                    ))}
                  </div>
                </div>

                {/* Command Queue & Response Panel */}
                <div className="col-span-4 flex flex-col gap-4 min-h-0">
                  <CommandQueue commands={commandQueue} />

                  <Card className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-slate-800/50 flex justify-between items-center">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" /> SWARM RESPONSES
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {swarms.filter(s => s.lastResponse).map((swarm) => (
                        <div key={swarm.id} className="p-3 bg-slate-800/20 rounded-lg border border-slate-700/30">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-indigo-400">{swarm.name}</span>
                            <Badge variant="success" className="text-[8px]">COMPLETED</Badge>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">{swarm.lastResponse}</p>
                        </div>
                      ))}
                      {swarms.filter(s => s.lastResponse).length === 0 && (
                        <p className="text-[10px] text-slate-500 text-center py-8 italic">
                          No responses yet. Send commands to see swarm outputs here.
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- FOOTER --- */}
      <footer className="flex justify-between items-center px-2 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] shrink-0">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            SCC SERVER: ONLINE
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
            RELAY PORT: 3001
          </div>
        </div>
        <div>
          © 2026 SOVEREIGN AI ECOSYSTEM
        </div>
      </footer>
    </div>
  );
}

export default App;
