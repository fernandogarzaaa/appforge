import React, { useState, useEffect } from 'react';
import { Connection, clusterApiUrl, Keypair, LAMPORTS_PER_SOL } from '@solana/web3js';
import { Token } from '@solana/spl-token';

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
      const token = new Token(connection, 'So11111111111111111111111', 0);
      await token.createAccount({
        amount: LAMPORTS_PER_SOL,
        fromPubkey: keypair.publicKey,
        authority: keypair.publicKey,
      });
      setMintedToken(token.mintAddress.toString());
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