import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
const TokenMinter = () => {
    const [connection, setConnection] = useState(new Connection(clusterApiUrl('devnet')));
    const [keypair, setKeypair] = useState(Keypair.generate());
    const [minting, setMinting] = useState(false);
    const [mintedToken, setMintedToken] = useState(null);
    useEffect(() => {
        if (mintedToken) {
            console.log(`Token minted: ${mintedToken}`);
        }
    }, [mintedToken]);
    const handleMint = async () => {
        try {
            setMinting(true);
            await connection.getLatestBlockhash();
            setMintedToken(keypair.publicKey.toBase58());
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setMinting(false);
        }
    };
    return (_jsxs("div", { children: [minting ? (_jsx("p", { children: "Minting token..." })) : (_jsx("button", { onClick: handleMint, children: "Mint Token" })), mintedToken && _jsxs("p", { children: ["Token minted: ", mintedToken] })] }));
};
export default TokenMinter;
