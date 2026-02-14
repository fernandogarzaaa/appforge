import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Search, Loader2 } from 'lucide-react';

interface QCoreVisualizerProps {
    logs: any[];
    isScanning: boolean;
}

const QCoreVisualizer: React.FC<QCoreVisualizerProps> = ({ logs, isScanning }) => {
    const [lastAudit, setLastAudit] = useState<{ status: 'PASS' | 'FAIL' | 'IDLE'; msg: string }>({
        status: 'IDLE',
        msg: 'Awaiting Q-Core Signal...'
    });

    useEffect(() => {
        const qcoreLog = logs.find(l => l.agent === 'Q-CORE' || l.agent === 'QUANTUM_ENGINE');
        if (qcoreLog) {
            if (qcoreLog.msg.includes('validated') || qcoreLog.msg.includes('Verified')) {
                setLastAudit({ status: 'PASS', msg: qcoreLog.msg });
            } else if (qcoreLog.msg.includes('Rejected') || qcoreLog.msg.includes('DECOHERENCE')) {
                setLastAudit({ status: 'FAIL', msg: qcoreLog.msg });
            }
        }
    }, [logs]);

    return (
        <div className="bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-lg p-4 shadow-2xl overflow-hidden relative">
            {/* Scanning Overlay */}
            {isScanning && (
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none">
                    <div className="h-0.5 bg-blue-500/20 w-full absolute top-0 animate-[scan_2s_infinite]" />
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Shield className="w-3 h-3 text-blue-400" /> Safety Audit
                </h3>
                {isScanning ? (
                    <div className="flex items-center gap-2 text-blue-400 text-[9px] font-bold uppercase animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
                    </div>
                ) : (
                    <div className="text-slate-600 text-[9px] font-bold uppercase">Ready</div>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-slate-500 uppercase font-bold">Latest Oracle Verdict</span>
                    <div className={`flex items-center gap-3 p-3 rounded border transition-colors ${lastAudit.status === 'PASS' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                        lastAudit.status === 'FAIL' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                            'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                        {lastAudit.status === 'PASS' && <ShieldCheck className="w-5 h-5 shrink-0" />}
                        {lastAudit.status === 'FAIL' && <ShieldAlert className="w-5 h-5 shrink-0" />}
                        {lastAudit.status === 'IDLE' && <Search className="w-5 h-5 shrink-0 opacity-20" />}

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {lastAudit.status}
                            </span>
                            <span className="text-[10px] truncate max-w-[200px] font-medium leading-tight">
                                {lastAudit.msg}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${isScanning ? 'w-full bg-blue-500' : 'w-0'
                        }`} />
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    );
};

export default QCoreVisualizer;
