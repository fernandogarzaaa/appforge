import React, { useState } from 'react';
import { Sparkles, ShoppingBag, Map, Palette, ArrowRight, Zap, Globe } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { AIAgent } from '@/utils/aiAgentCore';
import { base44 } from '@/api/base44Client';

export default function VibeGuide() {
    const { navigateTo } = useNavigation();
    const [prompt, setPrompt] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isOmniMode, setIsOmniMode] = useState(false);

    const vibes = [
        {
            icon: ShoppingBag,
            title: "The Merchant",
            desc: "Build a Solana payment page.",
            prompt: "I want to create a Solana payment gateway for selling digital art."
        },
        {
            icon: Map,
            title: "The Scout",
            desc: "Build a token launch tracker.",
            prompt: "Build a dashboard that tracks new Raydium token launches in real-time."
        },
        {
            icon: Palette,
            title: "The Artist",
            desc: "Build an NFT minting landing page.",
            prompt: "Create a high-vibe landing page for an exclusive NFT mint with a countdown."
        }
    ];

    const handleVibeCheck = async (selectedPrompt) => {
        setIsThinking(true);
        // Simulate "synthesizing" the vibe before routing
        const agent = new AIAgent(base44);

        // In a real flow, we might pre-process this, but for now we pass it to the command center
        // via URL params or context.
        setTimeout(() => {
            const encoded = encodeURIComponent(selectedPrompt || prompt);
            // We route to CommandCenter but with "auto_start" params
            const modeParam = isOmniMode ? '&mode=omni' : '';
            window.location.href = `/admin/terminal?auto_start=true&idea=${encoded}${modeParam}`;
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Vibe */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-purple-900/10 to-slate-900 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl w-full text-center space-y-8">

                <div className="space-y-2">
                    <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        AppForge
                    </h1>
                    <p className="text-slate-400 text-lg font-medium">Vibe Code with Sovereign Safety.</p>
                </div>

                {/* Vibe Input area */}
                <div className="flex flex-col gap-4">
                    {/* Omni-Forge Toggle */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => setIsOmniMode(!isOmniMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${isOmniMode
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                                : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500'
                                }`}
                        >
                            <Globe className="w-3 h-3" />
                            Omni-Forge: {isOmniMode ? 'Online' : 'Offline'}
                        </button>
                    </div>

                    <div className={`w-full bg-slate-900/50 backdrop-blur-xl border rounded-2xl p-2 flex items-center gap-4 shadow-2xl transition-all ${isOmniMode ? 'border-indigo-500/50 shadow-indigo-500/20' : 'border-slate-700/50'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOmniMode ? 'bg-indigo-500/20' : 'bg-blue-500/10'}`}>
                            {isThinking ? (
                                <Sparkles className={`w-5 h-5 ${isOmniMode ? 'text-indigo-400' : 'text-blue-400'} animate-spin`} />
                            ) : (
                                <Zap className={`w-5 h-5 ${isOmniMode ? 'text-indigo-400' : 'text-blue-400'}`} />
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder={isOmniMode ? "Describe a multi-chain, cross-domain system..." : "What are we building today?"}
                            className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 font-medium"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVibeCheck()}
                        />
                        <button
                            onClick={() => handleVibeCheck()}
                            className={`p-2 rounded-lg transition-colors text-white ${isOmniMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Starter Vibes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {vibes.map((vibe) => (
                        <button
                            key={vibe.title}
                            onClick={() => handleVibeCheck(vibe.prompt)}
                            className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-blue-500/30 rounded-xl p-5 text-left transition-all group"
                        >
                            <div className="mb-3 w-10 h-10 bg-slate-700/50 group-hover:bg-blue-500/20 rounded-lg flex items-center justify-center transition-colors">
                                <vibe.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
                            </div>
                            <h3 className="font-bold text-slate-200 mb-1">{vibe.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{vibe.desc}</p>
                        </button>
                    ))}
                </div>

            </div>

            {/* Simple Footer */}
            <div className="absolute bottom-6 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                Powered by Base44 • Quantum Engine v2.4
            </div>
        </div>
    );
}
