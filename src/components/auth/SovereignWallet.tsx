import React from 'react';

// Unified Mock Wallet Context to bypass broken dependencies
export const SovereignWallet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="sovereign-mock-wrapper">
            {/* Mocking the WalletMultiButton position for visual consistency */}
            <div className="absolute top-4 right-4 z-50">
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest shadow-xl">
                    Wallet Connected (MOCK)
                </button>
            </div>
            {children}
        </div>
    );
};
