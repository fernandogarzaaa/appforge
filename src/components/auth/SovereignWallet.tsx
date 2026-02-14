import React, { createContext, useContext, useState } from 'react';

interface WalletContextType {
    connected: boolean;
    publicKey: string | null;
    connect: () => void;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const SovereignWallet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const [publicKey, setPublicKey] = useState<string | null>(null);

    const connect = () => {
        // Simulated connection to Admin Wallet
        setConnected(true);
        setPublicKey('CT1Ud6MvZ4NeACuF1x1EsnGpynLW6s7dWCx7C2LXJwsJ');
    };

    const disconnect = () => {
        setConnected(false);
        setPublicKey(null);
    };

    return (
        <WalletContext.Provider value={{ connected, publicKey, connect, disconnect }}>
            <div className="sovereign-wallet-provider relative">
                <div className="absolute top-4 right-4 z-[100]">
                    {!connected ? (
                        <button
                            onClick={connect}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all active:scale-95"
                        >
                            Connect Wallet
                        </button>
                    ) : (
                        <button
                            onClick={disconnect}
                            className="bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-indigo-500/30 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all"
                        >
                            {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)} [DISCONNECT]
                        </button>
                    )}
                </div>
                {children}
            </div>
        </WalletContext.Provider>
    );
};

export const useSovereignWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error('useSovereignWallet must be used within SovereignWallet');
    return context;
};
