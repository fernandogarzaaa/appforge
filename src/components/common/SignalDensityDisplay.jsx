import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity } from 'lucide-react';

const SignalDensityDisplay = ({ compressionRatio = 0.65 }) => {
    return (
        <div className="bg-slate-950/40 backdrop-blur-xl border border-indigo-500/30 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signal Density Resonance</span>
                </div>
                <div className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    G3_CORE_COMPRESSION
                </div>
            </div>

            <div className="space-y-3">
                <div className="relative">
                    <div className="flex justify-between mb-1 text-[10px]">
                        <span className="text-slate-500 font-mono italic">COMPRESSION_RATIO</span>
                        <span className="text-indigo-400 font-bold">{(compressionRatio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${compressionRatio * 100}%` }}
                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-indigo-500/5 rounded border border-indigo-500/10">
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Resonance Boost</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-white font-mono">{(1 / (1 - (compressionRatio || 0.1))).toFixed(1)}x</span>
                            <span className="text-[8px] text-indigo-400 font-bold">SIGNAL</span>
                        </div>
                    </div>
                    <div className="p-2 bg-emerald-500/5 rounded border border-emerald-500/10">
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Latency Saving</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-emerald-400 font-mono">-{((compressionRatio || 0) * 40).toFixed(0)}%</span>
                            <span className="text-[8px] text-emerald-500/60 font-bold">ms</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[8px] text-slate-600 font-mono">
                    <Activity className="w-2.5 h-2.5 animate-pulse text-indigo-400" />
                    <span>SEMANTIC_PACKET_OPTIMIZATION_ACTIVE</span>
                </div>
            </div>
        </div>
    );
};

export default SignalDensityDisplay;
