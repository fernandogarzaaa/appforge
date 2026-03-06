import React, { useState, useEffect } from 'react';
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
    } catch (error) {
      console.error(error);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div>
      {minting ? (
        <p>Minting token...</p>
      ) : (
        <button onClick={handleMint}>Mint Token</button>
      )}
      {mintedToken && <p>Token minted: {mintedToken}</p>}
    </div>
  );
};

export default TokenMinter;