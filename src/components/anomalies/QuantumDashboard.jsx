import React, { useEffect } from 'react';
import { useCausalStore } from '../../store/useCausalStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Layers, AlertCircle } from 'lucide-react';

export default function QuantumDashboard() {
    const {
        quantumMetrics,
        updateQuantumMetrics,
        isPredicting,
        entangledEdges,
        nodes
    } = useCausalStore();

    // Poll for quantum metrics every 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            updateQuantumMetrics();
        }, 2000);

        // Initial fetch
        updateQuantumMetrics();

        return () => clearInterval(interval);
    }, [updateQuantumMetrics, isPredicting, entangledEdges.length]);

    if (!quantumMetrics) return null;

    const getHealthColor = (val) => {
        if (val > 80) return "bg-green-500";
        if (val > 50) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getEntropyColor = (val) => {
        if (val < 30) return "bg-green-500"; // Low entropy is good
        if (val < 70) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <Card className="bg-slate-900 text-slate-100 border-slate-700 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 animate-pulse" />

            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-mono tracking-widest text-cyan-400 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        QUANTUM ENGINE MONITOR
                    </CardTitle>
                    <Badge variant="outline" className="border-cyan-500 text-cyan-400 animate-pulse">
                        {quantumMetrics.superpositionState}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">

                {/* Coherence */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Coherence</span>
                        <span>{quantumMetrics.coherence.toFixed(0)}%</span>
                    </div>
                    <Progress value={quantumMetrics.coherence} className="h-2 bg-slate-800" indicatorClassName={getHealthColor(quantumMetrics.coherence)} />
                </div>

                {/* Entropy */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Entropy</span>
                        <span>{quantumMetrics.entropy.toFixed(0)}%</span>
                    </div>
                    <Progress value={quantumMetrics.entropy} className="h-2 bg-slate-800" indicatorClassName={getEntropyColor(quantumMetrics.entropy)} />
                </div>

                {/* Stability */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Stability</span>
                        <span>{quantumMetrics.stability.toFixed(0)}%</span>
                    </div>
                    <Progress value={quantumMetrics.stability} className="h-2 bg-slate-800" indicatorClassName={getHealthColor(quantumMetrics.stability)} />
                </div>

                {/* System Stats */}
                <div className="flex gap-2 justify-end">
                    <div className="text-center px-2 py-1 bg-slate-800 rounded border border-slate-700">
                        <Activity className="w-3 h-3 text-purple-400 mx-auto mb-1" />
                        <span className="text-xs font-bold">{nodes.length}</span>
                    </div>
                    <div className="text-center px-2 py-1 bg-slate-800 rounded border border-slate-700">
                        <Layers className="w-3 h-3 text-cyan-400 mx-auto mb-1" />
                        <span className="text-xs font-bold">{entangledEdges.length}</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
