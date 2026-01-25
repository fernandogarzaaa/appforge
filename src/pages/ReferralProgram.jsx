import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReferralLinkGenerator from '@/components/referral/ReferralLinkGenerator';
import ReferralStats from '@/components/referral/ReferralStats';
import { Gift, TrendingUp } from 'lucide-react';

export default function ReferralProgram() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!user) return <div className="p-8 text-center">Please log in to access the referral program</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Gift className="w-10 h-10 text-amber-500" />
            Referral Program
          </h1>
          <p className="text-slate-600 mt-2">Invite friends and earn rewards</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Benefits Section */}
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-amber-600">1️⃣</div>
              <h3 className="font-semibold">Share Your Link</h3>
              <p className="text-sm text-slate-700">Generate a unique referral link or invite friends by email</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-amber-600">2️⃣</div>
              <h3 className="font-semibold">They Sign Up</h3>
              <p className="text-sm text-slate-700">Your friends create an account using your referral code</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-amber-600">3️⃣</div>
              <h3 className="font-semibold">Earn Rewards</h3>
              <p className="text-sm text-slate-700">Both of you get 100 credits when they complete setup</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Referral Stats</h2>
          <ReferralStats userEmail={user.email} />
        </div>

        {/* Generate Link Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Invite Friends</h2>
          <ReferralLinkGenerator userEmail={user.email} />
        </div>
      </div>
    </div>
  );
}