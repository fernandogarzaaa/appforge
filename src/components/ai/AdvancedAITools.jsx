import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, TestTube, Zap, MessageSquare, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedAITools() {
  const [activeTab, setActiveTab] = useState('refactor');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Refactoring state
  const [refactorCode, setRefactorCode] = useState('');
  const [refactorLanguage, setRefactorLanguage] = useState('javascript');
  const [refactorFocus, setRefactorFocus] = useState(['readability', 'performance']);

  // Test generation state
  const [testCode, setTestCode] = useState('');
  const [testFramework, setTestFramework] = useState('jest');
  const [testLanguage, setTestLanguage] = useState('javascript');
  const [testFunctionName, setTestFunctionName] = useState('');

  // Performance analysis state
  const [perfCode, setPerfCode] = useState('');
  const [usagePatterns, setUsagePatterns] = useState('');

  // Sentiment analysis state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackContext, setFeedbackContext] = useState('');

  const handleCodeRefactor = async () => {
    if (!refactorCode.trim()) {
      toast.error('Please enter code to refactor');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('aiCodeRefactoring', {
        code: refactorCode,
        language: refactorLanguage,
        focusAreas: refactorFocus
      });

      setResults({ type: 'refactor', data: data.refactoring });
      toast.success('Code refactoring completed');
    } catch (error) {
      toast.error('Failed to refactor code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestGeneration = async () => {
    if (!testCode.trim()) {
      toast.error('Please enter code for testing');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('aiTestGeneration', {
        code: testCode,
        language: testLanguage,
        testFramework,
        functionName: testFunctionName || undefined
      });

      setResults({ type: 'tests', data: data.tests });
      toast.success('Test cases generated');
    } catch (error) {
      toast.error('Failed to generate tests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePerformanceAnalysis = async () => {
    if (!perfCode.trim()) {
      toast.error('Please enter code to analyze');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('aiPerformanceAnalysis', {
        code: perfCode,
        usagePatterns: usagePatterns ? JSON.parse(usagePatterns) : {},
        constraints: {}
      });

      setResults({ type: 'performance', data: data.analysis });
      toast.success('Performance analysis completed');
    } catch (error) {
      toast.error('Failed to analyze performance');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSentimentAnalysis = async () => {
    if (!feedbackText.trim()) {
      toast.error('Please enter feedback to analyze');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('aiSentimentAnalysis', {
        feedback: feedbackText,
        context: feedbackContext || undefined
      });

      setResults({ type: 'sentiment', data: data.analysis });
      toast.success('Sentiment analysis completed');
    } catch (error) {
      toast.error('Failed to analyze sentiment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="refactor" className="flex gap-2">
            <Code className="h-4 w-4" /> Refactor
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex gap-2">
            <TestTube className="h-4 w-4" /> Tests
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex gap-2">
            <Zap className="h-4 w-4" /> Performance
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex gap-2">
            <MessageSquare className="h-4 w-4" /> Sentiment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="refactor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Code Refactoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Input
                  value={refactorLanguage}
                  onChange={(e) => setRefactorLanguage(e.target.value)}
                  placeholder="javascript, python, etc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Focus Areas</label>
                <div className="flex flex-wrap gap-2">
                  {['readability', 'performance', 'maintainability', 'security'].map((area) => (
                    <Badge
                      key={area}
                      variant={refactorFocus.includes(area) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setRefactorFocus(
                          refactorFocus.includes(area)
                            ? refactorFocus.filter((a) => a !== area)
                            : [...refactorFocus, area]
                        );
                      }}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Code to Refactor</label>
                <Textarea
                  value={refactorCode}
                  onChange={(e) => setRefactorCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="font-mono h-48"
                />
              </div>

              <Button onClick={handleCodeRefactor} disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Refactor Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Test Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Input
                    value={testLanguage}
                    onChange={(e) => setTestLanguage(e.target.value)}
                    placeholder="javascript"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Framework</label>
                  <Input
                    value={testFramework}
                    onChange={(e) => setTestFramework(e.target.value)}
                    placeholder="jest"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Function Name (Optional)</label>
                <Input
                  value={testFunctionName}
                  onChange={(e) => setTestFunctionName(e.target.value)}
                  placeholder="Leave empty to test entire code"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Code to Test</label>
                <Textarea
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="font-mono h-48"
                />
              </div>

              <Button onClick={handleTestGeneration} disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Tests
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Textarea
                  value={perfCode}
                  onChange={(e) => setPerfCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="font-mono h-32"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Usage Patterns (JSON)</label>
                <Textarea
                  value={usagePatterns}
                  onChange={(e) => setUsagePatterns(e.target.value)}
                  placeholder='{"averageRequestSize": "100KB", "concurrency": 100}'
                  className="font-mono h-20"
                />
              </div>

              <Button onClick={handlePerformanceAnalysis} disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Analyze Performance
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback Text</label>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Paste user feedback here..."
                  className="h-32"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Context (Optional)</label>
                <Input
                  value={feedbackContext}
                  onChange={(e) => setFeedbackContext(e.target.value)}
                  placeholder="e.g., Feature: Payment Integration"
                />
              </div>

              <Button onClick={handleSentimentAnalysis} disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Analyze Sentiment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {results.type === 'refactor' && 'Refactoring Results'}
                {results.type === 'tests' && 'Generated Tests'}
                {results.type === 'performance' && 'Performance Analysis'}
                {results.type === 'sentiment' && 'Sentiment Analysis'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(JSON.stringify(results.data, null, 2))}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}