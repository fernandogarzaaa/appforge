import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    agents: string[];
}

const LiveAgentStatus: React.FC<Props> = ({ agents }) => {
    return (
        <div className="bg-black/40 backdrop-blur-xl border border-emerald-500/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-500/20 rounded-md">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight">Active Agent Collective</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {agents.map((agent, i) => (
                    <motion.div
                        key={agent}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span className="text-[11px] font-mono text-gray-300 truncate tracking-tight">{agent}</span>
                        </div>
                        <div className="text-[9px] font-mono text-emerald-400/60 font-bold">ACTV</div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between px-1">
                <span className="text-[10px] font-mono text-gray-500">SYNC_COHERENCE</span>
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className={`w-1 h-2 rounded-sm ${i < 7 ? 'bg-emerald-500/40' : 'bg-gray-800'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LiveAgentStatus;
