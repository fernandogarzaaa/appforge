import { Button } from '@/components/ui/button';
import { CheckCircle, Rocket, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface FinalStepProps {
  onComplete: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export function FinalStep({ onComplete, onBack, isProcessing }: FinalStepProps) {
  const { config } = useAppStore();
  const { services, installPath } = config;

  const selectedServices = Object.entries(services)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  return (
    <div className="text-center">
      {isProcessing ? (
        <div className="py-8">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Setting up AppForge...</h2>
          <p className="text-slate-400">Initializing services and configuring your environment</p>
        </div>
      ) : (
        <>
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Ready to Launch!</h2>
          <p className="text-slate-400 mb-6">
            AppForge is configured and ready to go. Here's what's set up:
          </p>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left mb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Installation Path</span>
                <span className="text-slate-300 text-sm font-mono">{installPath || 'Default'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Services Enabled</span>
                <span className="text-blue-400 text-sm">{selectedServices.length}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {services.backend && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    Backend
                  </span>
                )}
                {services.quantumCore && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                    Quantum Core
                  </span>
                )}
                {services.swarm && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                    Swarm
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-amber-400 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Your quantum-powered development environment awaits!</span>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 border-slate-700 hover:bg-slate-800"
            >
              Back
            </Button>
            <Button
              onClick={onComplete}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Launch AppForge
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
