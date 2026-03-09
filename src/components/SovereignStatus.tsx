import React, { useEffect, useState } from 'react';
import { Cloud, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SovereignStatus = () => {
    const [isReady, setIsReady] = useState(false);
    const [hasKey, setHasKey] = useState(true);

    useEffect(() => {
        const checkRuntimeReadiness = async () => {
            try {
                const response = await fetch('/api/health/llm', {
                    method: 'GET',
                    cache: 'no-store'
                });

                if (!response.ok) {
                    setIsReady(false);
                    return;
                }

                const data = await response.json();
                setIsReady(Boolean(data?.configured));
                setHasKey(Boolean(data?.hasApiKey));
            } catch (e) {
                setIsReady(false);
            }
        };

        checkRuntimeReadiness();
        const interval = setInterval(checkRuntimeReadiness, 20000);
        return () => clearInterval(interval);
    }, []);

    if (isReady) {
        return (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all">
                <Lock className="w-3 h-3" />
                MVP READY
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
            </Badge>
        );
    }

    if (!hasKey) {
        return (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all">
                <AlertTriangle className="w-3 h-3" />
                LLM KEY MISSING
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1" />
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
