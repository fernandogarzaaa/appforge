import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import HelpTooltip from '@/components/help/HelpTooltip';

export default function ProactiveAnomalyCard({ forecast }) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || colors.medium;
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: '→',
      medium: '↗',
      high: '↑',
      critical: '⚡'
    };
    return icons[priority] || '→';
  };

  const daysUntil = forecast.trend_analysis?.days_until_breach || 0;

  return (
    <>
      <Card className={`border-2 ${
        forecast.severity_if_occurs === 'critical' ? 'border-red-400 bg-red-50' :
        forecast.severity_if_occurs === 'high' ? 'border-orange-400 bg-orange-50' : 
        'border-slate-300'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-1 ${
                  forecast.severity_if_occurs === 'critical' ? 'text-red-600' :
                  forecast.severity_if_occurs === 'high' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
                <div>
                  <CardTitle className="text-base">{forecast.title}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{forecast.description}</p>
                </div>
              </div>
            </div>
            <HelpTooltip 
              content="This prediction is based on current trends and patterns. The AI has analyzed historical data and similar scenarios to forecast a potential anomaly."
              title="Proactive Prediction"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-xs text-slate-600">Probability</p>
              <p className="text-lg font-bold text-slate-900">{forecast.probability_percent}%</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-xs text-slate-600">Predicted Timeline</p>
              <p className="text-lg font-bold text-slate-900">{daysUntil}d</p>
            </div>
          </div>

          {/* Trend Analysis */}
          {forecast.trend_analysis && (
            <div className="p-3 bg-slate-100 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold">Current Trend</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-600">Current</p>
                  <p className="font-semibold">{forecast.trend_analysis.current_value?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Predicted</p>
                  <p className="font-semibold">{forecast.trend_analysis.predicted_value?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Threshold</p>
                  <p className="font-semibold">{forecast.trend_analysis.threshold?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contributing Factors */}
          {forecast.contributing_factors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Contributing Factors</p>
              <div className="space-y-1">
                {forecast.contributing_factors.slice(0, 3).map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{factor.factor}</span>
                    <Badge variant="outline">{factor.impact_percent}% impact</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions Preview */}
          {forecast.preventative_actions?.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-900 mb-2">
                ✓ {forecast.preventative_actions.length} Preventative Actions Available
              </p>
              <div className="space-y-2">
                {forecast.preventative_actions.slice(0, 2).map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-green-900">{action.title}</span>
                  </div>
                ))}
                {forecast.preventative_actions.length > 2 && (
                  <p className="text-xs text-green-700">+{forecast.preventative_actions.length - 2} more actions</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="flex-1"
            >
              View Details
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setShowDetails(true)}
            >
              Review Actions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {forecast.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">Probability</p>
                <p className="text-2xl font-bold">{forecast.probability_percent}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">Confidence</p>
                <p className="text-2xl font-bold">{forecast.confidence_score}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">Timeline</p>
                <p className="text-2xl font-bold">{daysUntil}d</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">If Occurs</p>
                <Badge className={getSeverityColor(forecast.severity_if_occurs)}>
                  {forecast.severity_if_occurs}
                </Badge>
              </div>
            </div>

            {/* Contributing Factors */}
            {forecast.contributing_factors?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Contributing Factors</h3>
                <div className="space-y-2">
                  {forecast.contributing_factors.map((factor, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{factor.factor}</p>
                          <p className="text-sm text-slate-600">{factor.description}</p>
                        </div>
                        <Badge variant="outline">{factor.impact_percent}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preventative Actions */}
            {forecast.preventative_actions?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Recommended Preventative Actions</h3>
                <div className="space-y-3">
                  {forecast.preventative_actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg hover:border-slate-400 cursor-pointer transition-all"
                      onClick={() => setSelectedAction(action)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">{action.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{action.priority}</Badge>
                          <Badge variant="secondary">{action.effort_level}</Badge>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">
                        Expected Impact: <span className="font-semibold text-green-600">{action.expected_impact}% risk reduction</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}