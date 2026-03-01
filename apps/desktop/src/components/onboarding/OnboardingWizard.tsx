import { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { InstallPathStep } from './InstallPathStep';
import { ServiceConfigStep } from './ServiceConfigStep';
import { ApiConfigStep } from './ApiConfigStep';
import { FinalStep } from './FinalStep';
import { Progress } from '@/components/ui/progress';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export type WizardStep = 'welcome' | 'install-path' | 'services' | 'api-keys' | 'final';

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [isProcessing, setIsProcessing] = useState(false);

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'install-path', label: 'Installation' },
    { id: 'services', label: 'Services' },
    { id: 'api-keys', label: 'API Keys' },
    { id: 'final', label: 'Complete' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextSteps: Record<WizardStep, WizardStep | null> = {
      welcome: 'install-path',
      'install-path': 'services',
      services: 'api-keys',
      'api-keys': 'final',
      final: null,
    };

    const next = nextSteps[currentStep];
    if (next) {
      setCurrentStep(next);
    }
  };

  const handleBack = () => {
    const prevSteps: Record<WizardStep, WizardStep | null> = {
      welcome: null,
      'install-path': 'welcome',
      services: 'install-path',
      'api-keys': 'services',
      final: 'api-keys',
    };

    const prev = prevSteps[currentStep];
    if (prev) {
      setCurrentStep(prev);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            {steps.map((step, index) => (
              <span
                key={step.id}
                className={`${
                  index <= currentStepIndex ? 'text-blue-400' : ''
                } ${index === currentStepIndex ? 'font-semibold' : ''}`}
              >
                {step.label}
              </span>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step content */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          {currentStep === 'welcome' && <WelcomeStep onNext={handleNext} />}
          {currentStep === 'install-path' && (
            <InstallPathStep onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 'services' && (
            <ServiceConfigStep onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 'api-keys' && (
            <ApiConfigStep onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 'final' && (
            <FinalStep
              onComplete={handleComplete}
              onBack={handleBack}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStepIndex
                  ? 'bg-blue-500 w-6'
                  : index < currentStepIndex
                  ? 'bg-blue-500/50'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
