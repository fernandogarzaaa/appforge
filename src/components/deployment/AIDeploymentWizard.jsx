import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Sparkles, Loader2, CheckCircle, ArrowRight, ArrowLeft, 
  Server, Settings, Rocket, Shield
} from 'lucide-react';
import { toast } from 'sonner';

export default function AIDeploymentWizard({ projectId, projectType = 'web-app', onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [config, setConfig] = useState({
    infrastructure: 'vercel',
    region: 'auto',
    envVars: [],
    scaling: 'auto',
    monitoring: true,
    cdn: true,
    ssl: true
  });

  useEffect(() => {
    fetchAISuggestions();
  }, [projectType, currentStep]);

  const fetchAISuggestions = async () => {
    setLoading(true);
    try {
      const prompt = `You are a deployment expert for ${projectType} applications.

Project Type: ${projectType}
Current Step: ${steps[currentStep]?.title}

Provide deployment recommendations:
1. Best infrastructure provider (Vercel, Netlify, AWS, Railway, etc.)
2. Optimal server regions
3. Required environment variables with descriptions
4. Scaling strategy
5. Security best practices

Return JSON with:
{
  "infrastructure": "provider name",
  "region": "recommended region",
  "envVars": [{"key": "VAR_NAME", "description": "what it's for", "required": true}],
  "scalingStrategy": "description",
  "securityTips": ["tip 1", "tip 2"],
  "reasoning": "why these choices"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            infrastructure: { type: "string" },
            region: { type: "string" },
            envVars: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  description: { type: "string" },
                  required: { type: "boolean" }
                }
              }
            },
            scalingStrategy: { type: "string" },
            securityTips: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" }
          }
        }
      });

      setAiSuggestions(response);
      setConfig(prev => ({
        ...prev,
        infrastructure: response.infrastructure?.toLowerCase() || prev.infrastructure,
        region: response.region || prev.region,
        envVars: response.envVars || []
      }));
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Infrastructure Selection',
      description: 'Choose your deployment platform',
      icon: Server,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900 mb-1">AI Recommendation</p>
                <p className="text-sm text-purple-700">{aiSuggestions?.reasoning}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Infrastructure Provider</label>
            <select
              value={config.infrastructure}
              onChange={(e) => setConfig({...config, infrastructure: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="vercel">Vercel (Recommended)</option>
              <option value="netlify">Netlify</option>
              <option value="railway">Railway</option>
              <option value="aws">AWS</option>
              <option value="digitalocean">DigitalOcean</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Server Region</label>
            <select
              value={config.region}
              onChange={(e) => setConfig({...config, region: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="auto">Auto (AI Optimized)</option>
              <option value="us-east">US East</option>
              <option value="us-west">US West</option>
              <option value="eu-west">Europe West</option>
              <option value="asia-pacific">Asia Pacific</option>
            </select>
          </div>
        </div>
      )
    },
    {
      title: 'Environment Variables',
      description: 'Configure your application secrets',
      icon: Settings,
      content: (
        <div className="space-y-4">
          {aiSuggestions?.envVars?.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-Suggested Variables
              </p>
              <div className="space-y-2">
                {aiSuggestions.envVars.map((envVar, idx) => (
                  <div key={idx} className="p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-sm font-mono text-blue-700">{envVar.key}</code>
                      {envVar.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{envVar.description}</p>
                    <Input
                      placeholder={`Enter ${envVar.key}`}
                      className="mt-2"
                      type={envVar.key.toLowerCase().includes('secret') ? 'password' : 'text'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => {
            setConfig({
              ...config,
              envVars: [...config.envVars, { key: '', value: '', description: '' }]
            });
          }}>
            + Add Custom Variable
          </Button>
        </div>
      )
    },
    {
      title: 'Optimization & Security',
      description: 'Configure performance and security',
      icon: Shield,
      content: (
        <div className="space-y-4">
          {aiSuggestions?.securityTips && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security Best Practices
              </p>
              <ul className="space-y-1">
                {aiSuggestions.securityTips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Auto Scaling</p>
                <p className="text-xs text-gray-600">Scale based on traffic</p>
              </div>
              <Switch checked={config.scaling === 'auto'} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">CDN Enabled</p>
                <p className="text-xs text-gray-600">Global content delivery</p>
              </div>
              <Switch checked={config.cdn} onCheckedChange={(val) => setConfig({...config, cdn: val})} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">SSL Certificate</p>
                <p className="text-xs text-gray-600">HTTPS encryption</p>
              </div>
              <Switch checked={config.ssl} onCheckedChange={(val) => setConfig({...config, ssl: val})} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Monitoring & Analytics</p>
                <p className="text-xs text-gray-600">Track performance</p>
              </div>
              <Switch checked={config.monitoring} onCheckedChange={(val) => setConfig({...config, monitoring: val})} />
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Review & Deploy',
      description: 'Confirm your deployment configuration',
      icon: Rocket,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
            <p className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Deployment Summary
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Infrastructure:</span>
                <span className="font-medium">{config.infrastructure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Region:</span>
                <span className="font-medium">{config.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment Variables:</span>
                <span className="font-medium">{config.envVars.length} configured</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CDN:</span>
                <span className="font-medium">{config.cdn ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SSL:</span>
                <span className="font-medium">{config.ssl ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> Deployment typically takes 2-5 minutes. You'll receive a notification when complete.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeploy = async () => {
    setLoading(true);
    try {
      await base44.entities.AgentDeployment.create({
        project_id: projectId,
        infrastructure_provider: config.infrastructure,
        deployment_region: config.region,
        configuration: config,
        status: 'deploying'
      });

      toast.success('Deployment initiated successfully!');
      if (onComplete) onComplete();
    } catch (error) {
      toast.error('Deployment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <Card className="max-w-4xl mx-auto border-2 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <StepIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentStepData.title}
                {loading && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
              </CardTitle>
              <p className="text-sm text-gray-600">{currentStepData.description}</p>
            </div>
          </div>
          <Badge className="bg-purple-600">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step Content */}
        <div className="min-h-[300px]">
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="bg-purple-600">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleDeploy} 
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Now
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}