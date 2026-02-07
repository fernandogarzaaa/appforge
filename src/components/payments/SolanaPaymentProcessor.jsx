import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function SolanaPaymentProcessor({
  planId,
  planName,
  amountSol,
  walletAddress,
  onPaymentSuccess,
  onPaymentError
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [txSignature, setTxSignature] = useState('');

  const handlePayment = async () => {
    if (!walletAddress) {
      setError('Please connect your Phantom wallet first');
      onPaymentError?.('Wallet not connected');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Check if Phantom is available
      if (!window.solana?.isPhantom) {
        throw new Error('Phantom wallet not found');
      }

      const token = localStorage.getItem('base44_access_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const configResponse = await fetch('/api/payment/solana/config', { headers });
      if (!configResponse.ok) throw new Error('Failed to load payment config');
      const config = await configResponse.json();

      if (!config?.recipient_address) {
        throw new Error('Payment configuration not available');
      }
      if (config.payment_enabled === false) {
        throw new Error('Solana payments are currently disabled');
      }

      const adminWallet = config.recipient_address;
      const network = config.network || 'devnet';

      const { Connection, PublicKey, SystemProgram, Transaction } = await import('@solana/web3.js');
      const rpcUrl = network === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : network === 'testnet'
          ? 'https://api.testnet.solana.com'
          : 'https://api.devnet.solana.com';

      const connection = new Connection(rpcUrl, 'confirmed');
      const fromPubkey = new PublicKey(walletAddress);
      const toPubkey = new PublicKey(adminWallet);
      const lamports = Math.round(Number(amountSol) * 1_000_000_000);

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromPubkey
      });

      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports
        })
      );

      const signed = await window.solana.signAndSendTransaction(transaction);
      const transactionSignature = signed.signature;

      setTxSignature(transactionSignature);

      // Verify payment on backend
      const verifyResponse = await fetch('/api/payment/subscription', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount_paid: amountSol,
          transaction_signature: transactionSignature,
          payment_method: 'solana_wallet',
          plan_id: planId
        })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || 'Payment verification failed');
      }

      onPaymentSuccess?.({
        signature: transactionSignature,
        planId,
        planName
      });

    } catch (err) {
      const errorMsg = err.message || 'Payment processing failed';
      setError(errorMsg);
      onPaymentError?.(errorMsg);
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (txSignature) {
    return (
      <Card className="border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">Payment Successful!</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                Your {planName} subscription is now active.
              </p>
              <code className="text-xs bg-green-900/20 dark:bg-green-900/50 px-2 py-1 rounded block break-all">
                {txSignature}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Summary</CardTitle>
          <CardDescription>
            Pay with SOL via Phantom
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">{planName} Plan</span>
            <span className="font-semibold">{Number(amountSol).toFixed(4)} SOL</span>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <Button
            onClick={handlePayment}
            disabled={processing || !walletAddress}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 rounded-lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${Number(amountSol).toFixed(4)} SOL`
            )}
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Powered by Solana • Payments via Phantom
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
