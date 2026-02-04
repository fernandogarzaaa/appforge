import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function PhantomWalletConnect({ onWalletConnected, onError }) {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (window.solana?.isPhantom) {
      try {
        const response = await window.solana.connect({ onlyIfTrusted: true });
        setWalletAddress(response.publicKey.toString());
        setConnected(true);
        onWalletConnected?.(response.publicKey.toString());
      } catch (err) {
        // User hasn't connected yet
        setConnected(false);
      }
    }
  };

  const handleConnect = async () => {
    if (!window.solana?.isPhantom) {
      setError('Phantom wallet not found. Please install it from phantom.app');
      onError?.('Phantom wallet not installed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);
      setConnected(true);
      onWalletConnected?.(address);
    } catch (err) {
      const errorMsg = err.message || 'Failed to connect wallet';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.solana?.isPhantom) {
      try {
        await window.solana.disconnect();
        setConnected(false);
        setWalletAddress('');
        setError('');
      } catch (err) {
        console.error('Disconnect error:', err);
      }
    }
  };

  if (connected) {
    return (
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold text-green-900 dark:text-green-100">
            Wallet Connected
          </span>
        </div>
        <p className="text-xs text-green-700 dark:text-green-300 mb-3 break-all font-mono">
          {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="w-full"
        >
          Disconnect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleConnect}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 rounded-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            Connect Phantom Wallet
          </>
        )}
      </Button>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Don't have Phantom? <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Download Phantom Wallet</a>
      </p>
    </div>
  );
}