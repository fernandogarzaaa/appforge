import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, Copy, ExternalLink, LogOut, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const walletProviders = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', color: 'hover:bg-orange-50' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', color: 'hover:bg-blue-50' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵', color: 'hover:bg-blue-50' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', color: 'hover:bg-purple-50' },
];

export default function WalletConnect({ wallet, onConnect, onDisconnect }) {
  const [showDialog, setShowDialog] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = async (provider) => {
    setConnecting(provider);
    // Simulate connection
    await new Promise(r => setTimeout(r, 1500));
    
    const mockWallet = {
      address: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
      provider: provider,
      chain_id: 1,
    };
    
    onConnect?.(mockWallet);
    setConnecting(null);
    setShowDialog(false);
    toast.success('Wallet connected!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet?.address || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (wallet) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-mono text-sm">{shortenAddress(wallet.address)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-gray-500 hover:text-red-500"
          onClick={() => {
            onDisconnect?.();
            toast.success('Wallet disconnected');
          }}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {walletProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleConnect(provider.id)}
                disabled={connecting}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 transition-all",
                  provider.color,
                  connecting === provider.id && "bg-gray-50"
                )}
              >
                <span className="text-2xl">{provider.icon}</span>
                <span className="font-medium flex-1 text-left">{provider.name}</span>
                {connecting === provider.id && (
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}