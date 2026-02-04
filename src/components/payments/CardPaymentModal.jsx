import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

export default function CardPaymentModal({
  isOpen,
  onClose,
  paymentType,
  amount,
  referenceId,
  onPaymentSuccess,
  itemName
}) {
  const [status, setStatus] = useState('ready'); // ready, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleCardPayment = async () => {
    try {
      setStatus('loading');

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
          <DialogTitle>Pay with Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          {status === 'loading' && (
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
              disabled={status === 'loading'}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}