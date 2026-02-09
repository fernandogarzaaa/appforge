import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PhantomWalletConnect from '@/components/payments/PhantomWalletConnect';
import SolanaPaymentProcessor from '@/components/payments/SolanaPaymentProcessor';
import { getAllPlans } from '@/config/payment.config';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PricingPage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load plans from centralized config
    const productionPlans = getAllPlans().sort((a, b) => (a.tier_level || 0) - (b.tier_level || 0));
    setPlans(productionPlans);
    setIsLoading(false);
  }, []);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600">
            Choose the perfect plan and pay with USDC on Solana
          </p>
          <p className="text-sm text-slate-500 mt-2">
            ⚡ Fast • Secure • Low Fees
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Pricing Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Your Plan</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handlePlanSelect(plan)}
                className={`rounded-lg cursor-pointer transition-all duration-300 p-6 border-2 ${selectedPlan?.id === plan.id
                  ? 'ring-2 ring-purple-500 border-purple-500 shadow-lg bg-purple-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
              >
                {plan.popular && (
                  <div className="text-xs font-semibold text-purple-600 mb-2">★ MOST POPULAR</div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 text-sm mb-3">{plan.description || 'Flexible plan'}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-slate-600 ml-2">USDC/month</span>
                </div>
                <div className="space-y-2">
                  {(plan.features || []).slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {(plan.features || []).length > 3 && (
                    <p className="text-xs text-slate-500 mt-2">+ {(plan.features || []).length - 3} more features</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment</h2>

            {!selectedPlan ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <p className="text-slate-600">Select a plan above to continue</p>
              </div>
            ) : (
              <div className="space-y-4 sticky top-4">
                <PhantomWalletConnect
                  onWalletConnected={(address) => {
                    setWalletAddress(address);
                    setWalletConnected(true);
                  }}
                  onError={() => setWalletConnected(false)}
                />

                {walletConnected && selectedPlan && (
                  <SolanaPaymentProcessor
                    planId={selectedPlan.id}
                    planName={selectedPlan.name}
                    amountUSDC={selectedPlan.price}
                    walletAddress={walletAddress}
                    onPaymentSuccess={async ({ signature }) => {
                      // Subscription already created by SolanaPaymentProcessor
                      /* await base44.functions.invoke('createSubscription', {
                        plan_id: selectedPlan.id,
                        payment_method: 'solana_wallet',
                        transaction_signature: signature
                      }); */
                      alert('Subscription activated! Welcome to ' + (selectedPlan.tier_name || selectedPlan.name));
                      setSelectedPlan(null);
                      setWalletConnected(false);
                    }}
                    onPaymentError={(err) => toast.error('Payment failed: ' + (err?.message || 'Unknown error'))}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Solana Info */}
        <div className="mt-12 max-w-2xl mx-auto bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
          <p className="text-sm text-purple-900 mb-2">
            🔐 <strong>Solana Payments:</strong> Powered by Phantom Wallet for secure, instant transactions.
          </p>
          <p className="text-xs text-purple-700">
            All payments processed on Solana mainnet. No KYC required.
          </p>
        </div>
      </div>
    </div>
  );
}
