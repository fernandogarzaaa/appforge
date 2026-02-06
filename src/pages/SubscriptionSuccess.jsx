import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SubscriptionSuccess() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReceipt();
  }, []);

  const loadReceipt = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const signature = params.get('tx');

      if (!signature) {
        setError('No transaction found. Please start a new subscription.');
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('getSolanaReceipt', {
        signature
      });
      setSession(response.data);
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load payment receipt.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <p className="text-slate-900 font-semibold mb-4">{error}</p>
              <Link to={createPageUrl('Pricing')}>
                <Button className="w-full">Back to Pricing</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Card */}
        <Card className="bg-white border-green-200 border-2 mb-8">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Subscription Confirmed!
              </h1>
              <p className="text-slate-600">
                Your Solana payment has been confirmed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plan Details */}
        <Card className="bg-white mb-8">
          <CardHeader>
            <CardTitle>Your Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-slate-600">Subscription ID</span>
              <span className="text-slate-900 font-mono text-sm truncate">
                {session?.reference_id || session?.id}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Transaction Signature</span>
              <span className="text-slate-900 font-mono text-sm truncate">
                {session?.transaction_signature}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="bg-blue-50 border-blue-200 mb-8">
          <CardHeader>
            <CardTitle className="text-blue-900">What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 font-bold">1</span>
                <span className="text-slate-700">Access all features included in your plan immediately</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 font-bold">2</span>
                <span className="text-slate-700">You'll be charged ${planInfo.price} on {nextBillingDate}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 font-bold">3</span>
                <span className="text-slate-700">Manage your subscription from your account settings anytime</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link to={createPageUrl('Dashboard')} className="flex-1">
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              Go to Dashboard
            </Button>
          </Link>
          <Link to={createPageUrl('Pricing')} className="flex-1">
            <Button variant="outline" className="w-full">
              View All Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
