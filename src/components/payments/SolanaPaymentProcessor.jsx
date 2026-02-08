import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

// Mainnet USDC Mint Address
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

export default function SolanaPaymentProcessor({
  planId,
  planName,
  amountUSDC, // Updated prop name
  walletAddress,
  onPaymentSuccess,
  onPaymentError
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [txSignature, setTxSignature] = useState('');

  const handleMoonPay = () => {
    // Open MoonPay for buying USDC on Solana
    // If user has a wallet address, prefill it
    const baseUrl = "https://buy.moonpay.com";
    const currencyCode = "usdc_sol";
    const wallet = walletAddress || "";
    const url = `${baseUrl}?currencyCode=${currencyCode}&walletAddress=${wallet}&redirectURL=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

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
      // Force Mainnet for USDC
      const rpcUrl = 'https://api.mainnet-beta.solana.com';

      const connection = new Connection(rpcUrl, 'confirmed');
      const fromPubkey = new PublicKey(walletAddress);
      const toPubkey = new PublicKey(adminWallet);

      // USDC has 6 decimals
      const amountUnits = Math.round(Number(amountUSDC) * 1_000_000);

      // Get Associated Token Accounts
      const sourceATA = await getAssociatedTokenAddress(USDC_MINT, fromPubkey);
      const destinationATA = await getAssociatedTokenAddress(USDC_MINT, toPubkey);

      // Create transaction
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromPubkey
      });

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          sourceATA,
          destinationATA,
          fromPubkey,
          amountUnits,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const signed = await window.solana.signAndSendTransaction(transaction);
      const transactionSignature = signed.signature;

      setTxSignature(transactionSignature);

      // Verify payment on backend
      const verifyResponse = await fetch('/api/payment/subscription', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount_paid: amountUSDC,
          transaction_signature: transactionSignature,
          payment_method: 'solana_usdc', // Updated type
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
            Pay with USDC on Solana Mainnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">{planName} Plan</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{Number(amountUSDC).toFixed(2)} USDC</span>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid gap-3">
            <Button
              onClick={handlePayment}
              disabled={processing || !walletAddress}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-11 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${Number(amountUSDC).toFixed(2)} USDC`
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleMoonPay}
              className="w-full border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Buy USDC with Card (MoonPay)
              <ExternalLink className="w-3 h-3 ml-2 opacity-50" />
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Automated via Smart Contract • Secure & Fast
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
