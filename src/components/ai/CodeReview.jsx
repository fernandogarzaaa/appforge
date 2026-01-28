import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Code, AlertCircle, CheckCircle, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

export default function CodeReview({ projectId }) {
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [review, setReview] = useState(null);

  const { data: _project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  const analyzeCode = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert code reviewer. Analyze the following code and provide:
1. Issues (bugs, errors, vulnerabilities)
2. Best practices violations
3. Performance improvements
4. Refactoring suggestions
5. Code quality score (1-10)

Code to review:
\`\`\`
${code}
\`\`\`

Provide your response in a structured format with clear sections.`,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  suggestion: { type: "string" }
                }
              }
            },
            improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  description: { type: "string" },
                  example: { type: "string" }
                }
              }
            },
            refactoring: { type: "string" }
          }
        }
      });

      setReview(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[13px] font-medium text-gray-900 mb-2">Code Review & Refactoring</h3>
        <p className="text-[11px] text-gray-500 mb-3">
          Paste your code below for AI-powered review and suggestions
        </p>
      </div>

      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="// Paste your code here for review..."
        className="font-mono text-[12px] min-h-[200px]"
      />

      <Button
        onClick={analyzeCode}
        disabled={!code.trim() || isAnalyzing}
        className="w-full h-9 bg-gray-900 hover:bg-gray-800 text-[13px]"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Code className="w-3.5 h-3.5 mr-2" />
            Review Code
          </>
        )}
      </Button>

      {review && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-medium text-gray-900">Code Quality Score</h4>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{review.score}</span>
                <span className="text-[11px] text-gray-500">/10</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${(review.score / 10) * 100}%` }}
              />
            </div>
          </Card>

          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="issues" className="flex-1 text-[12px]">
                Issues ({review.issues?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="improvements" className="flex-1 text-[12px]">
                Improvements
              </TabsTrigger>
              <TabsTrigger value="refactoring" className="flex-1 text-[12px]">
                Refactoring
              </TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="space-y-2 mt-3">
              {review.issues?.map((issue, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-[12px] font-medium text-gray-900">{issue.title}</h5>
                        <Badge className={severityColors[issue.severity.toLowerCase()] || severityColors.low}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-600 mb-2">{issue.description}</p>
                      {issue.suggestion && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <div className="flex items-start gap-1.5">
                            <Lightbulb className="w-3 h-3 text-green-600 mt-0.5" />
                            <p className="text-[11px] text-green-800">{issue.suggestion}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="improvements" className="space-y-2 mt-3">
              {review.improvements?.map((imp, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h5 className="text-[12px] font-medium text-gray-900 mb-1">{imp.category}</h5>
                      <p className="text-[11px] text-gray-600 mb-2">{imp.description}</p>
                      {imp.example && (
                        <pre className="bg-gray-50 rounded-lg p-2 text-[10px] font-mono overflow-x-auto">
                          {imp.example}
                        </pre>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="refactoring" className="mt-3">
              <Card className="p-3">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown className="text-[12px] text-gray-700">
                    {review.refactoring || 'No refactoring suggestions available.'}
                  </ReactMarkdown>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}