import React, { createContext, useContext, useMemo } from 'react';

// Mocking Solana Wallet Adapter components and hooks
export const WalletAdapterNetwork = {
    Mainnet: 'mainnet-beta',
    Testnet: 'testnet',
    Devnet: 'devnet',
};

export class PhantomWalletAdapter {
    name = 'Phantom';
    icon = '';
    url = 'https://phantom.app';
}

export class SolflareWalletAdapter {
    name = 'Solflare';
    icon = '';
    url = 'https://solflare.com';
}

const WalletContext = createContext<any>(null);
const ConnectionContext = createContext<any>(null);

export const ConnectionProvider: React.FC<{ endpoint: string; children: React.ReactNode }> = ({ children }) => {
    return <ConnectionContext.Provider value={{ connection: { getLatestBlockhash: async () => ({ blockhash: 'mock' }), confirmTransaction: async () => ({}) } }}>{children}</ConnectionContext.Provider>;
};

export const WalletProvider: React.FC<{ wallets: any[]; children: React.ReactNode; autoConnect?: boolean }> = ({ children }) => {
    return <WalletContext.Provider value={{ publicKey: null, sendTransaction: async () => 'mock_signature' }}>{children}</WalletContext.Provider>;
};

export const WalletModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

export const WalletMultiButton: React.FC<{ className?: string }> = ({ className }) => {
    return <button className={className}>Select Wallet</button>;
};

export const useWallet = () => useContext(WalletContext) || { publicKey: null, sendTransaction: async () => 'mock_signature' };
export const useConnection = () => useContext(ConnectionContext) || { connection: { getLatestBlockhash: async () => ({ blockhash: 'mock' }), confirmTransaction: async () => ({}) } };

export const encodeURL = (params: any) => {
    return {
        toString: () => `solana:${params.recipient}?amount=${params.amount}&label=${encodeURIComponent(params.label)}`
    };
};
