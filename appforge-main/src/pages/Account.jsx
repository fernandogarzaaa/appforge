import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, FileText, Settings, LogOut, Loader2, Trash2 } from 'lucide-react';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: subscriptionData, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => base44.functions.invoke('getSubscriptionInfo', {}),
    enabled: !!user
  });

  const { data: billingHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['billingHistory'],
    queryFn: () => base44.functions.invoke('getBillingHistory', {}),
    enabled: !!user
  });

  const subscription = subscriptionData?.data;
  const invoices = billingHistory?.data || [];

  const handleCancelSubscription = async () => {
    setCancelingSubscription(true);
    try {
      await base44.functions.invoke('cancelSubscription', {});
      setShowCancelModal(false);
      // Refresh subscription data
      window.location.reload();
    } catch (error) {
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-600 mt-2">Manage your subscription and billing</p>
        </div>

        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="subscription">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="billing">
              <FileText className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="payment">
              <Settings className="w-4 h-4 mr-2" />
              Payment Method
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Settings className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-4">
            {subLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </CardContent>
              </Card>
            ) : subscription ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Current Subscription</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Plan</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {subscription.plan_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Status</p>
                        <Badge className={
                          subscription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : subscription.status === 'canceled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Monthly Price</p>
                        <p className="text-xl font-semibold text-slate-900">
                          ${subscription.price}/month
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Next Billing Date</p>
                        <p className="text-slate-900">
                          {new Date(subscription.next_billing_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {subscription.status === 'active' && (
                      <div className="pt-4 border-t">
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="text-red-600 hover:text-red-700 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Cancel Subscription
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cancel Confirmation Modal */}
                {showCancelModal && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-red-900">Cancel Subscription?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-800 mb-6">
                        Are you sure you want to cancel your subscription? You'll lose access to all premium features at the end of your current billing period.
                      </p>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelModal(false)}
                          disabled={cancelingSubscription}
                        >
                          Keep Subscription
                        </Button>
                        <Button
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleCancelSubscription}
                          disabled={cancelingSubscription}
                        >
                          {cancelingSubscription ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Canceling...
                            </>
                          ) : (
                            'Confirm Cancellation'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No active subscription</p>
                    <Button onClick={() => window.location.href = '/Pricing'}>
                      View Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            {historyLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </CardContent>
              </Card>
            ) : invoices.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">
                              {new Date(invoice.created * 1000).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-slate-900 font-semibold">
                              ${(invoice.total / 100).toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={
                                invoice.paid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }>
                                {invoice.paid ? 'Paid' : 'Pending'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {invoice.invoice_pdf ? (
                                <a
                                  href={invoice.invoice_pdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  View
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No billing history yet</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payment Method Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  To update your payment method, please use the Stripe customer portal:
                </p>
                <Button
                  onClick={() => window.open('https://billing.stripe.com/login', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Go to Stripe Portal
                </Button>
                <p className="text-xs text-slate-500 mt-4">
                  You'll be able to update your payment method securely through the Stripe portal.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Full Name</p>
                  <p className="text-lg text-slate-900">{user.full_name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Email</p>
                  <p className="text-lg text-slate-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Role</p>
                  <Badge className="bg-blue-100 text-blue-800">
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                  </Badge>
                </div>
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 border-red-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}