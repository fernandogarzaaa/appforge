import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, TrendingUp } from 'lucide-react';

export default function MarketingBotPanel() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Marketing Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Campaign Performance</p>
                <p className="text-sm text-gray-600 mt-1">Monitor marketing bot activities</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-600">Campaigns Running</p>
                <p className="text-2xl font-bold">3</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-600">Engagement Rate</p>
                <p className="text-2xl font-bold">24%</p>
              </CardContent>
            </Card>
          </div>
          <Badge className="bg-green-600">System Operational</Badge>
        </CardContent>
      </Card>
    </div>
  );
}