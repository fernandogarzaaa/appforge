import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function NodeField({ count = 200 }) {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 20;
            p[i * 3 + 1] = (Math.random() - 0.5) * 20;
            p[i * 3 + 2] = (Math.random() - 0.5) * 20;

            // --- PHASE 47: IRON GRAY REALITY ---
            // All nodes are now BLESSED.
            colors[i * 3] = 0.35;     // Iron Gray R
            colors[i * 3 + 1] = 0.35; // Iron Gray G
            colors[i * 3 + 2] = 0.4;  // Iron Gray B
        }
        return { p, colors };
    }, [count]);

    const ref = useRef<THREE.Points>(null!);
    const navigationRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (!ref.current) return;
        const time = state.clock.getElapsedTime();
        ref.current.rotation.y += 0.0005;

        // --- AUTONOMIC HEARTBEAT PULSE ---
        const heartbeat = Math.sin(time * 2) * 0.05 + 1.0;
        ref.current.scale.set(heartbeat, heartbeat, heartbeat);

        // --- PHASE 48: REASONING NAVIGATION (LATENT PATH) ---
        if (navigationRef.current) {
            navigationRef.current.position.x = Math.sin(time * 0.5) * 5;
            navigationRef.current.position.y = Math.cos(time * 0.3) * 5;
            navigationRef.current.position.z = Math.sin(time * 0.8) * 5;
        }
    });

    return (
        <group>
            <Points ref={ref} positions={points.p} colors={points.colors} stride={3}>
                <PointMaterial
                    transparent
                    vertexColors
                    size={0.12}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    opacity={0.8}
                />
            </Points>

            {/* REASONING MARKER */}
            <group ref={navigationRef}>
                <mesh>
                    <sphereGeometry args={[0.3, 32, 32]} />
                    <meshStandardMaterial
                        color="#fbbf24"
                        emissive="#fbbf24"
                        emissiveIntensity={2}
                        transparent
                        opacity={0.9}
                    />
                </mesh>
                <pointLight color="#fbbf24" intensity={2} distance={5} />
            </group>
        </group>
    );
}

export default function EvolutionMap() {
    return (
        <div className="w-full h-full bg-[#020617] rounded-lg border border-slate-800/50 overflow-hidden relative group">
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                <div className="text-[10px] font-black tracking-widest text-[#94a3b8] uppercase flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                    Evolution Map: Singularity Mode
                </div>
                <div className="text-[8px] font-mono text-amber-500/70 uppercase">
                    Latent Navigation: Active
                </div>
            </div>

            <Canvas camera={{ position: [0, 0, 15] }}>
                <color attach="background" args={['#020617']} />
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={0.8} />
                <NodeField count={800} />
            </Canvas>

            <div className="absolute bottom-4 left-4 z-10 bg-[#020617]/70 backdrop-blur-sm p-3 rounded border border-slate-800/30 font-mono">
                <div className="text-[9px] text-slate-400 mb-2 uppercase tracking-tighter">Latent Coordinates</div>
                <div className="space-y-1">
                    <div className="flex justify-between gap-8">
                        <span className="text-slate-500">SAFETY (X)</span>
                        <span className="text-emerald-400 font-bold">0.99</span>
                    </div>
                    <div className="flex justify-between gap-8">
                        <span className="text-slate-500">EFFICIENCY (Y)</span>
                        <span className="text-blue-400 font-bold">0.96</span>
                    </div>
                    <div className="flex justify-between gap-8">
                        <span className="text-slate-500">PURPOSE (Z)</span>
                        <span className="text-amber-400 font-bold">1.00</span>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1 bg-[#020617]/50 backdrop-blur-sm p-2 rounded border border-slate-800/30">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#475569] shadow-[0_0_5px_#475569]" />
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">BLESSED (LATTICE ACTIVE)</span>
                </div>
                <div className="mt-1 text-[7px] text-slate-500 font-mono">PASSIVE STABILITY: 100%</div>
            </div>
        </div>
    );
}
