import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsageInsights from '@/components/analytics/UsageInsights';
import { BarChart3, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, Users, Eye, MousePointer, Clock, 
  Globe, Smartphone, Monitor, BarChart3
} from 'lucide-react';

export default function Analytics() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics Dashboard</h1>
        <p className="text-gray-500">Track your app performance and user engagement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <Badge variant="outline" className="text-green-600">+24%</Badge>
            </div>
            <div className="text-2xl font-bold">8,624</div>
            <p className="text-sm text-gray-600">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <Badge variant="outline" className="text-green-600">+18%</Badge>
            </div>
            <div className="text-2xl font-bold">32,450</div>
            <p className="text-sm text-gray-600">Page Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <Badge variant="outline" className="text-green-600">+12%</Badge>
            </div>
            <div className="text-2xl font-bold">4m 32s</div>
            <p className="text-sm text-gray-600">Avg. Session</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <Badge variant="outline" className="text-green-600">+31%</Badge>
            </div>
            <div className="text-2xl font-bold">42.8%</div>
            <p className="text-sm text-gray-600">Conversion Rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { source: 'Direct', visits: 12450, color: 'bg-blue-500' },
                    { source: 'Google Search', visits: 8920, color: 'bg-green-500' },
                    { source: 'Social Media', visits: 6340, color: 'bg-purple-500' },
                    { source: 'Referral', visits: 4740, color: 'bg-orange-500' }
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.source}</span>
                        <span className="font-semibold">{item.visits.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color}`}
                          style={{ width: `${(item.visits / 12450) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { page: '/dashboard', views: 8450 },
                    { page: '/projects', views: 6320 },
                    { page: '/ai-assistant', views: 5890 },
                    { page: '/pricing', views: 4120 }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono">{item.page}</span>
                      <Badge variant="outline">{item.views.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">68%</div>
                  <p className="text-sm text-gray-600 mt-1">Returning Users</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">32%</div>
                  <p className="text-sm text-gray-600 mt-1">New Users</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">5.2</div>
                  <p className="text-sm text-gray-600 mt-1">Pages/Session</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Monitor, name: 'Desktop', percentage: 58, color: 'blue' },
                  { icon: Smartphone, name: 'Mobile', percentage: 35, color: 'green' },
                  { icon: Monitor, name: 'Tablet', percentage: 7, color: 'purple' }
                ].map((device, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6 text-center">
                      <device.icon className={`w-12 h-12 mx-auto mb-3 text-${device.color}-600`} />
                      <div className="text-3xl font-bold">{device.percentage}%</div>
                      <p className="text-sm text-gray-600 mt-1">{device.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { country: 'United States', users: 3240, flag: '🇺🇸' },
                  { country: 'United Kingdom', users: 1890, flag: '🇬🇧' },
                  { country: 'Canada', users: 1120, flag: '🇨🇦' },
                  { country: 'Germany', users: 890, flag: '🇩🇪' },
                  { country: 'France', users: 780, flag: '🇫🇷' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.flag}</span>
                      <span className="font-medium">{item.country}</span>
                    </div>
                    <Badge>{item.users.toLocaleString()} users</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}