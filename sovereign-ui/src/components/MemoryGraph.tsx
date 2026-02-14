import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { type SwarmData } from '../realDataService';

interface Props {
    swarms: SwarmData[];
}

const MemoryGraph: React.FC<Props> = ({ swarms }) => {
    // Generate semi-random static positions for swarms in a circle/orbital layout
    const nodes = useMemo(() => {
        return swarms.map((swarm, i) => {
            const angle = (i / swarms.length) * 2 * Math.PI;
            // Seeded radius to ensure stability across re-renders
            const radiusSeed = (Math.sin(i * 1337) + 1) / 2;
            const radius = 120 + radiusSeed * 20;
            return {
                id: swarm.id,
                x: 200 + Math.cos(angle) * radius,
                y: 200 + Math.sin(angle) * radius,
                label: swarm.name,
                resonance: swarm.efficiency / 100 || 0.8,
                animationDelay: (Math.sin(i * 999) + 1) // Deterministic delay
            };
        });
    }, [swarms]);

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.1)] w-full h-[400px] relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Memory Resonance Graph</h3>
                    <p className="text-xs text-indigo-400/60 uppercase tracking-widest font-mono">Quantum Knowledge Field</p>
                </div>
            </div>

            <svg viewBox="0 0 400 400" className="w-full h-full absolute inset-0 pointer-events-none">
                {/* Connection Lines (Entanglement) */}
                {nodes.map((node, i) => (
                    nodes.slice(i + 1, i + 3).map((target, j) => (
                        <motion.line
                            key={`line-${i}-${j}`}
                            x1={node.x}
                            y1={node.y}
                            x2={target.x}
                            y2={target.y}
                            stroke="url(#gradient-line)"
                            strokeWidth="0.5"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.2 }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                        />
                    ))
                ))}

                <defs>
                    <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
                        <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Nodes (Swarms) */}
                {nodes.map((node) => (
                    <g key={node.id}>
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r={4 + node.resonance * 4}
                            fill="#818cf8"
                            filter="url(#glow)"
                            animate={{
                                r: [4 + node.resonance * 4, 6 + node.resonance * 4, 4 + node.resonance * 4],
                                opacity: [0.6, 1, 0.6]
                            }}
                            transition={{
                                duration: 3 + node.animationDelay,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <text
                            x={node.x}
                            y={node.y + 15}
                            textAnchor="middle"
                            className="text-[8px] fill-indigo-300 font-mono opacity-40"
                        >
                            {node.id}
                        </text>
                    </g>
                ))}
            </svg>

            {/* Central Core */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl absolute"
                />
                <div className="relative z-10 text-center">
                    <div className="text-[10px] text-indigo-400 font-mono mb-1">COHERENCE</div>
                    <div className="text-2xl font-black text-white leading-none tracking-tighter">98.4%</div>
                </div>
            </div>
        </div>
    );
};

export default MemoryGraph;
