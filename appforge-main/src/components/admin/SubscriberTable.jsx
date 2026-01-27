import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import PlanChangeModal from './PlanChangeModal';
import CancelSubscriptionModal from './CancelSubscriptionModal';

const plans = {
  'price_1StWdZ8rNvlz2v0BtngMRUyS': { name: 'Basic', price: 20 },
  'price_1StWdZ8rNvlz2v0BV7sIV4A9': { name: 'Pro', price: 30 },
  'price_1StWdZ8rNvlz2v0BSl7yx4v7': { name: 'Premium', price: 99 }
};

export default function SubscriberTable() {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['allSubscribers'],
    queryFn: () => base44.functions.invoke('getAllSubscribers', {})
  });

  const changePlanMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('adminChangePlan', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSubscribers'] });
      setShowPlanModal(false);
      setSelectedSubscription(null);
    }
  });

  const cancelSubMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('adminCancelSubscription', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSubscribers'] });
      setShowCancelModal(false);
      setSelectedSubscription(null);
    }
  });

  const handleChangePlan = async (newPriceId) => {
    await changePlanMutation.mutateAsync({
      subscription_id: selectedSubscription.id,
      new_price_id: newPriceId
    });
  };

  const handleCancelSub = async () => {
    await cancelSubMutation.mutateAsync({
      subscription_id: selectedSubscription.id
    });
  };

  const subscriberList = subscribers?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            All Subscribers ({subscriberList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="space-y-2">
              {subscriberList.map((sub) => (
                <div key={sub.id}>
                  <div className="border rounded-lg p-4 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{sub.customer_email}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Plan: <span className="font-semibold">{sub.plan_name}</span> • ${sub.price}/month
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          sub.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }>
                          {sub.status}
                        </Badge>
                        <button
                          onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition"
                        >
                          <ChevronDown className={`w-5 h-5 transition ${
                            expandedId === sub.id ? 'rotate-180' : ''
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === sub.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Subscription ID</p>
                            <p className="font-mono text-xs text-slate-900">{sub.id}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Current Period End</p>
                            <p className="text-slate-900">
                              {new Date(sub.current_period_end).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Created</p>
                            <p className="text-slate-900">
                              {new Date(sub.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Total Invoices</p>
                            <p className="text-slate-900">{sub.invoice_count}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        {sub.status === 'active' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSubscription(sub);
                                setShowPlanModal(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Change Plan
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 border-red-200"
                              onClick={() => {
                                setSelectedSubscription(sub);
                                setShowCancelModal(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showPlanModal && selectedSubscription && (
        <PlanChangeModal
          subscription={selectedSubscription}
          plans={plans}
          onClose={() => setShowPlanModal(false)}
          onConfirm={handleChangePlan}
          loading={changePlanMutation.isPending}
        />
      )}

      {showCancelModal && selectedSubscription && (
        <CancelSubscriptionModal
          subscription={selectedSubscription}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelSub}
          loading={cancelSubMutation.isPending}
        />
      )}
    </>
  );
}