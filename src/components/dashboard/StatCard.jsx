import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StatCard({ title, value, icon: Icon, gradient, change, changeType }) {
  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {change && (
            <Badge
              variant={changeType === 'increase' ? 'default' : 'secondary'}
              className={changeType === 'increase' ? 'bg-emerald-100 text-emerald-700 border-0' : ''}
            >
              {change}
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </CardContent>
    </Card>
  );
}