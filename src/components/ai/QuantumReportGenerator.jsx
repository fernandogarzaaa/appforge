import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, Download, FileText } from 'lucide-react';

export default function QuantumReportGenerator({ simulationData = {} }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const dataContext = `
Simulation Parameters: ${JSON.stringify(simulationData)}
Generated at: ${new Date().toISOString()}
      `.trim();

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive quantum simulation report based on this data:

${dataContext}

Include:
1. Executive Summary (2-3 sentences)
2. Key Metrics and Findings (5-7 bullet points with values)
3. Performance Analysis (insights about quantum state quality)
4. Recommendations (3-4 actionable next steps)
5. Visualization suggestions (what charts would be most useful)

Format as JSON with keys: summary, metrics, analysis, recommendations, visualizations`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            metrics: { type: 'array', items: { type: 'string' } },
            analysis: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } },
            visualizations: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      setReport(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={generateReport}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <BarChart3 className="w-4 h-4 mr-2" />
        )}
        Generate AI Report
      </Button>

      {report && (
        <Card className="border-cyan-200 bg-cyan-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quantum Analysis Report
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-6 px-2">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-gray-900 mb-2">Executive Summary</p>
              <p className="text-gray-700 leading-relaxed">{report.summary}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Key Metrics</p>
              <div className="space-y-1">
                {report.metrics?.map((metric, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-cyan-600 font-bold mt-0.5">•</span>
                    <span>{metric}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Performance Analysis</p>
              <p className="text-gray-700 leading-relaxed">{report.analysis}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Recommendations</p>
              <div className="space-y-1">
                {report.recommendations?.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-gray-700">
                    <Badge variant="outline" className="text-xs mt-0.5">
                      {idx + 1}
                    </Badge>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Suggested Visualizations</p>
              <div className="flex flex-wrap gap-2">
                {report.visualizations?.map((viz, idx) => (
                  <Badge key={idx} className="bg-blue-100 text-blue-800">
                    {viz}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}