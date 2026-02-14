import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface QuantumParams {
    coherence: number;
    lock: boolean;
    temperature: number;
    coolingRate: number;
}

interface Props {
    initialParams?: QuantumParams;
    onUpdate: (params: Partial<QuantumParams>) => void;
    bridgeStatus?: { online: boolean; latency: number };
}

const QuantumParameterTuner: React.FC<Props> = ({ initialParams, onUpdate, bridgeStatus }) => {
    const [params, setParams] = useState<QuantumParams>(initialParams || {
        coherence: 0.94,
        lock: true,
        temperature: 5000,
        coolingRate: 0.99
    });

    useEffect(() => {
        if (initialParams) {
            setParams(initialParams);
        }
    }, [initialParams]);

    const handleChange = (key: keyof QuantumParams, value: any) => {
        const newParams = { ...params, [key]: value };
        setParams(newParams);
        onUpdate({ [key]: value });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.1)] w-full"
        >
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Quantum Parameter Tuner</h3>
                    <p className="text-xs text-cyan-400/60 uppercase tracking-widest font-mono">Real-time Entropy Control</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Coherence Target */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">COHERENCE_TARGET</span>
                        <span className="text-cyan-400">{(params.coherence * 100).toFixed(1)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={params.coherence}
                        onChange={(e) => handleChange('coherence', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">ANNEALING_TEMP</span>
                        <span className="text-cyan-400">{params.temperature.toFixed(0)}K</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10000"
                        step="100"
                        value={params.temperature}
                        onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                {/* Cooling Rate */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">COOLING_RATE</span>
                        <span className="text-cyan-400">{params.coolingRate.toFixed(3)}</span>
                    </div>
                    <input
                        type="range"
                        min="0.9"
                        max="0.999"
                        step="0.001"
                        value={params.coolingRate}
                        onChange={(e) => handleChange('coolingRate', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                {/* Bridge Resonance */}
                <div className="flex items-center justify-between p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${bridgeStatus?.online ? 'bg-indigo-400 animate-pulse' : 'bg-red-500/50'}`} />
                        <div>
                            <span className="text-sm font-medium text-gray-300">Cloud Bridge Resonance</span>
                            <p className="text-[10px] text-indigo-400/60 font-mono">LTC: {bridgeStatus?.latency || 0}ms</p>
                        </div>
                    </div>
                    <Badge variant={bridgeStatus?.online ? 'success' : 'destructive'} className="text-[8px]">
                        {bridgeStatus?.online ? 'LOCKED' : 'COLLAPSED'}
                    </Badge>
                </div>

                {/* Coherence Lock */}
                <div className="flex items-center justify-between p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${params.lock ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
                        <span className="text-sm font-medium text-gray-300">Coherence Lock</span>
                    </div>
                    <button
                        onClick={() => handleChange('lock', !params.lock)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${params.lock ? 'bg-cyan-600' : 'bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${params.lock ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-cyan-500/10 text-[10px] font-mono text-cyan-400/40 text-center uppercase tracking-widest">
                Quantum Shielding Active
            </div>
        </motion.div>
    );
};

export default QuantumParameterTuner;
