import React from 'react';
import { useCausalStore } from '../../store/useCausalStore';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, GitCommit } from 'lucide-react';

export default function TopologyTimeline() {
    // 🧬 Quantum Entanglement with Global Store
    const { history, historyIndex, jumpTo } = useCausalStore();

    if (history.length <= 1) return null; // No history to travel

    const handleScrub = (val) => {
        const targetIndex = val[0];
        if (targetIndex !== historyIndex) {
            jumpTo(targetIndex);
        }
    };

    return (
        <Card className="bg-slate-900 text-slate-100 border-slate-800">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="font-mono text-sm">Temporal State: {historyIndex} / {history.length - 1}</span>
                    </div>
                    <Badge variant="outline" className="text-blue-200 border-blue-800">
                        {historyIndex === history.length - 1 ? 'LIVE NOW' : 'PAST STATE'}
                    </Badge>
                </div>

                <div className="relative pt-2 pb-6">
                    {/* Markers */}
                    <div className="absolute top-0 left-0 right-0 flex justify-between px-1">
                        {history.map((_, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                <div className={`w-1 h-2 ${idx === historyIndex ? 'bg-blue-500' : 'bg-slate-700'}`} />
                            </div>
                        ))}
                    </div>

                    <Slider
                        value={[historyIndex]}
                        min={0}
                        max={history.length - 1}
                        step={1}
                        className="my-4"
                        onValueChange={handleScrub}
                    />

                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                        <span>Genesis</span>
                        <span>Latest Entanglement</span>
                    </div>
                </div>

                <div className="space-y-2 mt-2">
                    <p className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1">
                        <GitCommit className="w-3 h-3" /> State Log
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                        {history.map((snapshot, idx) => (
                            <div key={idx} className={`text-xs p-2 rounded flex justify-between items-center ${idx === historyIndex ? 'bg-blue-900/30 text-blue-200 border border-blue-800' : 'text-slate-500'}`}>
                                <span>State #{idx}</span>
                                <span>{snapshot.nodes.length} Nodes, {snapshot.edges.length} Edges</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
