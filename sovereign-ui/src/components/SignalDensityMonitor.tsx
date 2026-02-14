import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity } from 'lucide-react';

interface Props {
    compressionRatio: number; // 0 to 1
}

const SignalDensityMonitor: React.FC<Props> = ({ compressionRatio }) => {
    return (
        <div className="bg-black/40 backdrop-blur-xl border border-purple-500/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/20 rounded-md">
                        <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight">Signal Density</h4>
                </div>
                <div className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    GEMINI_3_COMPRESSION
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative pt-1">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <span className="text-[10px] font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                                Compression Ratio
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-purple-400">
                                {(compressionRatio * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-900/30">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${compressionRatio * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-2.5 bg-purple-500/5 rounded-lg border border-purple-500/10">
                        <p className="text-[10px] text-gray-500 uppercase font-mono">Throughput</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-white font-mono">{(1 / (1 - (compressionRatio || 0.1))).toFixed(1)}x</span>
                            <span className="text-[8px] text-purple-400 font-bold uppercase">Boost</span>
                        </div>
                    </div>
                    <div className="p-2.5 bg-purple-500/5 rounded-lg border border-purple-500/10">
                        <p className="text-[10px] text-gray-500 uppercase font-mono">Latency_Delta</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-emerald-400 font-mono">-{((compressionRatio || 0) * 40).toFixed(0)}%</span>
                            <span className="text-[8px] text-emerald-400/60 font-bold uppercase">Saving</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-purple-400/60 font-mono">
                    <Activity className="w-3 h-3 animate-pulse" />
                    <span>NEURAL_PACKET_SHAPING_ACTIVE</span>
                </div>
            </div>
        </div>
    );
};

export default SignalDensityMonitor;
