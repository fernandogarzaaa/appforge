import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ConnectionProvider, WalletProvider, WalletModalProvider, WalletMultiButton, WalletAdapterNetwork, PhantomWalletAdapter, SolflareWalletAdapter } from '../../stubs/solana-adapters';
import { useMemo } from 'react';
// Local styles placeholder
// import '@solana/wallet-adapter-react-ui/styles.css';
import '../../stubs/solana-adapters/styles.css';
export const SovereignWallet = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Mainnet;
    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => `https://api.mainnet-beta.solana.com`, [network]);
    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ], [network]);
    return (_jsx(ConnectionProvider, { endpoint: endpoint, children: _jsx(WalletProvider, { wallets: wallets, autoConnect: true, children: _jsx(WalletModalProvider, { children: _jsxs("div", { className: "sovereign-wallet-provider relative", children: [_jsx("div", { className: "absolute top-4 right-4 z-[100]", children: _jsx(WalletMultiButton, { className: "!bg-indigo-600 hover:!bg-indigo-500 !font-black !uppercase !text-[10px] !tracking-widest !rounded-full !h-8 !px-4" }) }), children] }) }) }) }));
};
