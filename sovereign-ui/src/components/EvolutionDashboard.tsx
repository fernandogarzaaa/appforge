import React from 'react';
import { Cpu, GitPullRequest, GitMerge, TrendingUp, History } from 'lucide-react';
import { EvolutionData } from '../realDataService';

interface EvolutionDashboardProps {
    data?: EvolutionData;
}

const EvolutionDashboard: React.FC<EvolutionDashboardProps> = ({ data }) => {
    if (!data) return null;

    const getScoreColor = (score: number) => {
        if (score >= 0.9) return 'text-emerald-400';
        if (score >= 0.7) return 'text-indigo-400';
        return 'text-amber-400';
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {/* Main Stats Card */}
                <div className="col-span-2 bg-slate-900/40 border border-slate-800/50 rounded-xl p-5 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1 font-bold">Current Phase</p>
                            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                CYCLE {data.totalCycles}
                                <span className="animate-pulse w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1 font-bold">Global Resonance</p>
                            <p className={`text-2xl font-mono font-black ${getScoreColor(data.lastMutationScore)}`}>
                                {(data.lastMutationScore * 100).toFixed(2)}%
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-gradient transition-all duration-1000"
                            style={{ width: `${data.lastMutationScore * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* PR Stats */}
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <GitPullRequest className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Evolution PRs</p>
                            <p className="text-lg font-mono font-bold text-white">{data.totalPRsCreated}</p>
                        </div>
                    </div>
                </div>

                {/* Merge Stats */}
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <GitMerge className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Mutations Merged</p>
                            <p className="text-lg font-mono font-bold text-white">{data.totalMerges}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Evolution History */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/20">
                    <h3 className="text-xs font-bold flex items-center gap-2 tracking-widest text-slate-300">
                        <History className="w-3 h-3 text-indigo-400" /> MUTATION TIMELINE
                    </h3>
                    <Cpu className="w-3 h-3 text-slate-600" />
                </div>
                <div className="p-2 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                    {data.mutationHistory.length === 0 ? (
                        <p className="text-[10px] text-slate-500 text-center py-8 italic font-medium">Primordial state - No mutations recorded</p>
                    ) : (
                        <div className="space-y-1">
                            {[...data.mutationHistory].reverse().map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-800/30 rounded-lg transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-500/10 w-12 text-center py-0.5 rounded">
                                            C{entry.cycle}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500/50" style={{ width: `${entry.score * 100}%` }}></div>
                                        </div>
                                        <span className={`text-[10px] font-mono font-bold w-12 text-right ${getScoreColor(entry.score)}`}>
                                            {(entry.score * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvolutionDashboard;
