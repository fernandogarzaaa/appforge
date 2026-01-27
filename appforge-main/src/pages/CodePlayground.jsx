import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Play, Bug, Code2, AlertCircle, CheckCircle2, 
  Loader2, Terminal, Wand2, Lightbulb, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CodePlayground() {
  const [code, setCode] = useState(`// Welcome to AI-powered Code Playground
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`);
  
  const [output, setOutput] = useState([]);
  const [errors, setErrors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [debugInfo, setDebugInfo] = useState(null);

  // Auto-analyze code for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.length > 20) {
        analyzeCode();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [code]);

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this JavaScript code and provide 2-3 quick improvement suggestions:

\`\`\`javascript
${code}
\`\`\`

Return ONLY a JSON array of suggestion objects with format:
[{"type": "performance|style|bug|security", "message": "short suggestion", "line": null}]`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  message: { type: "string" },
                  line: { type: "number" }
                }
              }
            }
          }
        }
      });
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
    setIsAnalyzing(false);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput([]);
    setErrors([]);
    
    // Capture console.log
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    try {
      // Run the code
      const result = eval(code);
      
      if (logs.length > 0) {
        setOutput(logs);
      } else if (result !== undefined) {
        setOutput([String(result)]);
      } else {
        setOutput(['Code executed successfully']);
      }
      
      toast.success('Code executed successfully');
    } catch (error) {
      setErrors([{
        message: error.message,
        stack: error.stack,
        line: error.lineNumber || 'Unknown'
      }]);
      setActiveTab('errors');
      toast.error('Execution error');
    } finally {
      console.log = originalLog;
      setIsRunning(false);
    }
  };

  const autoDebug = async () => {
    if (errors.length === 0) {
      toast.info('No errors to debug');
      return;
    }

    setIsDebugging(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Debug this JavaScript code that has an error:

\`\`\`javascript
${code}
\`\`\`

Error: ${errors[0].message}

Provide:
1. What's wrong (brief explanation)
2. Fixed code (complete corrected version)
3. Prevention tip (how to avoid this)

Return as JSON:
{"explanation": "...", "fixed_code": "...", "tip": "..."}`,
        response_json_schema: {
          type: "object",
          properties: {
            explanation: { type: "string" },
            fixed_code: { type: "string" },
            tip: { type: "string" }
          }
        }
      });

      setDebugInfo(response);
      setActiveTab('debug');
      toast.success('Debug analysis complete');
    } catch (error) {
      toast.error('Debug failed');
    }
    setIsDebugging(false);
  };

  const applySuggestion = async (suggestion) => {
    setIsAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Apply this improvement to the code:

Current code:
\`\`\`javascript
${code}
\`\`\`

Improvement: ${suggestion.message}

Return ONLY the improved code, no explanations.`
      });

      setCode(typeof response === 'string' ? response.trim().replace(/^```javascript\n?/, '').replace(/\n?```$/, '') : code);
      toast.success('Suggestion applied');
    } catch (error) {
      toast.error('Failed to apply suggestion');
    }
    setIsAnalyzing(false);
  };

  const applyFix = () => {
    if (debugInfo?.fixed_code) {
      setCode(debugInfo.fixed_code);
      setErrors([]);
      setDebugInfo(null);
      toast.success('Fix applied');
    }
  };

  const enhanceWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Enhance this code with better practices, error handling, and documentation:

