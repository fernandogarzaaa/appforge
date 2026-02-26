import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Server, Cpu, Users, Info } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ServiceConfigStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ServiceConfigStep({ onNext, onBack }: ServiceConfigStepProps) {
  const { config, updateConfig } = useAppStore();
  const { services } = config;

  const serviceOptions = [
    {
      id: 'backend' as const,
      name: 'Backend Services',
      description: 'Core API server and gateway for AppForge',
      icon: Server,
      port: '3000',
      memory: '~150MB',
    },
    {
      id: 'quantumCore' as const,
      name: 'Quantum Core',
      description: 'Quantum-inspired AI engine for intelligent processing',
      icon: Cpu,
      port: '8080',
      memory: '~300MB',
    },
    {
      id: 'swarm' as const,
      name: 'Swarm Agents',
      description: 'Autonomous agents that work on your codebase',
      icon: Users,
      port: '5000',
      memory: '~200MB',
    },
  ];

  const handleToggle = (serviceId: keyof typeof services) => {
    updateConfig({
      services: {
        ...services,
        [serviceId]: !services[serviceId],
      },
    });
  };

  const selectedCount = Object.values(services).filter(Boolean).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Configure Services</h2>
      <p className="text-slate-400 mb-6">
        Choose which services to enable. You can change these later in settings.
      </p>

      <div className="space-y-4">
        {serviceOptions.map((service) => (
          <div
            key={service.id}
            className={`p-4 rounded-xl border transition-all ${
              services[service.id]
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-slate-800/50 border-slate-700/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    services[service.id]
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <service.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-200">{service.name}</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Port: {service.port}</p>
                          <p>Memory: {service.memory}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                </div>
              </div>
              <Switch
                checked={services[service.id]}
                onCheckedChange={() => handleToggle(service.id)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Services selected:</span>
          <span className="text-blue-400 font-semibold">{selectedCount}/3</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-slate-400">Estimated memory usage:</span>
          <span className="text-slate-300">
            {services.backend && services.quantumCore && services.swarm
              ? '~650MB'
              : services.backend && services.quantumCore
              ? '~450MB'
              : services.backend && services.swarm
              ? '~350MB'
              : services.quantumCore && services.swarm
              ? '~500MB'
              : services.backend
              ? '~150MB'
              : services.quantumCore
              ? '~300MB'
              : services.swarm
              ? '~200MB'
              : '0MB'}
          </span>
        </div>
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
          onClick={onNext}
          disabled={selectedCount === 0}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
