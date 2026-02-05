import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ArrowRight, Check, Loader2, MessageSquare, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function GuidedProjectWizard() {
  const [step, setStep] = useState('initial'); // initial, clarifying, confirming, generating, done
  const [userInput, setUserInput] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState(null);
  const [clarifyingQuestions, setClarifyingQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantumEnabled, setQuantumEnabled] = useState(true);
  const navigate = useNavigate();

  // Check if quantum is enabled
  useEffect(() => {
    const checkQuantum = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const prefs = await base44.entities.UserPreference.filter({ user_id: user.email });
          if (prefs.length > 0) {
            setQuantumEnabled(prefs[0].use_quantum_ai ?? true);
          }
        }
      } catch (err) {
        console.log('Could not check quantum preference');
      }
    };
    checkQuantum();
  }, []);

  // Step 1: Initial vague idea → AI generates enhanced prompt
  const generatePrompt = async () => {
    if (!userInput.trim()) {
      toast.error('Tell me a bit about your idea first');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('invokeAI', {
        prompt: `User said: "${userInput}"

Generate a comprehensive, detailed project description based on this initial idea. Then, ask 3 essential clarifying questions to refine the vision.

Return:
1. enhanced_description: A detailed version of their idea (2-3 sentences)
2. questions: Array of 3 specific questions to clarify scope, features, and target users`,
        response_json_schema: {
          type: "object",
          properties: {
            enhanced_description: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  suggestions: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      const data = result.data.result;
      setGeneratedPrompt(data.enhanced_description);
      setClarifyingQuestions(data.questions);
      setStep('clarifying');
    } catch (error) {
      toast.error('Failed to analyze your idea');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: User answers questions → Generate final spec
  const confirmAndGenerate = async () => {
    setLoading(true);
    try {
      // Generate project with all context
      const finalDescription = `${generatedPrompt}

Additional details:
${clarifyingQuestions.map((q, i) => `${q.question} ${answers[i] || 'Not specified'}`).join('\n')}`;

      const result = await base44.functions.invoke('generateProjectFromDescription', {
        description: finalDescription,
        project_name: userInput.slice(0, 50) || 'My Project'
      });

      setProjectData(result.data);
      setStep('done');
      toast.success('Project created! Let me guide you through the setup.');
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // Initial input stage
  if (step === 'initial') {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Sparkles className="w-6 h-6 text-purple-600" />
            What would you like to build?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Just type anything... e.g., 'a fitness app' or 'help me track expenses'"
            className="min-h-[100px] text-base border-purple-200 focus:border-purple-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) generatePrompt();
            }}
          />
          <div className="flex items-center gap-2 text-xs text-purple-700">
            <Badge variant="outline" className="text-purple-700 border-purple-300">💡 Pro Tip</Badge>
            <span>Be as vague or specific as you want - I'll help clarify</span>
            {quantumEnabled && (
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 text-xs">
                🔮 Quantum
              </Badge>
            )}
          </div>
          <Button
            onClick={generatePrompt}
            disabled={loading || !userInput.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing your idea...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Help me build this
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Clarifying questions stage
  if (step === 'clarifying') {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Let me understand your vision better
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced description */}
          <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Here's what I understood:</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep('initial');
                  setGeneratedPrompt(null);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-700 leading-relaxed">{generatedPrompt}</p>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">A few quick questions:</h3>
            {clarifyingQuestions.map((q, idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{q.question}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {q.suggestions?.map((suggestion, sIdx) => (
                    <Badge
                      key={sIdx}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-100 hover:border-blue-400"
                      onClick={() => setAnswers({...answers, [idx]: suggestion})}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
                <Input
                  value={answers[idx] || ''}
                  onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
                  placeholder="Your answer..."
                  className="border-blue-200"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={confirmAndGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating your project...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Build it!
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Project created - guide to next steps
  if (step === 'done' && projectData) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Check className="w-6 h-6 text-green-600" />
            Project Created! Here's your guided path:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{projectData.project.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{projectData.project.description}</p>
            <div className="flex gap-2 text-xs">
              <Badge>{projectData.entities?.length || 0} Entities</Badge>
              <Badge>{projectData.pages?.length || 0} Pages</Badge>
              <Badge variant="outline">Ready to customize</Badge>
            </div>
          </div>

          {/* Guided steps */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Review & Refine Data Models</h4>
                <p className="text-xs text-gray-600">Check your entities and adjust fields</p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`${createPageUrl('EntityDesigner')}?projectId=${projectData.project.id}`)}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Design Your Interface</h4>
                <p className="text-xs text-gray-600">Build pages with AI assistance</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`${createPageUrl('PageEditor')}?projectId=${projectData.project.id}`)}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Deploy Your App</h4>
                <p className="text-xs text-gray-600">Go live in minutes</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`${createPageUrl('Deployments')}?projectId=${projectData.project.id}`)}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={() => {
              setStep('initial');
              setUserInput('');
              setProjectData(null);
              setAnswers({});
            }}
            variant="outline"
            className="w-full"
          >
            Build another project
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}