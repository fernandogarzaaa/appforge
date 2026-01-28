import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { 
  Database, TrendingUp, PieChart, BarChart3, Brain, Download 
} from 'lucide-react';

export default function DataAnalysisFunctions() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dataInput, setDataInput] = useState('');

  const analysisFunctions = [
    {
      name: 'Statistical Analysis',
      description: 'Mean, median, mode, standard deviation, variance',
      icon: BarChart3,
      action: 'statistical'
    },
    {
      name: 'Trend Analysis',
      description: 'Identify patterns and trends in time-series data',
      icon: TrendingUp,
      action: 'trend'
    },
    {
      name: 'Correlation Analysis',
      description: 'Find relationships between variables',
      icon: PieChart,
      action: 'correlation'
    },
    {
      name: 'Predictive Modeling',
      description: 'AI-powered predictions and forecasting',
      icon: Brain,
      action: 'predictive'
    },
    {
      name: 'Data Cleaning',
      description: 'Remove duplicates, handle missing values, normalize',
      icon: Database,
      action: 'cleaning'
    },
    {
      name: 'Data Visualization',
      description: 'Generate charts and visual insights',
      icon: PieChart,
      action: 'visualization'
    }
  ];

  const runAnalysis = async (type) => {
    if (!dataInput.trim()) {
      toast.error('Please provide data to analyze');
      return;
    }

    setLoading(true);
    toast.loading('AI is analyzing your data...');

    try {
      let prompt = '';
      
      switch(type) {
        case 'statistical':
          prompt = `Perform comprehensive statistical analysis on this data:\n${dataInput}\n\nProvide: mean, median, mode, standard deviation, variance, min, max, quartiles. Format as JSON.`;
          break;
        case 'trend':
          prompt = `Analyze trends and patterns in this data:\n${dataInput}\n\nIdentify: upward/downward trends, seasonality, anomalies, growth rate. Provide insights.`;
          break;
        case 'correlation':
          prompt = `Find correlations between variables in this data:\n${dataInput}\n\nIdentify relationships, correlation coefficients, and key insights.`;
          break;
        case 'predictive':
          prompt = `Based on this historical data:\n${dataInput}\n\nPredict next 5 data points with confidence intervals. Explain the prediction model used.`;
          break;
        case 'cleaning':
          prompt = `Clean and normalize this data:\n${dataInput}\n\nRemove duplicates, handle missing values, fix formatting issues. Return cleaned data.`;
          break;
        case 'visualization':
          prompt = `Suggest the best visualizations for this data:\n${dataInput}\n\nRecommend chart types, key metrics to highlight, and color schemes.`;
          break;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setResult(response);
      toast.dismiss();
      toast.success('Analysis complete!');
    } catch (error) {
      toast.dismiss();
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Analysis Functions</h2>
          <p className="text-gray-500">AI-powered data analysis and insights</p>
        </div>
        <Badge className="bg-indigo-600">
          <Brain className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input Your Data</CardTitle>
          <CardDescription>Paste CSV, JSON, or raw data for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Example: Sales data&#10;Month,Revenue&#10;Jan,15000&#10;Feb,18000&#10;Mar,22000"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analysisFunctions.map((func, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <func.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{func.name}</h3>
                  <p className="text-sm text-gray-600">{func.description}</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => runAnalysis(func.action)}
                disabled={loading}
              >
                Run Analysis
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Analysis Results</CardTitle>
              <Button onClick={exportResults} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}