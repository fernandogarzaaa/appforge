import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, Clock } from 'lucide-react';

export default function ReferralStats({ userEmail }) {
  const { data: referrals } = useQuery({
    queryKey: ['referrals', userEmail],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: userEmail })
  });

  const stats = {
    total: referrals?.length || 0,
    completed: referrals?.filter(r => r.status === 'completed').length || 0,
    pending: referrals?.filter(r => r.status === 'pending').length || 0,
    totalRewards: referrals?.reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0,
    claimedRewards: referrals?.filter(r => r.reward_claimed).reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Total Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{stats.total}</span>
            <Users className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{stats.completed}</span>
            <CheckCircle2 className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{stats.pending}</span>
            <Clock className="w-8 h-8 text-yellow-500 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Credits Earned</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{stats.claimedRewards}</div>
          <p className="text-xs text-slate-600 mt-1">of {stats.totalRewards} total</p>
        </CardContent>
      </Card>

      {referrals && referrals.length > 0 && (
        <div className="col-span-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {referrals.map(ref => (
                  <div key={ref.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ref.referee_email || 'Code: ' + ref.referral_code}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(ref.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={
                        ref.status === 'completed' ? 'bg-green-600' :
                        ref.status === 'accepted' ? 'bg-blue-600' :
                        'bg-slate-400'
                      }>
                        {ref.status}
                      </Badge>
                      {ref.reward_claimed && <Badge className="bg-yellow-600">+{ref.reward_amount} credits</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}