import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function QuantumErrorPredictor({ circuit, backend = 'ibm_quantum' }) {
  const [analysis, setAnalysis] = useState(null);

  const predictMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('predictQuantumErrors', {
        circuit_data: circuit,
        backend
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast.success('Error analysis complete');
    },
    onError: (err) => toast.error(err.message)
  });

  if (!circuit) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-6 text-center text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Load a circuit to predict errors</p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-50 border-blue-200 text-blue-800',
      medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      high: 'bg-orange-50 border-orange-200 text-orange-800',
      critical: 'bg-red-50 border-red-200 text-red-800'
    };
    return colors[severity] || colors.medium;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      low: CheckCircle2,
      medium: AlertTriangle,
      high: AlertCircle,
      critical: AlertCircle
    };
    return icons[severity] || AlertCircle;
  };

  return (
    <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <AlertCircle className="w-5 h-5" />
          Quantum Error Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Predict Button */}
        <Button
          onClick={() => predictMutation.mutate()}
          disabled={predictMutation.isPending}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
        >
          {predictMutation.isPending ? (
            <>
              <Zap className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Predict Errors & Noise
            </>
          )}
        </Button>

        {/* Results */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            <Card className="border bg-white">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Overall Assessment</p>
                    <p className="text-sm text-gray-600 mt-1">{analysis.error_summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 mb-1">Fidelity Estimate</p>
                    <div className="text-2xl font-bold text-green-600">
                      {(analysis.overall_fidelity_estimate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Fidelity Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.overall_fidelity_estimate * 100}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-green-500 to-green-600"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Error Sources */}
            {analysis.error_sources.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-gray-900">Error Sources</p>
                {analysis.error_sources.map((error, idx) => {
                  const Icon = getSeverityIcon(error.severity);
                  return (
                    <Card key={idx} className={`border-2 ${getSeverityColor(error.severity)}`}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{error.source}</p>
                            <p className="text-xs text-gray-700 mt-0.5">{error.location}</p>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs">
                            {(error.estimated_probability * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Mitigation:</span> {error.mitigation}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Critical Issues */}
            {analysis.critical_issues.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 space-y-2">
                <p className="font-medium text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Critical Issues
                </p>
                <ul className="space-y-1 text-sm text-red-800">
                  {analysis.critical_issues.map((issue, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span>•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 space-y-2">
                <p className="font-medium text-green-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Recommendations
                </p>
                <ul className="space-y-1 text-sm text-green-800">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span>✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}