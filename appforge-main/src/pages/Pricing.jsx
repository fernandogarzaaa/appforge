import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: 20,
    description: 'Perfect for getting started',
    priceId: 'price_1StWdZ8rNvlz2v0BtngMRUyS',
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
    description: 'For growing teams',
    priceId: 'price_1StWdZ8rNvlz2v0BV7sIV4A9',
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
    description: 'For enterprise needs',
    priceId: 'price_1StWdZ8rNvlz2v0BSl7yx4v7',
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
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleCheckout = async (priceId) => {
    setLoading(true);
    setSelectedPlan(priceId);
    
    try {
      // Check if running in iframe
      if (window.self !== window.top) {
        alert('Checkout is only available when accessing the app directly. Please open the app in a new window to complete your purchase.');
        setLoading(false);
        setSelectedPlan(null);
        return;
      }

      const response = await base44.functions.invoke('createCheckoutSession', {
        priceId: priceId
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        alert('Failed to create checkout session. Please try again.');
        setLoading(false);
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
      setSelectedPlan(null);
    }
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
            Choose the perfect plan for your needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg overflow-hidden transition-all duration-300 ${
                plan.popular
                  ? 'ring-2 ring-blue-500 shadow-xl scale-105'
                  : 'shadow-lg hover:shadow-xl'
              } bg-white`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}

              {/* Plan Content */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-600 text-sm mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-bold text-slate-900">
                    ${plan.price}
                  </span>
                  <span className="text-slate-600 ml-2">/month</span>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={loading && selectedPlan === plan.priceId}
                  className={`w-full mb-8 ${
                    plan.popular
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {loading && selectedPlan === plan.priceId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Get Started'
                  )}
                </Button>

                {/* Features */}
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Test Mode Notice */}
        <div className="mt-12 max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-sm text-amber-900">
            💳 <strong>Test Mode:</strong> Use card <code className="bg-amber-100 px-2 py-1 rounded">4242 4242 4242 4242</code> with any future expiry and CVC to test payments.
          </p>
          <p className="text-xs text-amber-700 mt-2">
            To accept real payments, claim your Stripe account in Dashboard &gt; Integrations.
          </p>
        </div>
      </div>
    </div>
  );
}