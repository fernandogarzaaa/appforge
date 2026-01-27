import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Brain, TrendingUp, LineChart, BarChart3, Target,
  Loader2, Sparkles, Play, Download, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MODEL_TYPES = [
  { id: 'forecast', name: 'Time Series Forecast', icon: TrendingUp, description: 'Predict future values based on historical data' },
  { id: 'classification', name: 'Classification', icon: Target, description: 'Categorize data into predefined classes' },
  { id: 'sentiment', name: 'Sentiment Analysis', icon: BarChart3, description: 'Analyze text sentiment (positive/negative/neutral)' },
  { id: 'anomaly', name: 'Anomaly Detection', icon: LineChart, description: 'Identify unusual patterns in data' },
  { id: 'recommendation', name: 'Recommendation', icon: Sparkles, description: 'Suggest items based on preferences' },
];

export default function PredictiveModels({ projectId }) {
  const [selectedModel, setSelectedModel] = useState(null);
  const [inputData, setInputData] = useState('');
  const [parameters, setParameters] = useState({
    periods: '7',
    confidence: '0.95',
    categories: '',
  });
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runPrediction = async () => {
    if (!selectedModel || !inputData.trim()) {
      toast.error('Select a model and provide input data');
      return;
    }

    setIsRunning(true);
    setResult(null);

    const modelPrompts = {
      forecast: `Analyze this time series data and predict the next ${parameters.periods} periods:
Data: ${inputData}

Provide predictions with confidence intervals. Return JSON with:
- predictions: array of {period, value, lower_bound, upper_bound}
- trend: "increasing", "decreasing", or "stable"
- seasonality: detected patterns
- insights: key observations`,

      classification: `Classify the following data into categories: ${parameters.categories || 'auto-detect categories'}
Data: ${inputData}

Return JSON with:
- classifications: array of {item, category, confidence}
- category_distribution: object with counts
- insights: classification insights`,

      sentiment: `Perform sentiment analysis on:
${inputData}

Return JSON with:
- overall_sentiment: "positive", "negative", or "neutral"
- sentiment_score: -1 to 1
- breakdown: array of {text_segment, sentiment, score}
- key_phrases: important phrases detected
- emotions: detected emotions with scores`,

      anomaly: `Detect anomalies in this data:
${inputData}

Return JSON with:
- anomalies: array of {index, value, anomaly_score, reason}
- normal_range: {min, max}
- outlier_threshold: number
- insights: explanation of anomalies`,

      recommendation: `Based on this user/item data, generate recommendations:
${inputData}

Return JSON with:
- recommendations: array of {item, score, reason}
- user_profile: inferred preferences
- similar_items: related items
- insights: recommendation strategy`,
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: modelPrompts[selectedModel],
      response_json_schema: {
        type: 'object',
        properties: {
          predictions: { type: 'array' },
          classifications: { type: 'array' },
          overall_sentiment: { type: 'string' },
          sentiment_score: { type: 'number' },
          breakdown: { type: 'array' },
          anomalies: { type: 'array' },
          recommendations: { type: 'array' },
          trend: { type: 'string' },
          insights: { type: 'string' },
          key_phrases: { type: 'array' },
          emotions: { type: 'object' },
          normal_range: { type: 'object' },
          user_profile: { type: 'object' },
        }
      }
    });

    setResult(response);
    setIsRunning(false);
    toast.success('Prediction complete!');
  };

  const exportResult = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedModel}_prediction.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentModelInfo = MODEL_TYPES.find(m => m.id === selectedModel);

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <div className="grid grid-cols-5 gap-2">
        {MODEL_TYPES.map((model) => {
          const Icon = model.icon;
          return (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                selectedModel === model.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:bg-gray-50"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 mx-auto mb-1",
                selectedModel === model.id ? "text-purple-600" : "text-gray-500"
              )} />
              <span className="text-xs font-medium block">{model.name}</span>
            </button>
          );
        })}
      </div>

      {selectedModel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <currentModelInfo.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{currentModelInfo.name}</h3>
                  <p className="text-sm text-gray-600">{currentModelInfo.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Data */}
          <div>
            <Label className="text-sm text-gray-600 mb-1.5 block">Input Data</Label>
            <Textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder={
                selectedModel === 'forecast' 
                  ? "Enter time series data (e.g., [100, 120, 115, 130, 145, 160])"
                  : selectedModel === 'sentiment'
                  ? "Enter text to analyze..."
                  : selectedModel === 'classification'
                  ? "Enter items to classify (one per line or JSON array)"
                  : selectedModel === 'anomaly'
                  ? "Enter data points to check for anomalies"
                  : "Enter user preferences or item data"
              }
              className="h-32 rounded-xl resize-none"
            />
          </div>

          {/* Model Parameters */}
          <div className="grid grid-cols-2 gap-4">
            {selectedModel === 'forecast' && (
              <>
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">Forecast Periods</Label>
                  <Input
                    type="number"
                    value={parameters.periods}
                    onChange={(e) => setParameters({ ...parameters, periods: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">Confidence Level</Label>
                  <Select 
                    value={parameters.confidence} 
                    onValueChange={(v) => setParameters({ ...parameters, confidence: v })}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.90">90%</SelectItem>
                      <SelectItem value="0.95">95%</SelectItem>
                      <SelectItem value="0.99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {selectedModel === 'classification' && (
              <div className="col-span-2">
                <Label className="text-sm text-gray-600 mb-1.5 block">Categories (comma-separated, or leave empty for auto-detect)</Label>
                <Input
                  value={parameters.categories}
                  onChange={(e) => setParameters({ ...parameters, categories: e.target.value })}
                  placeholder="e.g., Tech, Finance, Health, Sports"
                  className="h-10 rounded-xl"
                />
              </div>
            )}
          </div>

          {/* Run Button */}
          <Button
            onClick={runPrediction}
            disabled={isRunning || !inputData.trim()}
            className="w-full h-11 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Prediction
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Results
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runPrediction()}
                        className="rounded-lg"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Rerun
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportResult}
                        className="rounded-lg"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Sentiment Results */}
                  {result.overall_sentiment && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className={cn(
                          "text-sm px-3 py-1",
                          result.overall_sentiment === 'positive' && "bg-green-100 text-green-700",
                          result.overall_sentiment === 'negative' && "bg-red-100 text-red-700",
                          result.overall_sentiment === 'neutral' && "bg-gray-100 text-gray-700"
                        )}>
                          {result.overall_sentiment.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Score: {(result.sentiment_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      {result.key_phrases?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {result.key_phrases.map((phrase, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{phrase}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Forecast Results */}
                  {result.predictions?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          result.trend === 'increasing' && "bg-green-100 text-green-700",
                          result.trend === 'decreasing' && "bg-red-100 text-red-700",
                          result.trend === 'stable' && "bg-blue-100 text-blue-700"
                        )}>
                          {result.trend}
                        </Badge>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1 max-h-40 overflow-auto">
                        {result.predictions.map((p, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600">Period {p.period}</span>
                            <span className="font-mono">{p.value?.toFixed?.(2) || p.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anomaly Results */}
                  {result.anomalies?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Detected Anomalies: {result.anomalies.length}</p>
                      <div className="bg-red-50 rounded-lg p-3 space-y-2">
                        {result.anomalies.map((a, i) => (
                          <div key={i} className="text-sm">
                            <Badge className="bg-red-100 text-red-700 mr-2">Index {a.index}</Badge>
                            <span>{a.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations?.length > 0 && (
                    <div className="space-y-2">
                      {result.recommendations.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="font-medium text-sm">{r.item}</span>
                          <Badge variant="outline">{(r.score * 100).toFixed(0)}% match</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Insights */}
                  {result.insights && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                      <p className="text-sm text-indigo-800">
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        {result.insights}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}