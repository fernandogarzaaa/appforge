import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, AlertTriangle } from 'lucide-react';

export default function BusinessImpactCard({ impact }) {
  if (!impact) return null;

  const formatCurrency = (value) => `$${(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-600" />
          Business Impact Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Financial Impact */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-600 font-semibold mb-1">FINANCIAL IMPACT</p>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-sm text-slate-700">Estimated Cost</span>
              <span className="text-2xl font-bold text-amber-600">
                {formatCurrency(impact.financial_impact?.estimated_cost_usd)}
              </span>
            </div>
            {impact.financial_impact?.cost_per_minute && (
              <p className="text-xs text-slate-600">
                {formatCurrency(impact.financial_impact.cost_per_minute)}/minute
              </p>
            )}
          </div>
        </div>

        {/* Operational Impact */}
        {impact.operational_impact && (
          <div className="grid grid-cols-2 gap-2">
            {impact.operational_impact.affected_users && (
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold">Users Affected</p>
                <p className="text-lg font-bold text-blue-700">{impact.operational_impact.affected_users.toLocaleString()}</p>
              </div>
            )}
            {impact.operational_impact.affected_transactions && (
              <div className="p-2 bg-green-50 rounded border border-green-200">
                <p className="text-xs text-green-600 font-semibold">Transactions</p>
                <p className="text-lg font-bold text-green-700">{impact.operational_impact.affected_transactions.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Severity */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-semibold">Business Severity</span>
          <Badge className={
            impact.severity_business === 'critical' ? 'bg-red-600' :
            impact.severity_business === 'high' ? 'bg-orange-600' :
            impact.severity_business === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
          }>
            {impact.severity_business?.toUpperCase()}
          </Badge>
        </div>

        {/* Recovery Info */}
        {impact.estimated_resolution_time_minutes && (
          <div className="text-sm">
            <p className="text-slate-600">Estimated Resolution: <span className="font-semibold">{impact.estimated_resolution_time_minutes} min</span></p>
            <p className="text-slate-600 mt-1">Recovery Cost: <span className="font-semibold">{formatCurrency(impact.estimated_recovery_cost)}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}