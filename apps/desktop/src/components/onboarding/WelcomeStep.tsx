import { Button } from '@/components/ui/button';
import { Zap, Brain, Cpu, Shield } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: Brain,
      title: 'Quantum Engine',
      description: 'Superposition processing for intelligent code generation',
    },
    {
      icon: Cpu,
      title: 'Swarm Intelligence',
      description: 'Autonomous agents working 24/7 on your projects',
    },
    {
      icon: Shield,
      title: 'Self-Healing',
      description: 'Automatic bug detection and repair',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with quantum-inspired algorithms',
    },
  ];

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Zap className="w-12 h-12 text-white" />
        </div>
      </div>

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
        Welcome to AppForge
      </h1>

      <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
        The self-evolving development platform powered by quantum-inspired AI and swarm intelligence.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/30 transition-colors"
          >
            <feature.icon className="w-6 h-6 text-blue-400 mb-2" />
            <h3 className="font-semibold text-slate-200 text-sm">{feature.title}</h3>
            <p className="text-slate-500 text-xs mt-1">{feature.description}</p>
          </div>
        ))}
      </div>

      <Button
        onClick={onNext}
        size="lg"
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
      >
        Get Started
      </Button>
    </div>
  );
}
