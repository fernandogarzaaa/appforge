import { useState, useCallback } from 'react';

/**
 * Hook for cryptocurrency payments
 * @returns {Object} Crypto payment utilities
 */
export const useCryptoPayments = () => {
  const [wallet, setWallet] = useState({
    address: `0x${Math.random().toString(16).substring(2, 42)}`,
    balance: { ETH: 2.5, BTC: 0.05, USDC: 1000 },
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const acceptPayment = useCallback(async (amount, currency, from) => {
    setLoading(true);
    try {
      const tx = {
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        amount,
        currency,
        from,
        to: wallet.address,
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      };
      setTransactions(prev => [...prev, tx]);
      setWallet(prev => ({
        ...prev,
        balance: { ...prev.balance, [currency]: prev.balance[currency] + amount },
      }));
      return tx;
    } finally {
      setLoading(false);
    }
  }, [wallet.address]);

  const getExchangeRates = useCallback(async () => {
    return {
      ETH: { USD: 2450.50, BTC: 0.065 },
      BTC: { USD: 43200.00, ETH: 15.4 },
      USDC: { USD: 1.00 },
    };
  }, []);

  return { wallet, transactions, loading, acceptPayment, getExchangeRates };
};
