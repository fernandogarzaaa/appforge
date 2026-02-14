import React, { useEffect, useState } from 'react';
import { Shield, Cloud, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SovereignStatus = () => {
    const [mode, setMode] = useState('Checking...');
    const [isLocal, setIsLocal] = useState(false);

    useEffect(() => {
        const checkOracle = async () => {
            try {
                // Try to hit the local Rust Oracle port
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);

                await fetch('http://localhost:3002/api/oracle/validate', {
                    method: 'POST',
                    signal: controller.signal
                });

                setIsLocal(true);
                setMode('Sovereign Mode');
            } catch (e) {
                setIsLocal(false);
                setMode('Vibe Mode');
            }
        };

        checkOracle();
        // Poll infrequently just to keep status somewhat fresh without spamming
        const interval = setInterval(checkOracle, 10000);
        return () => clearInterval(interval);
    }, []);

    if (isLocal) {
        return (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all">
                <Lock className="w-3 h-3" />
                SOVEREIGN ACTIVE
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
            </Badge>
        );
    }

    return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all">
            <Cloud className="w-3 h-3" />
            VIBE MODE
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1" />
        </Badge>
    );
};
