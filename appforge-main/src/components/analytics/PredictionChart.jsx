import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { TrendingUp } from 'lucide-react';

export function ForecastChart({ prediction }) {
  if (!prediction?.predicted_values || prediction.predicted_values.length === 0) return null;

  const data = prediction.predicted_values.map(v => ({
    date: new Date(v.timestamp).toLocaleDateString(),
    predicted: v.value,
    upper: v.upper_bound,
    lower: v.lower_bound
  }));

  const getRiskColor = () => {
    switch (prediction.risk_level) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#3b82f6';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {prediction.title}
            </CardTitle>
            <CardDescription>{prediction.description}</CardDescription>
          </div>
          <Badge className={`text-white ${
            prediction.risk_level === 'critical' ? 'bg-red-600' :
            prediction.risk_level === 'high' ? 'bg-orange-600' :
            prediction.risk_level === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
          }`}>
            {prediction.risk_level.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-blue-50 p-2 rounded">
            <p className="text-gray-600">Confidence</p>
            <p className="font-bold text-lg">{prediction.confidence_score}%</p>
          </div>
          <div className="bg-orange-50 p-2 rounded">
            <p className="text-gray-600">Anomaly Risk</p>
            <p className="font-bold text-lg">{prediction.anomaly_risk}%</p>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <p className="text-gray-600">Threshold Risk</p>
            <p className="font-bold text-lg">{prediction.threshold_breach_risk}%</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="upper" fill={getRiskColor()} stroke="none" fillOpacity={0.1} name="Upper Bound" />
            <Line type="monotone" dataKey="predicted" stroke={getRiskColor()} strokeWidth={2} name="Predicted" dot={false} />
            <Area type="monotone" dataKey="lower" fill={getRiskColor()} stroke="none" fillOpacity={0.05} name="Lower Bound" />
          </AreaChart>
        </ResponsiveContainer>

        {prediction.recommended_actions && prediction.recommended_actions.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold mb-2">Recommended Actions:</p>
            <ul className="space-y-1">
              {prediction.recommended_actions.map((action, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrendComparison({ predictions }) {
  const data = predictions.slice(0, 5).map(p => ({
    name: p.title.substring(0, 15),
    confidence: p.confidence_score,
    trend: p.trend_velocity || 0,
    risk: p.risk_level === 'critical' ? 100 : p.risk_level === 'high' ? 75 : p.risk_level === 'medium' ? 50 : 25
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Velocity Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="trend" fill="#6366f1" name="Velocity %" />
            <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={2} name="Confidence %" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}