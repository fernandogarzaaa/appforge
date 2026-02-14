import React, { useState, useEffect } from 'react';
import { startRaydiumScanner, NewPoolEvent } from '../utils/raydium_scanner';
import { Shield, Eye, EyeOff, Lock, MonitorStop } from 'lucide-react';
import { useSovereignWallet } from './auth/SovereignWallet';

const RaydiumScout: React.FC = () => {
  const { connected } = useSovereignWallet();
  const [events, setEvents] = useState<NewPoolEvent[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!connected) return;

    const stopScanner = startRaydiumScanner((event) => {
      setEvents(prev => [event, ...prev].slice(0, 50));
    });

    return () => stopScanner();
  }, [connected]);

  return (
    <div className="flex flex-col h-full text-slate-300 font-mono text-[10px]">
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        {!connected ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Shield className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <div className="text-white font-black tracking-widest uppercase">Encryption Locked</div>
              <div className="text-slate-500 leading-relaxed italic">Synchronize Sovereign Wallet to decrypt Raydium liquidity signals.</div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 italic">
            <span className="animate-pulse">Waiting for chain signals...</span>
          </div>
        ) : (
          events.map((event, i) => (
            <div key={i} className="p-2 border border-slate-800 bg-slate-900/50 rounded flex flex-col gap-1">
              <div className="flex justify-between items-center text-purple-400 font-bold uppercase tracking-tighter">
                <span>🚨 NEW LIQUIDITY POOL</span>
                <span className="text-slate-500 font-normal">SLOT: {event.slot}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">MINT:</span>
                <span className={`transition-all duration-500 ${!isUnlocked ? 'blur-[4px] select-none' : ''}`}>
                  {event.signature}
                </span>
              </div>

              <div className="text-slate-600 text-[8px]">
                DETECTED: {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/50">
        {!connected ? (
          <div className="w-full py-3 bg-slate-900 border border-slate-800 text-slate-600 font-black rounded uppercase tracking-widest text-center">
            Awaiting Linkage
          </div>
        ) : !isUnlocked ? (
          <button
            onClick={() => setIsUnlocked(true)}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Unlock Feed (0.1 SOL)
          </button>
        ) : (
          <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center font-black uppercase tracking-widest rounded flex items-center justify-center gap-2">
            <Eye className="w-3 h-3" /> Signal Active
          </div>
        )}
      </div>
    </div>
  );
};

export default RaydiumScout;