import React from 'react';
import { useAuditStore, AuditLog } from '@/store/auditStore';
import { Shield, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

const SecurityAudit: React.FC = () => {
    const logs = useAuditStore((state) => state.logs);

    const getIcon = (status: AuditLog['status']) => {
        switch (status) {
            case 'PASS': return <CheckCircle className="w-3 h-3 text-emerald-400" />;
            case 'WARN': return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
            case 'BLOCKED': return <XCircle className="w-3 h-3 text-red-400" />;
            default: return <Shield className="w-3 h-3 text-slate-400" />;
        }
    };

    const getColor = (status: AuditLog['status']) => {
        switch (status) {
            case 'PASS': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            case 'WARN': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
            case 'BLOCKED': return 'text-red-400 border-red-500/30 bg-red-500/10';
            default: return 'text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 w-80 font-mono text-[10px]">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-slate-200 uppercase tracking-wider">Glass Firewall</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-500 font-bold">LIVE</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                {logs.length === 0 && (
                    <div className="text-center p-8 text-slate-600 italic">
                        No active threats detected.
                        <br />
                        System Secure.
                    </div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className={`p-2 rounded border ${getColor(log.status)} mb-1`}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-bold">
                                {getIcon(log.status)}
                                <span>[{log.status}]</span>
                            </div>
                            <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-slate-300 break-words leading-tight">
                            {log.message}
                        </div>
                        {log.programId && (
                            <div className="mt-1 pt-1 border-t border-dashed border-white/10 text-[9px] text-slate-500">
                                PID: {log.programId.slice(0, 8)}...
                            </div>
                        )}
                        <div className="mt-1 flex justify-end">
                            <span className={`px-1 rounded text-[9px] font-bold ${log.riskScore > 0.5 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                RISK: {log.riskScore.toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-2 border-t border-slate-800 bg-slate-950 text-center text-slate-600 text-[9px]">
                IRON GUARD ACTIVE • ZERO TRUST MODE
            </div>
        </div>
    );
};

export default SecurityAudit;
