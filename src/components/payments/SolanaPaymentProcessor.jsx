import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function SolanaPaymentProcessor({ 
  planId, 
  planName, 
  amount, 
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
      // Get payment transaction details from backend
      const sessionResponse = await base44.functions.invoke('phantomCheckoutSession', {
        priceId: planId,
        walletAddress
      });

      const { transaction, metadata } = sessionResponse.data;

      // Check if Phantom is available
      if (!window.solana?.isPhantom) {
        throw new Error('Phantom wallet not found');
      }

      // Create and send transaction
      const provider = window.solana;
      
      // Build the transaction (simplified - in production use @solana/web3.js)
      // This is a placeholder showing the flow
      const transactionSignature = await provider.signAndSendTransaction({
        transaction: {
          amount: transaction.amount,
          recipient: transaction.recipient,
          mint: transaction.mint,
          reference: transaction.reference
        }
      });

      setTxSignature(transactionSignature);

      // Notify backend of successful transaction
      await base44.functions.invoke('phantomWebhook', {
        signature: transactionSignature,
        amount: transaction.amount,
        userEmail: metadata.user_email,
        planId: metadata.plan_id
      });

      onPaymentSuccess?.({
        signature: transactionSignature,
        planId: metadata.plan_id,
        planName: metadata.plan_name
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
            Pay with USDC (Solana stable token)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">{planName} Plan</span>
            <span className="font-semibold">${amount.toFixed(2)} USDC</span>
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
              `Pay ${amount.toFixed(2)} USDC`
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