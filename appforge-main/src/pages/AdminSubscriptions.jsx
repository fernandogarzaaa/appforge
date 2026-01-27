import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import SubscriberTable from '@/components/admin/SubscriberTable';
import SubscriptionMetrics from '@/components/admin/SubscriptionMetrics';

export default function AdminSubscriptions() {
  const [user, setUser] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    if (userData?.role !== 'admin') {
      setUnauthorized(true);
    } else {
      setUser(userData);
    }
  };

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
              <p className="text-slate-600">Only administrators can access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Subscription Management</h1>
          <p className="text-slate-600 mt-2">Manage users, plans, and view subscription metrics</p>
        </div>

        {/* Metrics Overview */}
        <SubscriptionMetrics />

        {/* Tabs */}
        <Tabs defaultValue="subscribers" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscribers">
              <Users className="w-4 h-4 mr-2" />
              Subscribers
            </TabsTrigger>
            <TabsTrigger value="actions">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers">
            <SubscriberTable />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 font-semibold mb-2">Most Popular Plan</p>
                      <p className="text-2xl font-bold text-blue-900">Pro</p>
                      <p className="text-xs text-blue-600 mt-1">45% of subscribers</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 font-semibold mb-2">Churn Rate (30d)</p>
                      <p className="text-2xl font-bold text-green-900">2.4%</p>
                      <p className="text-xs text-green-600 mt-1">3 cancellations</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-600 font-semibold mb-2">Avg. Plan Value</p>
                      <p className="text-2xl font-bold text-purple-900">$49.67</p>
                      <p className="text-xs text-purple-600 mt-1">Across all plans</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-600 font-semibold mb-2">MRR</p>
                      <p className="text-2xl font-bold text-orange-900">$2,980</p>
                      <p className="text-xs text-orange-600 mt-1">Monthly recurring</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}