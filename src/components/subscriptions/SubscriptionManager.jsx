import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SubscriptionPlansCard from './SubscriptionPlansCard';
import SolanaPaymentModal from '@/components/payments/SolanaPaymentModal';
import { Loader2, Calendar, CreditCard } from 'lucide-react';

export default function SubscriptionManager() {
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      const userData = await base44.auth.me();
      setUser(userData);

      const subs = await base44.entities.UserSubscription.filter({
        user_id: userData.email,
        status: 'active'
      });

      if (subs.length > 0) {
        setSubscription(subs[0]);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleSelectPlanAndPay = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (txSignature) => {
    try {
      setIsProcessing(true);
      
      // Process subscription upgrade with payment confirmation
      const response = await base44.functions.invoke('upgradeSubscription', {
        plan_id: selectedPlan.id,
        payment_method: 'solana_wallet',
        transaction_signature: txSignature
      });

      if (response.data.success) {
        await loadSubscription();
        setShowPlans(false);
        setShowPaymentModal(false);
        setSelectedPlan(null);
      } else {
        throw new Error(response.data.error || 'Upgrade failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Current Subscription</span>
              <Badge className="bg-green-600">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
               <p className="text-xs text-gray-500">Plan</p>
               <p className="text-lg font-bold">{subscription.plan_id}</p>
             </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Started
                </p>
                <p className="text-sm font-semibold">
                  {new Date(subscription.started_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Renews
                  </p>
                  <p className="text-sm font-semibold">
                    {new Date(subscription.renews_at).toLocaleDateString()}
                  </p>
              </div>
            </div>

            <Button
              onClick={() => setShowPlans(true)}
              variant="outline"
              className="w-full"
            >
              Change Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 mb-4">No active subscription</p>
            <Button
              onClick={() => setShowPlans(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Choose a Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans Modal */}
      <Dialog open={showPlans} onOpenChange={setShowPlans}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Your Plan</DialogTitle>
          </DialogHeader>
          <SubscriptionPlansCard onSelectPlan={handleSelectPlan} />

          {selectedPlan && (
            <div className="mt-6 p-4 bg-purple-50 rounded border border-purple-200">
              <p className="text-sm text-gray-700 mb-3">
                Upgrade to <span className="font-bold">{selectedPlan.tier}</span> for{' '}
                <span className="font-bold text-purple-600">{selectedPlan.price_per_month_sol} SOL/month</span>
              </p>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay with Phantom'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}