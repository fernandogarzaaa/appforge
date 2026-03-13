import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
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
const WalletContext = createContext(null);
const ConnectionContext = createContext(null);
export const ConnectionProvider = ({ children }) => {
    return _jsx(ConnectionContext.Provider, { value: { connection: { getLatestBlockhash: async () => ({ blockhash: 'mock' }), confirmTransaction: async () => ({}) } }, children: children });
};
export const WalletProvider = ({ children }) => {
    return _jsx(WalletContext.Provider, { value: { publicKey: null, sendTransaction: async () => 'mock_signature' }, children: children });
};
export const WalletModalProvider = ({ children }) => {
    return _jsx(_Fragment, { children: children });
};
export const WalletMultiButton = ({ className }) => {
    return _jsx("button", { className: className, children: "Select Wallet" });
};
export const useWallet = () => useContext(WalletContext) || { publicKey: null, sendTransaction: async () => 'mock_signature' };
export const useConnection = () => useContext(ConnectionContext) || { connection: { getLatestBlockhash: async () => ({ blockhash: 'mock' }), confirmTransaction: async () => ({}) } };
export const encodeURL = (params) => {
    return {
        toString: () => `solana:${params.recipient}?amount=${params.amount}&label=${encodeURIComponent(params.label)}`
    };
};
