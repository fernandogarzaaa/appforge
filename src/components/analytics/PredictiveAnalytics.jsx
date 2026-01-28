import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Download, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PredictiveAnalytics({ projectId }) {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generatePredictions();
  }, [projectId]);

  const generatePredictions = async () => {
    setLoading(true);
    try {
      // Simulate AI prediction generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        actual: Math.floor(1000 + Math.random() * 500 + i * 20),
      }));

      const forecastData = Array.from({ length: 14 }, (_, i) => ({
        day: 30 + i + 1,
        predicted: Math.floor(1600 + Math.random() * 300 + i * 25),
        confidence_low: Math.floor(1400 + Math.random() * 200 + i * 20),
        confidence_high: Math.floor(1800 + Math.random() * 400 + i * 30),
      }));

      const combinedData = [
        ...historicalData.map(d => ({ ...d, predicted: null })),
        ...forecastData.map(d => ({ ...d, actual: null }))
      ];

      setPredictions({
        userGrowth: combinedData,
        churnPrediction: {
          rate: 8.2,
          trend: 'decreasing',
          change: -1.3,
          atRiskUsers: 142,
          factors: [
            { factor: 'Low engagement (< 2 sessions/week)', impact: 'high', users: 52 },
            { factor: 'No activity in 7 days', impact: 'high', users: 38 },
            { factor: 'Feature usage decline', impact: 'medium', users: 32 },
            { factor: 'Support ticket escalation', impact: 'medium', users: 20 }
          ]
        },
        revenueForeccast: {
          nextMonth: 45600,
          confidence: 87,
          growth: 12.4
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    toast.loading('Generating AI-powered report...');
    
    try {
      const reportPrompt = `Generate a comprehensive analytics report based on the following data:
- User growth trend: +12.4% month-over-month
- Churn rate: 8.2% (decreasing by 1.3%)
- At-risk users: 142
- Revenue forecast: $45,600 next month
- Top churn factors: Low engagement, inactivity, feature usage decline

Provide:
1. Executive Summary
2. Key Insights
3. Risk Analysis
4. Actionable Recommendations
5. Growth Opportunities

Format as a professional business report.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: reportPrompt
      });

      toast.dismiss();
      toast.success('Report generated successfully!');
      
      // Open report in new window or download
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-pulse" />
          <p className="text-gray-600">AI is analyzing your data...</p>
        </div>
      </div>
    );
  }

  if (!predictions) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">AI-Powered Predictions</h2>
        <Button onClick={generateReport} className="bg-indigo-600 hover:bg-indigo-700">
          <Download className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* User Growth Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth Forecast (Next 14 Days)</CardTitle>
          <CardDescription>AI prediction based on historical patterns and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={predictions.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.3}
                name="Historical"
              />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.3}
                strokeDasharray="5 5"
                name="Predicted"
              />
              <Area 
                type="monotone" 
                dataKey="confidence_high" 
                stroke="#d1d5db" 
                fill="#f3f4f6" 
                fillOpacity={0.2}
                name="Confidence High"
              />
              <Area 
                type="monotone" 
                dataKey="confidence_low" 
                stroke="#d1d5db" 
                fill="#f3f4f6" 
                fillOpacity={0.2}
                name="Confidence Low"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn Prediction */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Risk Analysis</CardTitle>
            <CardDescription>Users at risk of leaving</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-4xl font-bold">{predictions.churnPrediction.rate}%</span>
                <Badge className="bg-green-600">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {predictions.churnPrediction.change}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Predicted churn rate</p>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-semibold">{predictions.churnPrediction.atRiskUsers} Users at Risk</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Top Risk Factors:</p>
              {predictions.churnPrediction.factors.map((factor, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">{factor.factor}</span>
                    <Badge className={
                      factor.impact === 'high' ? 'bg-red-600' : 
                      factor.impact === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                    }>
                      {factor.impact}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-600">{factor.users} users affected</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>Next 30 days projection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-4xl font-bold">${(predictions.revenueForeccast.nextMonth / 1000).toFixed(1)}K</span>
                <Badge className="bg-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{predictions.revenueForeccast.growth}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Predicted revenue next month</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Confidence Level</span>
                  <span className="text-sm font-bold text-indigo-600">{predictions.revenueForeccast.confidence}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600" 
                    style={{ width: `${predictions.revenueForeccast.confidence}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">Best Case</span>
                  <span className="font-semibold">${((predictions.revenueForeccast.nextMonth * 1.15) / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">Expected</span>
                  <span className="font-semibold">${(predictions.revenueForeccast.nextMonth / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">Worst Case</span>
                  <span className="font-semibold">${((predictions.revenueForeccast.nextMonth * 0.85) / 1000).toFixed(1)}K</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}