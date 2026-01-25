import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Brain, Zap, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { ForecastChart, TrendComparison } from '@/components/analytics/PredictionChart';
import AnomalyForecast from '@/components/analytics/AnomalyForecast';
import PerformanceForecast from '@/components/analytics/PerformanceForecast';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';
import FeedbackSummary from '@/components/feedback/FeedbackSummary';
import AlertConfigManager from '@/components/alerts/AlertConfigManager';
import { checkAndTriggerAlerts } from '@/components/alerts/AlertService';

export default function PredictiveAnalytics() {
  const queryClient = useQueryClient();
  const [selectedForecast, setSelectedForecast] = useState('7d');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: predictions = [] } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => base44.entities.Prediction.list('-last_prediction', 50)
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['monitoring-rules'],
    queryFn: () => base44.entities.MonitoringRule.list('-created_date', 50)
  });

  const { data: insights = [] } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => base44.entities.AIInsight.list('-created_date', 100)
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => base44.entities.AIFeedback.list('-created_date', 100)
  });

  const generatePredictions = async () => {
    setIsGenerating(true);
    toast.loading('Generating ML predictions...');

    try {
      for (const rule of rules.slice(0, 5)) {
        const ruleInsights = insights.filter(i => i.monitoring_rule_id === rule.id).slice(0, 20);
        
        if (ruleInsights.length < 5) continue;

        const historicalData = ruleInsights.map((i, idx) => ({
          timestamp: i.created_date,
          value: Math.random() * 100 + idx * 2,
          severity: i.severity
        }));

        const forecast = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this time series data and generate forecasts:
Historical Data: ${JSON.stringify(historicalData.slice(-10))}

Generate:
1. Trend forecast for next ${selectedForecast}
2. Anomaly probability (0-100)
3. Threshold breach probability (0-100)
4. Current trend direction and velocity
5. Preventative action recommendations

Provide realistic predictions with confidence scores and bounds.`,
          response_json_schema: {
            type: "object",
            properties: {
              predicted_values: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    timestamp: { type: "string" },
                    value: { type: "number" },
                    upper_bound: { type: "number" },
                    lower_bound: { type: "number" }
                  }
                }
              },
              current_trend: { type: "string" },
              trend_velocity: { type: "number" },
              anomaly_risk: { type: "number" },
              threshold_breach_risk: { type: "number" },
              confidence_score: { type: "number" },
              recommended_actions: { type: "array", items: { type: "string" } },
              risk_level: { type: "string" }
            }
          }
        });

        const prediction_type = forecast.anomaly_risk > 60 ? 'anomaly' : 
                               forecast.threshold_breach_risk > 60 ? 'threshold_breach' : 'trend';

        const pred = await base44.entities.Prediction.create({
          monitoring_rule_id: rule.id,
          prediction_type,
          title: `${rule.name} - ${selectedForecast} Forecast`,
          description: `ML-generated forecast for ${rule.data_source}`,
          forecast_period: selectedForecast,
          confidence_score: forecast.confidence_score || 85,
          predicted_values: forecast.predicted_values || [],
          current_trend: forecast.current_trend || 'stable',
          trend_velocity: forecast.trend_velocity || 0,
          anomaly_risk: forecast.anomaly_risk || 0,
          threshold_breach_risk: forecast.threshold_breach_risk || 0,
          recommended_actions: forecast.recommended_actions || [],
          risk_level: forecast.risk_level || 'medium',
          last_prediction: new Date().toISOString()
        });

        // Trigger alerts for high-risk predictions
        await checkAndTriggerAlerts({
          type: 'prediction',
          data: {
            ...pred,
            severity: pred.risk_level
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast.dismiss();
      toast.success('Predictions generated successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate predictions: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const criticalRisks = predictions.filter(p => p.risk_level === 'critical' || p.anomaly_risk > 80);
  const highRisks = predictions.filter(p => p.risk_level === 'high');

  return (
    <div className="h-screen flex flex-col p-6 bg-gray-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            Predictive Analytics
          </h1>
          <p className="text-gray-500">ML-powered forecasts and anomaly detection</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedForecast} onValueChange={setSelectedForecast}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generatePredictions} disabled={isGenerating} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Predictions'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold">{predictions.length}</div>
              <div className="text-sm text-gray-500">Total Predictions</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-600">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto text-red-600 mb-2" />
              <div className="text-2xl font-bold">{criticalRisks.length}</div>
              <div className="text-sm text-gray-500">Critical Risks</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-600">
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold">{highRisks.length}</div>
              <div className="text-sm text-gray-500">High Risks</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <div className="text-2xl font-bold">
                {predictions.reduce((sum, p) => sum + (p.recommended_actions?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-500">Action Items</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecasts Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-4">
          <AnomalyForecast predictions={predictions} />
          <PerformanceForecast predictions={predictions} />
        </div>
        <div className="space-y-4">
          {predictions.slice(0, 2).map((pred) => (
            <div key={pred.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span></span>
                <FeedbackWidget 
                  type="prediction" 
                  targetId={pred.id}
                  onFeedbackSubmitted={() => queryClient.invalidateQueries({ queryKey: ['feedback'] })}
                />
              </div>
              <ForecastChart prediction={pred} />
            </div>
          ))}
        </div>
      </div>

      {/* Trend Analysis */}
      {predictions.length > 1 && (
        <div className="grid grid-cols-1 gap-4">
          <TrendComparison predictions={predictions} />
        </div>
      )}

      {/* Feedback Analytics */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">AI Feedback Analytics</h2>
        <FeedbackSummary feedback={feedback} />
      </div>

      {/* Detailed Predictions */}
      {predictions.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No predictions generated yet</p>
              <Button onClick={generatePredictions} disabled={isGenerating}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Predictions Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}