\`\`\`javascript
${code}
\`\`\`

Return the enhanced version with JSDoc comments. Keep the same functionality.`
      });

      setCode(response.trim().replace(/^```javascript\n?/, '').replace(/\n?```$/, ''));
      toast.success('Code enhanced');
    } catch (error) {
      toast.error('Enhancement failed');
    }
    setIsAnalyzing(false);
  };

  const typeColors = {
    performance: 'bg-blue-100 text-blue-700',
    style: 'bg-purple-100 text-purple-700',
    bug: 'bg-red-100 text-red-700',
    security: 'bg-orange-100 text-orange-700'
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#fafbfc]">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Code Playground</h1>
              <p className="text-[11px] text-gray-500">AI-powered live coding with suggestions & debugging</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[11px]">Analyzing...</span>
              </div>
            )}
            <Button
              onClick={enhanceWithAI}
              disabled={isAnalyzing}
              variant="outline"
              className="h-8 text-[13px] rounded-lg"
            >
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />
              Enhance
            </Button>
            <Button
              onClick={autoDebug}
              disabled={isDebugging || errors.length === 0}
              variant="outline"
              className="h-8 text-[13px] rounded-lg"
            >
              <Bug className="w-3.5 h-3.5 mr-1.5" />
              Debug
            </Button>
            <Button
              onClick={runCode}
              disabled={isRunning}
              className="h-8 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-[13px]"
            >
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1.5" />
              )}
              Run
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full font-mono text-[13px] bg-white border border-gray-200 rounded-lg resize-none focus:ring-1 focus:ring-gray-900"
              placeholder="Write your JavaScript code here..."
              spellCheck={false}
            />
          </div>

          {/* Suggestions Bar */}
          {suggestions.length > 0 && (
            <div className="px-4 pb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-[12px] font-medium text-gray-700">AI Suggestions</span>
                </div>
                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Badge className={cn("text-[10px]", typeColors[suggestion.type])}>
                        {suggestion.type}
                      </Badge>
                      <span className="text-[12px] text-gray-600 flex-1">{suggestion.message}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => applySuggestion(suggestion)}
                        className="h-6 text-[11px] rounded-md"
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10 px-2">
              <TabsTrigger value="output" className="text-[12px] data-[state=active]:bg-gray-100 rounded-md">
                <Terminal className="w-3 h-3 mr-1.5" />
                Output
                {output.length > 0 && (
                  <Badge className="ml-1.5 bg-green-500 text-white text-[10px] h-4 px-1">
                    {output.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="errors" className="text-[12px] data-[state=active]:bg-gray-100 rounded-md">
                <AlertCircle className="w-3 h-3 mr-1.5" />
                Errors
                {errors.length > 0 && (
                  <Badge className="ml-1.5 bg-red-500 text-white text-[10px] h-4 px-1">
                    {errors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="debug" className="text-[12px] data-[state=active]:bg-gray-100 rounded-md">
                <Bug className="w-3 h-3 mr-1.5" />
                Debug
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="output" className="p-4 m-0">
                {output.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Terminal className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[12px]">Run code to see output</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {output.map((line, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gray-50 rounded-lg p-2 font-mono text-[12px] text-gray-900"
                      >
                        {line}
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="errors" className="p-4 m-0">
                {errors.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[12px]">No errors detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errors.map((error, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[12px] font-medium text-red-900">{error.message}</p>
                            {error.line !== 'Unknown' && (
                              <p className="text-[11px] text-red-600 mt-1">Line {error.line}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={autoDebug}
                          disabled={isDebugging}
                          className="h-7 text-[11px] bg-red-600 hover:bg-red-700 text-white rounded-md"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Auto Debug
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="debug" className="p-4 m-0">
                {!debugInfo ? (
                  <div className="text-center py-8 text-gray-400">
                    <Bug className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[12px]">Run auto-debug to see analysis</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h3 className="text-[12px] font-medium text-blue-900 mb-2">What's Wrong</h3>
                      <p className="text-[12px] text-blue-700">{debugInfo.explanation}</p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h3 className="text-[12px] font-medium text-green-900 mb-2">Fixed Code</h3>
                      <pre className="bg-white rounded p-2 text-[11px] overflow-x-auto border border-green-200">
                        {debugInfo.fixed_code}
                      </pre>
                      <Button
                        onClick={applyFix}
                        className="mt-2 h-7 text-[11px] bg-green-600 hover:bg-green-700 text-white rounded-md"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Apply Fix
                      </Button>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <h3 className="text-[12px] font-medium text-purple-900 mb-2">💡 Prevention Tip</h3>
                      <p className="text-[12px] text-purple-700">{debugInfo.tip}</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  );
}