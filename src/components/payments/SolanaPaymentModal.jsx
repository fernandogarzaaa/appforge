import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

export default function SolanaPaymentModal({
  isOpen,
  onClose,
  paymentType,
  amount,
  referenceId,
  onPaymentSuccess,
  itemName
}) {
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // wallet or card
  const [status, setStatus] = useState('ready'); // ready, connecting, confirming, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [txSignature, setTxSignature] = useState('');
  const [isPhantom, setIsPhantom] = useState(false);

  useEffect(() => {
    const phantom = window.solana?.isPhantom;
    setIsPhantom(!!phantom);
  }, []);

  const handlePayment = async () => {
    try {
      if (!window.solana?.isPhantom) {
        setErrorMsg('Phantom wallet not found. Please install Phantom wallet.');
        setStatus('error');
        return;
      }

      setStatus('connecting');

      // Connect to Phantom
      const response = await window.solana.connect();
      const publicKey = response.publicKey.toString();

      setStatus('confirming');

      // Get admin wallet from config
      const configs = await base44.entities.SolanaPaymentConfig.list();
      if (configs.length === 0) {
        throw new Error('Payment configuration not available');
      }

      const adminWallet = configs[0].wallet_address;
      const network = configs[0].network;

      // Create transaction
      const { Connection, PublicKey, SystemProgram, Transaction } = await import('npm:@solana/web3.js@1.92.0');
      
      const rpcUrl = network === 'mainnet-beta' 
        ? 'https://api.mainnet-beta.solana.com'
        : network === 'devnet'
        ? 'https://api.devnet.solana.com'
        : 'https://api.testnet.solana.com';

      const connection = new Connection(rpcUrl);
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(adminWallet);
      
      const lamports = Math.round(amount * 1000000000);

      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromPubkey,
      });

      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      // Sign and send
      const signed = await window.solana.signAndSendTransaction(transaction);
      setTxSignature(signed.signature);

      // Verify payment on backend
      const verifyResponse = await base44.functions.invoke('processSolanaPayment', {
        amount_sol: amount,
        transaction_signature: signed.signature,
        payment_type: paymentType,
        reference_id: referenceId
      });

      if (verifyResponse.data.success) {
        setStatus('success');
        setTimeout(() => {
          onPaymentSuccess?.(signed.signature);
          onClose?.();
        }, 2000);
      } else {
        throw new Error(verifyResponse.data.error || 'Payment verification failed');
      }
    } catch (error) {
      setStatus('error');
      setErrorMsg(error.message || 'Payment failed');
    }
  };

  const handleCardPayment = async () => {
    try {
      setStatus('connecting');

      // Create Phantom Checkout session
      const response = await base44.functions.invoke('createPhantomCheckout', {
        amount_sol: amount,
        payment_type: paymentType,
        reference_id: referenceId,
      });

      if (response.data.success && response.data.checkout_url) {
        // Redirect to Phantom Checkout
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error(response.data.error || 'Failed to create checkout');
      }
    } catch (error) {
      setStatus('error');
      setErrorMsg(error.message || 'Payment failed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
          <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
          <TabsTrigger value="card" className="flex-1">Card</TabsTrigger>
        </Tabs>

        <div className="space-y-4">
        {paymentMethod === 'wallet' && (
          <>
            {/* Item Info */}
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-600">Item</p>
              <p className="font-semibold">{itemName}</p>
              <p className="text-sm text-gray-600 mt-2">Amount</p>
              <p className="text-2xl font-bold text-purple-600">{amount} SOL</p>
            </div>

            {/* Status Messages */}
            {status === 'ready' && !isPhantom && (
              <div className="p-3 bg-yellow-50 rounded border border-yellow-200 flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900">Phantom Wallet Required</p>
                  <p className="text-yellow-800">Install Phantom wallet to pay with Solana</p>
                </div>
              </div>
            )}

            {status === 'connecting' && (
              <div className="p-3 bg-blue-50 rounded flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-sm text-blue-900">Connecting to Phantom wallet...</p>
              </div>
            )}

            {status === 'confirming' && (
              <div className="p-3 bg-blue-50 rounded flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-sm text-blue-900">Waiting for transaction confirmation...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="p-3 bg-green-50 rounded border border-green-200 flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900">Payment Successful!</p>
                  <p className="text-green-800 text-xs mt-1 break-all">{txSignature}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="p-3 bg-red-50 rounded border border-red-200 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-900">Payment Failed</p>
                  <p className="text-red-800">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={status === 'connecting' || status === 'confirming'}
                className="flex-1"
              >
                {status === 'success' ? 'Close' : 'Cancel'}
              </Button>
              {status === 'ready' && isPhantom && (
                <Button
                  onClick={handlePayment}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Pay {amount} SOL
                </Button>
              )}
              {status === 'error' && (
                <Button
                  onClick={handlePayment}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Retry Payment
                </Button>
              )}
            </div>
          </>
        )}

        {paymentMethod === 'card' && (
          <>
            {/* Item Info */}
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-600">Item</p>
              <p className="font-semibold">{itemName}</p>
              <p className="text-sm text-gray-600 mt-2">Amount</p>
              <p className="text-2xl font-bold text-purple-600">{amount} SOL</p>
            </div>

            {/* Info */}
            {status === 'ready' && (
              <div className="p-3 bg-green-50 rounded border border-green-200 flex gap-2">
                <CreditCard className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900">Pay with Credit/Debit Card</p>
                  <p className="text-green-800 text-xs mt-1">Powered by Phantom Checkout</p>
                </div>
              </div>
            )}

            {status === 'connecting' && (
              <div className="p-3 bg-blue-50 rounded flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-sm text-blue-900">Redirecting to payment page...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-3 bg-red-50 rounded border border-red-200 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-900">Payment Failed</p>
                  <p className="text-red-800">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={status === 'connecting'}
                className="flex-1"
              >
                Cancel
              </Button>
              {status === 'ready' && (
                <Button
                  onClick={handleCardPayment}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {amount} SOL
                </Button>
              )}
              {status === 'error' && (
                <Button
                  onClick={handleCardPayment}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  Retry
                </Button>
              )}
            </div>
          </>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}