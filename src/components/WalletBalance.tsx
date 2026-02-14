```
import React, { useState, useEffect } from 'react';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { SolanaWalletAdapter } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';

interface Props {
  endpoint: string;
}

const WalletBalance: React.FC<Props> = ({ endpoint }) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!endpoint) return;

    const connection = new Connection(endpoint);
    const getBalance = async () => {
      try {
        const balance = await connection.getBalance('YourPublicAddress');
        setBalance(balance.toString());
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    getBalance();
  }, [endpoint]);

  return (
    <WalletProvider walletAdapter={SolanaWalletAdapter({ endpoint })}>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ fontSize: '48px', color: 'green' }}>
          SOL Balance: {balance}
        </div>
      )}
    </WalletProvider>
  );
};

export default WalletBalance;
```