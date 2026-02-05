import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import SubscriptionCard from '../components/subscription/SubscriptionCard';
import SolanaPaymentModal from '../components/payments/SolanaPaymentModal';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plansList, user] = await Promise.all([
        base44.entities.SubscriptionPlan.filter({ is_active: true }),
        base44.auth.me()
      ]);

      setPlans(plansList || []);

      // Get user's current subscription
      if (user) {
        const subs = await base44.entities.UserSubscription.filter({
          user_id: user.email,
          status: 'active'
        });
        if (subs.length > 0) {
          setUserSubscription(subs[0]);
        }
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
   if (userSubscription?.plan_id === plan.id) {
     return; // Already subscribed
   }
   setSelectedPlan(plan);
   setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
   if (!selectedPlan) return;

   try {
     await base44.functions.invoke('createSubscription', {
       plan_id: selectedPlan.id,
       payment_method: 'solana'
     });

     setShowPayment(false);
     setSelectedPlan(null);
     setPaymentMethod(null);
     await loadData();
   } catch (error) {
     console.error('Error creating subscription:', error);
   }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Scale your AI coaching system with flexible plans
          </p>
        </div>

        {/* Current Subscription Info */}
        {userSubscription && (
          <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Subscription</p>
                  <p className="text-xl font-semibold">{userSubscription.plan_id}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Active until {new Date(userSubscription.renews_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-green-600">Active</Badge>
              </div>

              {/* Usage Info */}
              {userSubscription.current_usage && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-green-200">
                  <div>
                    <p className="text-xs text-gray-600">Agents Used</p>
                    <p className="text-lg font-bold">{userSubscription.current_usage.agents_created || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Recommendations</p>
                    <p className="text-lg font-bold">{userSubscription.current_usage.recommendations_used || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Workflows</p>
                    <p className="text-lg font-bold">{userSubscription.current_usage.workflows_used || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">API Calls</p>
                    <p className="text-lg font-bold">{userSubscription.current_usage.api_calls_used || 0}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <SubscriptionCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={userSubscription?.plan_id === plan.id}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>

        {/* Payment Modal */}
        {showPayment && selectedPlan && (
          <SolanaPaymentModal
            isOpen={showPayment}
            onClose={() => {
              setShowPayment(false);
              setSelectedPlan(null);
              setPaymentMethod(null);
            }}
            amount={selectedPlan.price_per_month_sol}
            itemName={`${selectedPlan.name} Plan`}
            paymentType="subscription"
            referenceId={selectedPlan.id}
            onPaymentSuccess={() => handlePaymentSuccess()}
          />
        )}
      </div>
    </div>
  );
}