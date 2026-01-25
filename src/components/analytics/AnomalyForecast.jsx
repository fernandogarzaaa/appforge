import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap } from 'lucide-react';

export default function AnomalyForecast({ predictions = [] }) {
  const anomalyPredictions = predictions.filter(p => p.prediction_type === 'anomaly' || p.anomaly_risk > 50);
  
  if (anomalyPredictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Anomaly Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 py-8 text-center">No anomalies forecasted in the next period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Anomaly Forecast ({anomalyPredictions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalyPredictions.map((prediction, idx) => (
          <div key={idx} className="p-3 border rounded-lg bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-sm">{prediction.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{prediction.description}</p>
              </div>
              <Badge className="bg-red-600">{prediction.anomaly_risk}% Risk</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-600">Confidence</p>
                <p className="font-bold">{prediction.confidence_score}%</p>
              </div>
              <div>
                <p className="text-gray-600">Forecast</p>
                <p className="font-bold">{prediction.forecast_period}</p>
              </div>
              <div>
                <p className="text-gray-600">Trend</p>
                <p className="font-bold capitalize">{prediction.current_trend}</p>
              </div>
            </div>
            {prediction.recommended_actions && prediction.recommended_actions.length > 0 && (
              <div className="mt-2 pt-2 border-t text-xs">
                <p className="font-semibold text-gray-700 mb-1">Actions:</p>
                {prediction.recommended_actions.slice(0, 2).map((action, i) => (
                  <p key={i} className="text-gray-600 flex items-start gap-1">
                    <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {action}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}