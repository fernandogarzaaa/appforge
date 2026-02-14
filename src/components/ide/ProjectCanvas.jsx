import React, { useState } from 'react';
import { Maximize2, RefreshCw, Layout, Globe, Smartphone, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProjectCanvas() {
    const [viewMode, setViewMode] = useState('desktop');

    return (
        <div className="h-full flex flex-col bg-[#0f172a]">
            {/* 🖼️ CANVAS CONTROLS */}
            <div className="h-10 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-950 rounded-md p-0.5 border border-slate-800">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('desktop')}
                            className={`w-7 h-7 ${viewMode === 'desktop' ? 'bg-slate-800 text-indigo-400' : 'text-slate-600'}`}
                        >
                            <Globe className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('tablet')}
                            className={`w-7 h-7 ${viewMode === 'tablet' ? 'bg-slate-800 text-indigo-400' : 'text-slate-600'}`}
                        >
                            <Tablet className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('mobile')}
                            className={`w-7 h-7 ${viewMode === 'mobile' ? 'bg-slate-800 text-indigo-400' : 'text-slate-600'}`}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Preview</span>
                        <Badge variant="outline" className="text-[8px] py-0 border-emerald-500/20 text-emerald-500 font-mono">SYNCING</Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-white">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* 🖥️ PREVIEW AREA */}
            <div className="flex-1 bg-slate-950 overflow-hidden relative flex items-center justify-center p-8">
                {/* Holographic Background Grid */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                <div className={`bg-white rounded-lg shadow-2xl transition-all duration-500 overflow-hidden ${viewMode === 'desktop' ? 'w-full h-full' :
                        viewMode === 'tablet' ? 'w-[768px] h-[90%]' :
                            'w-[375px] h-[667px]'
                    }`}>
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50 border border-gray-200">
                        <Layout className="w-12 h-12 text-gray-200 mb-4" />
                        <p className="text-gray-400 text-sm font-medium">Drafting Application Surface...</p>
                        <div className="w-48 h-1 bg-gray-200 rounded-full mt-4 overflow-hidden relative">
                            <div className="absolute inset-0 bg-indigo-500 animate-[loading_2s_infinite]" style={{ width: '40%' }} />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
        </div>
    );
}
