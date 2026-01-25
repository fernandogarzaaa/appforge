import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Gauge } from 'lucide-react';

export default function PerformanceForecast({ predictions = [] }) {
  const performancePredictions = predictions.filter(p => 
    p.prediction_type === 'performance' || p.prediction_type === 'threshold_breach'
  );

  const data = performancePredictions.map(p => ({
    name: p.title.substring(0, 12),
    threshold_risk: p.threshold_breach_risk || 0,
    confidence: p.confidence_score,
    velocity: Math.abs(p.trend_velocity || 0)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Performance Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="threshold_risk" fill="#ef4444" name="Threshold Risk %" />
                <Bar dataKey="confidence" fill="#6366f1" name="Confidence %" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-2">
              {performancePredictions.slice(0, 4).map((pred, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border">
                  <p className="text-xs font-semibold mb-1 truncate">{pred.title}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Breach Risk:</span>
                    <Badge variant={pred.threshold_breach_risk > 70 ? 'destructive' : 'secondary'}>
                      {pred.threshold_breach_risk}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 py-8 text-center">No performance forecasts available</p>
        )}
      </CardContent>
    </Card>
  );
}