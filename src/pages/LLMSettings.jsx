// @ts-nocheck
/**
 * LLM Settings Page
 * Configure AI model API keys and preferences
 */

import React, { useState, useEffect } from 'react';
import { useLLM, AI_MODELS } from '@/contexts/LLMContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  Settings, 
  Shield, 
  Save, 
  Eye, 
  EyeOff,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import AIUsagePanel from '@/components/ai/AIUsagePanel';
import ModelSelector from '@/components/ai/ModelSelector';

export default function LLMSettings() {
  const { 
    settings, 
    updateSettings, 
    availableModels, 
    checkAvailableModels,
    resetUsage 
  } = useLLM();
  
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
    grok: '',
  });
  
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
    grok: false,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [testingModel, setTestingModel] = useState(null);

  // Load saved API keys from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('llm_api_keys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setApiKeys(parsed);
      } catch (e) {
        console.error('Failed to load API keys:', e);
      }
    }
  }, []);

  const handleSaveKeys = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (in a real app, you'd want to securely store these)
      localStorage.setItem('llm_api_keys', JSON.stringify(apiKeys));
      
      // Re-check available models
      await checkAvailableModels();
      
      toast.success('API keys saved successfully');
    } catch (error) {
      toast.error('Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  const testApiKey = async (provider) => {
    setTestingModel(provider);
    try {
      const response = await fetch('/functions/aiModelRouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query',
          prompt: 'Say "Hello" in one word.',
          model: provider,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`${provider} API key is working!`);
        } else {
          toast.error(`${provider} API key test failed: ${data.error}`);
        }
      } else {
        toast.error(`Failed to test ${provider} API key`);
      }
    } catch (error) {
      toast.error(`Error testing ${provider}: ${error.message}`);
    } finally {
      setTestingModel(null);
    }
  };

  const modelProviders = [
    {
      id: 'openai',
      name: 'OpenAI',
      model: AI_MODELS.CHATGPT,
      placeholder: 'sk-proj-xxxx...',
      docsUrl: 'https://platform.openai.com/api-keys',
      icon: '🤖',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      model: AI_MODELS.CLAUDE,
      placeholder: 'sk-ant-xxxx...',
      docsUrl: 'https://console.anthropic.com/settings/keys',
      icon: '🧠',
    },
    {
      id: 'gemini',
      name: 'Google AI',
      model: AI_MODELS.GEMINI,
      placeholder: 'AIzaSy-xxxx...',
      docsUrl: 'https://aistudio.google.com/app/apikey',
      icon: '✨',
    },
    {
      id: 'grok',
      name: 'xAI (Grok)',
      model: AI_MODELS.GROK,
      placeholder: 'xai-xxxx...',
      docsUrl: 'https://console.x.ai/',
      icon: '⚡',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            LLM Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure AI models and API keys for enhanced capabilities
          </p>
        </div>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card className="dark:bg-gray-900/50 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Settings className="h-5 w-5" />
                Model Selection
              </CardTitle>
              <CardDescription>
                Choose your default AI model and configure routing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ModelSelector showInfo />
              
              <div className="grid gap-4 pt-4 border-t dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base dark:text-white">Auto-Route</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically select the best model based on your prompt
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoRoute}
                    onCheckedChange={(checked) => updateSettings({ autoRoute: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base dark:text-white">Fallback to Base44</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use Base44 LLM if the selected model fails
                    </p>
                  </div>
                  <Switch
                    checked={settings.fallbackEnabled}
                    onCheckedChange={(checked) => updateSettings({ fallbackEnabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base dark:text-white">Save Query History</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Track usage statistics and response times
                    </p>
                  </div>
                  <Switch
                    checked={settings.saveHistory}
                    onCheckedChange={(checked) => updateSettings({ saveHistory: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Models Overview */}
          <Card className="dark:bg-gray-900/50 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between dark:text-white">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Available Models
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkAvailableModels}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {Object.values(AI_MODELS).map((model) => {
                  const isAvailable = availableModels.includes(model.id);
                  return (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border",
                        isAvailable 
                          ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" 
                          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{model.icon}</span>
                        <div>
                          <h4 className="font-medium dark:text-white">{model.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{model.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {model.costPer1k > 0 && (
                          <Badge variant="outline" className="text-xs">
                            ${model.costPer1k.toFixed(3)}/1K
                          </Badge>
                        )}
                        {isAvailable ? (
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Configured
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <Card className="dark:bg-gray-900/50 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Key className="h-5 w-5" />
                API Key Configuration
              </CardTitle>
              <CardDescription>
                Add your API keys to enable different AI models. Keys are stored locally in your browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {modelProviders.map((provider) => (
                <div key={provider.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-base dark:text-white">
                      <span className="text-xl">{provider.icon}</span>
                      {provider.name}
                    </Label>
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                    >
                      Get API Key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys[provider.id] ? 'text' : 'password'}
                        value={apiKeys[provider.id]}
                        onChange={(e) => setApiKeys({ ...apiKeys, [provider.id]: e.target.value })}
                        placeholder={provider.placeholder}
                        className="pr-10 dark:bg-gray-800 dark:border-gray-600"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowKeys({ ...showKeys, [provider.id]: !showKeys[provider.id] })}
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      >
                        {showKeys[provider.id] ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => testApiKey(provider.id)}
                      disabled={!apiKeys[provider.id] || testingModel === provider.id}
                    >
                      {testingModel === provider.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Test'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {provider.model.description}
                  </p>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between w-full">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Keys are stored locally in your browser and never sent to our servers
                </p>
                <Button onClick={handleSaveKeys} disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Keys
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <AIUsagePanel showHistory />
          
          <Card className="dark:bg-gray-900/50 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Reset Usage Data</CardTitle>
              <CardDescription>
                Clear all usage statistics and history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={() => {
                  resetUsage();
                  toast.success('Usage data reset');
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset All Usage Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
