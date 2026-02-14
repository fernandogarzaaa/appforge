import React, { useEffect, useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Cpu, Zap, Loader2, Binary } from 'lucide-react';

interface LogEntry {
    timestamp: string;
    agent: string;
    msg: string;
    severity: string;
}

interface SafetyAuditProps {
    logs: LogEntry[];
}

const SafetyAudit: React.FC<SafetyAuditProps> = ({ logs }) => {
    const [auditStatus, setAuditStatus] = useState<'IDLE' | 'ANALYZING' | 'SECURE' | 'VIOLATION'>('IDLE');
    const [activePaths, setActivePaths] = useState<string[]>([]);
    const [oracleLogs, setOracleLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        // Filter for Q-CORE, QUANTUM_ENGINE, and Rust logs
        const relevant = logs.filter(l =>
            ['Q-CORE', 'QUANTUM_ENGINE', 'RUST_BRIDGE', 'ORACLE'].includes(l.agent)
        ).slice(0, 5);
        setOracleLogs(relevant);

        // Analyze current swarm state
        const lastLog = logs[0]; // Assuming logs are sorted newest first
        if (lastLog) {
            if (lastLog.msg.includes('Superposition')) {
                setAuditStatus('ANALYZING');
                setActivePaths(['Alpha', 'Beta', 'Gamma']);
            } else if (lastLog.msg.includes('stability verified') || lastLog.msg.includes('Verified')) {
                setAuditStatus('SECURE');
                setActivePaths([]);
            } else if (lastLog.msg.includes('Rejected') || lastLog.msg.includes('DECOHERENCE')) {
                setAuditStatus('VIOLATION');
                setActivePaths([]);
            }
        }
    }, [logs]);

    return (
        <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-blue-500/30 rounded-xl p-5 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${auditStatus === 'VIOLATION' ? 'bg-red-500/20 text-red-400' :
                        auditStatus === 'SECURE' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>
                        {auditStatus === 'VIOLATION' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#f8fafc]">Safety Audit Layer</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Q-CORE V2.0 Handshake: Stable</p>
                    </div>
                </div>
                {auditStatus === 'ANALYZING' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full animate-pulse">
                        <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                        <span className="text-[9px] font-black text-blue-400 uppercase">Superposition Active</span>
                    </div>
                )}
            </div>

            {/* Quantum Gate Animation */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {['Alpha', 'Beta', 'Gamma'].map(path => (
                    <div key={path} className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all duration-500 ${activePaths.includes(path) ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                        auditStatus === 'SECURE' ? 'bg-slate-900/50 border-emerald-500/30' :
                            'bg-slate-900/50 border-slate-800 opacity-50'
                        }`}>
                        <Binary className={`w-4 h-4 ${activePaths.includes(path) ? 'text-blue-400 animate-bounce' : 'text-slate-600'}`} />
                        <span className="text-[8px] font-black uppercase text-slate-400">Path {path}</span>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-blue-500 ${activePaths.includes(path) ? 'w-full animate-[progress_1s_infinite]' : 'w-0'}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Real-time Oracle Stream */}
            <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Live Oracle Verdicts</span>
                <div className="space-y-1 max-h-32 overflow-hidden">
                    {oracleLogs.length > 0 ? oracleLogs.map((log, i) => (
                        <div key={i} className="flex gap-3 text-[10px] items-start p-2 bg-slate-950/50 rounded border border-slate-800">
                            <span className={`font-black shrink-0 ${log.severity === 'SUCCESS' ? 'text-emerald-400' :
                                log.severity === 'ERROR' ? 'text-red-400' : 'text-blue-400'
                                }`}>
                                [{log.agent}]
                            </span>
                            <span className="text-slate-400 leading-tight italic truncate">
                                {log.msg}
                            </span>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-4 border border-dashed border-slate-800 rounded">
                            <Cpu className="w-5 h-5 text-slate-800 mb-2" />
                            <span className="text-[9px] font-bold text-slate-700 uppercase">Idle: Waiting for Synthesis</span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default SafetyAudit;
