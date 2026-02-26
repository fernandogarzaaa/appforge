import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Key, ExternalLink, SkipForward } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

interface ApiConfigStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ApiConfigStep({ onNext, onBack }: ApiConfigStepProps) {
  const { config, updateConfig } = useAppStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState({
    openai: config.apiKeys.openai || '',
    anthropic: config.apiKeys.anthropic || '',
    gemini: config.apiKeys.gemini || '',
  });

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5, and Codex models',
      url: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-...',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude models with long context',
      url: 'https://console.anthropic.com/settings/keys',
      placeholder: 'sk-ant-...',
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Gemini Pro and Ultra models',
      url: 'https://aistudio.google.com/app/apikey',
      placeholder: 'AIza...',
    },
  ];

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    updateConfig({ apiKeys });
    toast.success('API keys saved');
    onNext();
  };

  const handleSkip = () => {
    toast.info('You can add API keys later in settings');
    onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Configure API Keys</h2>
      <p className="text-slate-400 mb-6">
        Add your AI provider API keys to enable intelligent features. These are stored locally and never shared.
      </p>

      <div className="space-y-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                <span className="text-slate-200 font-semibold">{provider.name}</span>
              </div>
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Get key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-500 mb-2">{provider.description}</p>
            <div className="relative">
              <Input
                id={provider.id}
                type={showKeys[provider.id] ? 'text' : 'password'}
                value={apiKeys[provider.id as keyof typeof apiKeys]}
                onChange={(e) =>
                  setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                }
                placeholder={provider.placeholder}
                className="bg-slate-900 border-slate-700 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey(provider.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKeys[provider.id] ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-xs text-amber-400">
          <strong>Note:</strong> API keys are stored encrypted on your local machine. 
          You can skip this step and configure keys later in Settings.
        </p>
      </div>

      <div className="flex gap-3 mt-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 border-slate-700 hover:bg-slate-800"
        >
          Back
        </Button>
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-slate-400 hover:text-slate-300"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Skip
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
