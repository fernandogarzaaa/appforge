import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function PlanChangeModal({ subscription, plans, onClose, onConfirm, loading }) {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const planEntries = Object.entries(plans).map(([priceId, planInfo]) => ({
    priceId,
    ...planInfo
  }));

  const currentPlanEntry = planEntries.find(p => p.name === subscription.plan_name);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle>Change Plan</CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Current: <span className="font-semibold">{subscription.plan_name}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {planEntries.map((plan) => (
              <button
                key={plan.priceId}
                onClick={() => setSelectedPlan(plan.priceId)}
                className={`w-full p-3 border rounded-lg transition text-left ${
                  selectedPlan === plan.priceId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{plan.name}</p>
                    <p className="text-sm text-slate-600">${plan.price}/month</p>
                  </div>
                  {currentPlanEntry?.name === plan.name && (
                    <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => selectedPlan && onConfirm(selectedPlan)}
              disabled={!selectedPlan || selectedPlan === currentPlanEntry?.priceId || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}