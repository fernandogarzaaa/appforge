import React from 'react';
import { useSmartContracts } from './useSmartContracts';
import { useCryptoPayments } from './useCryptoPayments';

/**
 * Blockchain Dashboard Component
 */
export const BlockchainDashboard = () => {
  const { contracts } = useSmartContracts();
  const { wallet, transactions } = useCryptoPayments();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Blockchain Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(wallet.balance).map(([currency, amount]) => (
          <div key={currency} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">{currency} Balance</h3>
            <p className="text-2xl font-bold">{amount.toFixed(4)}</p>
          </div>
        ))}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Smart Contracts</h3>
          <p className="text-2xl font-bold">{contracts.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions.slice(0, 5).map((tx, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{tx.amount} {tx.currency}</p>
                <p className="text-xs text-gray-500">{tx.hash.substring(0, 16)}...</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                {tx.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
