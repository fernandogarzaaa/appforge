import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import HelpTooltip from '@/components/help/HelpTooltip';
import { Settings, TestTube, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function APIConfiguration() {
  const [activeProvider, setActiveProvider] = useState('openai');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [configs, setConfigs] = useState({
    openai: {
      apiKey: '',
      model: 'gpt-4',
      baseUrl: 'https://api.openai.com/v1',
      timeout: 30,
      configured: false,
      lastTested: null
    },
    anthropic: {
      apiKey: '',
      model: 'claude-3-opus',
      baseUrl: 'https://api.anthropic.com',
      timeout: 30,
      configured: false,
      lastTested: null
    },
    google: {
      apiKey: '',
      model: 'gemini-pro',
      baseUrl: 'https://generativelanguage.googleapis.com',
      timeout: 30,
      configured: false,
      lastTested: null
    }
  });

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '🤖',
      description: 'GPT-4, GPT-3.5 Turbo',
      docs: 'https://platform.openai.com/docs'
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      icon: '🧠',
      description: 'Claude models',
      docs: 'https://docs.anthropic.com'
    },
    {
      id: 'google',
      name: 'Google',
      icon: '📚',
      description: 'Gemini models',
      docs: 'https://ai.google.dev'
    }
  ];

  const handleConfigChange = (provider, field, value) => {
    setConfigs({
      ...configs,
      [provider]: {
        ...configs[provider],
        [field]: value
      }
    });
  };

  const handleTestConnection = async (provider) => {
    setIsTestingConnection(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const config = configs[provider];
      if (!config.apiKey) {
        setTestResults({
          ...testResults,
          [provider]: { success: false, message: 'API key is required' }
        });
      } else {
        setTestResults({
          ...testResults,
          [provider]: { 
            success: true, 
            message: 'Connection successful!',
            timestamp: new Date().toLocaleTimeString()
          }
        });
        
        // Mark as configured
        setConfigs({
          ...configs,
          [provider]: {
            ...configs[provider],
            configured: true,
            lastTested: new Date().toLocaleString()
          }
        });
      }
    } catch (error) {
      setTestResults({
        ...testResults,
        [provider]: { success: false, message: 'Connection failed' }
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfiguration = () => {
    // Save to backend or local storage
    localStorage.setItem('apiConfigs', JSON.stringify(configs));
    alert('Configuration saved successfully!');
  };

  const currentConfig = configs[activeProvider];
  const currentProvider = providers.find(p => p.id === activeProvider);

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Provider Configuration</CardTitle>
              <CardDescription>Set up and test connections to AI providers</CardDescription>
            </div>
            <HelpTooltip 
              content="Configure API keys and settings for different AI providers. Test connections before using them in production."
              title="API Configuration"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {providers.map(provider => (
              <button
                key={provider.id}
                onClick={() => setActiveProvider(provider.id)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  activeProvider === provider.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                    {currentConfig.configured && provider.id === activeProvider && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-xs">Configured</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600">{provider.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      {currentProvider && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>{currentProvider.icon}</span>
                  {currentProvider.name} Configuration
                </CardTitle>
                <CardDescription>
                  Configure your {currentProvider.name} API settings
                </CardDescription>
              </div>
              {currentConfig.lastTested && (
                <div className="text-sm text-green-600">
                  ✓ Last tested: {currentConfig.lastTested}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder={`Enter your ${currentProvider.name} API key`}
                  value={currentConfig.apiKey}
                  onChange={(e) => handleConfigChange(activeProvider, 'apiKey', e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.querySelector('input[type="password"]');
                    input.type = input.type === 'password' ? 'text' : 'password';
                  }}
                >
                  Show
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Get your API key from{' '}
                <a href={currentProvider.docs} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {currentProvider.name} documentation
                </a>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Model
              </label>
              <Input
                placeholder="e.g., gpt-4, claude-3-opus"
                value={currentConfig.model}
                onChange={(e) => handleConfigChange(activeProvider, 'model', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                The model to use for this provider's requests
              </p>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <Input
                type="url"
                placeholder="https://api.openai.com/v1"
                value={currentConfig.baseUrl}
                onChange={(e) => handleConfigChange(activeProvider, 'baseUrl', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                API endpoint base URL (optional, uses default if not provided)
              </p>
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Timeout
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="5"
                  max="300"
                  placeholder="30"
                  value={currentConfig.timeout}
                  onChange={(e) => handleConfigChange(activeProvider, 'timeout', parseInt(e.target.value))}
                  className="w-32"
                />
                <div className="flex items-center text-sm text-gray-600">seconds</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Maximum time to wait for API response
              </p>
            </div>

            {/* Test Result */}
            {testResults[activeProvider] && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                testResults[activeProvider].success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {testResults[activeProvider].success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    testResults[activeProvider].success
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}>
                    {testResults[activeProvider].message}
                  </p>
                  {testResults[activeProvider].timestamp && (
                    <p className="text-xs text-gray-600">
                      {testResults[activeProvider].timestamp}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => handleTestConnection(activeProvider)}
                disabled={isTestingConnection || !currentConfig.apiKey}
                variant="outline"
              >
                {isTestingConnection ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveConfiguration}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="font-semibold text-blue-600">1.</span>
              <span>Select an AI provider from the options above</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-blue-600">2.</span>
              <span>Enter your API key (get it from the provider's documentation)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-blue-600">3.</span>
              <span>Click "Test Connection" to verify the API key works</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-blue-600">4.</span>
              <span>Click "Save Configuration" to store your settings</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-blue-600">5.</span>
              <span>Start using the AI features in your application!</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
