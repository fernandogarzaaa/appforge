import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

interface Props {
  endpoint: string;
}

const WalletBalance: React.FC<Props> = ({ endpoint }) => {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!endpoint) return;

    const connection = new Connection(endpoint);
    const getBalance = async () => {
      try {
        setLoading(true);
        // Using a more realistic placeholder for demo
        const publicKey = new PublicKey('vines1vzrY7tduFqyLo2X7st74nLq1z7L8mF66oQzLx');
        const balanceNum = await connection.getBalance(publicKey);
        setBalance((balanceNum / 1e9).toFixed(2));
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    getBalance();
  }, [endpoint]);

  return (
    <div className="flex flex-col gap-1">
      {loading ? (
        <div className="text-slate-500 text-[10px] italic">Refreshing...</div>
      ) : (
        <div className="text-emerald-400 font-mono text-lg font-black">
          {balance} SOL
        </div>
      )}
    </div>
  );
};

export default WalletBalance;