import React, { useState } from 'react';
import PhantomWalletConnect from '@/components/payments/PhantomWalletConnect';
import SolanaPaymentProcessor from '@/components/payments/SolanaPaymentProcessor';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: 20,
    priceId: 'phantom_basic_plan',
    description: 'Perfect for getting started',
    features: [
      'Up to 10 workflows',
      'Basic automation',
      'Email support',
      'Monthly reports',
      '1 GB storage'
    ]
  },
  {
    name: 'Pro',
    price: 30,
    priceId: 'phantom_pro_plan',
    description: 'For growing teams',
    popular: true,
    features: [
      'Unlimited workflows',
      'Advanced automation',
      'Priority support',
      'Weekly reports',
      '50 GB storage',
      'Custom integrations'
    ]
  },
  {
    name: 'Premium',
    price: 99,
    priceId: 'phantom_premium_plan',
    description: 'For enterprise needs',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Real-time analytics',
      'Unlimited storage',
      'API access',
      'Custom workflows',
      'White-label options'
    ]
  }
];

export default function PricingPage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

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
            Choose the perfect plan and pay with Solana
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
            {plans.map((plan) => (
              <div
                key={plan.name}
                onClick={() => handlePlanSelect(plan)}
                className={`rounded-lg cursor-pointer transition-all duration-300 p-6 border-2 ${
                  selectedPlan?.name === plan.name
                    ? 'ring-2 ring-purple-500 border-purple-500 shadow-lg bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="text-xs font-semibold text-purple-600 mb-2">★ MOST POPULAR</div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 text-sm mb-3">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-slate-600 ml-2">/month</span>
                  <p className="text-xs text-slate-500 mt-1">{plan.price.toFixed(2)} USDC</p>
                </div>
                <div className="space-y-2">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 3 && (
                    <p className="text-xs text-slate-500 mt-2">+ {plan.features.length - 3} more features</p>
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

                {walletConnected && (
                  <SolanaPaymentProcessor
                    planId={selectedPlan.priceId}
                    planName={selectedPlan.name}
                    amount={selectedPlan.price}
                    walletAddress={walletAddress}
                    onPaymentSuccess={() => {
                      alert('Subscription activated! Welcome to ' + selectedPlan.name);
                      setSelectedPlan(null);
                      setWalletConnected(false);
                    }}
                    onPaymentError={() => {}}
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
            All payments processed on Solana mainnet with USDC. No KYC required.
          </p>
        </div>
      </div>
    </div>
  );
}