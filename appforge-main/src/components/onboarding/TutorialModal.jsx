import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const TUTORIAL_STEPS = [
  {
    id: 0,
    title: 'Welcome to AI Monitoring',
    description: 'This tutorial will guide you through setting up monitoring rules, configuring alerts, and understanding key features.',
    content: 'Start your journey to proactive monitoring and AI-powered insights.',
    icon: '🎯',
    target: null
  },
  {
    id: 1,
    title: 'Setting Up Monitoring Rules',
    description: 'Learn how to create monitoring rules that track your data sources in real-time.',
    content: 'Go to AI Monitoring > Rules to create your first monitoring rule. You can monitor databases, APIs, email, or custom data sources.',
    icon: '📊',
    target: 'monitoring-rules'
  },
  {
    id: 2,
    title: 'Configuring Alert Channels',
    description: 'Set up how and where you receive alerts when anomalies are detected.',
    content: 'Navigate to Alert Configuration to choose your notification channels (Email, Webhook, In-App) and set severity thresholds.',
    icon: '🔔',
    target: 'alert-config'
  },
  {
    id: 3,
    title: 'Setting Alert Preferences',
    description: 'Customize your personal notification settings and quiet hours.',
    content: 'Go to your profile > Alert Preferences to set your timezone, preferred channels, quiet hours, and auto-assignment rules.',
    icon: '⚙️',
    target: 'alert-preferences'
  },
  {
    id: 4,
    title: 'Understanding AI Insights',
    description: 'Learn how AI automatically generates insights and predictions from your data.',
    content: 'The AI Monitoring dashboard shows insights, predictions, and anomalies. Each insight includes recommended actions.',
    icon: '🤖',
    target: 'insights'
  },
  {
    id: 5,
    title: 'Viewing Predictive Analytics',
    description: 'Understand trend forecasts and anomaly risk scores.',
    content: 'Visit Predictive Analytics to see ML-powered forecasts, confidence scores, and risk levels for your data.',
    icon: '📈',
    target: 'predictions'
  },
  {
    id: 6,
    title: 'Providing Feedback',
    description: 'Help improve AI accuracy by rating insights and providing corrective feedback.',
    content: 'Use the feedback widget on insights to rate accuracy and usefulness. Your feedback helps retrain the model.',
    icon: '👍',
    target: 'feedback'
  },
  {
    id: 7,
    title: 'You\'re All Set!',
    description: 'You\'ve completed the onboarding tutorial.',
    content: 'Explore the app, create your monitoring rules, and start leveraging AI-powered insights. Visit the knowledge base anytime for help.',
    icon: '🎉',
    target: null
  }
];

export default function TutorialModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
    loadProgress(userData.email);
  };

  const { data: progress } = useQuery({
    queryKey: ['onboarding-progress', user?.email],
    queryFn: () => base44.entities.OnboardingProgress.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const loadProgress = async (email) => {
    const progs = await base44.entities.OnboardingProgress.filter({ user_email: email });
    if (progs.length > 0) {
      setCurrentStep(progs[0].current_step);
    }
  };

  const updateProgressMutation = useMutation({
    mutationFn: async (newStep) => {
      const progs = await base44.entities.OnboardingProgress.filter({ user_email: user.email });
      const prog = progs[0];

      const completed = [...new Set([...(prog.completed_steps || []), newStep])];
      const isCompleted = newStep >= TUTORIAL_STEPS.length - 1;

      if (prog) {
        await base44.entities.OnboardingProgress.update(prog.id, {
          current_step: newStep,
          completed_steps: completed,
          status: isCompleted ? 'completed' : 'in_progress',
          completed_at: isCompleted ? new Date().toISOString() : null
        });
      } else {
        await base44.entities.OnboardingProgress.create({
          user_email: user.email,
          current_step: newStep,
          completed_steps: completed,
          status: isCompleted ? 'completed' : 'in_progress',
          started_at: new Date().toISOString(),
          completed_at: isCompleted ? new Date().toISOString() : null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    }
  });

  const handleNext = () => {
    updateProgressMutation.mutate(currentStep + 1);
    setCurrentStep(Math.min(currentStep + 1, TUTORIAL_STEPS.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const handleComplete = () => {
    updateProgressMutation.mutate(TUTORIAL_STEPS.length - 1);
    onClose();
    toast.success('Tutorial completed! You can revisit it anytime from the Help menu.');
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress_value = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{step?.title}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-4xl mb-4">{step?.icon}</div>
            <p className="text-slate-600">{step?.description}</p>
            <Card className="p-4 bg-slate-50 border">
              <p className="text-sm">{step?.content}</p>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
              {progress?.length > 0 && progress[0].completed_steps?.includes(currentStep) && (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </span>
              )}
            </div>
            <Progress value={progress_value} />
          </div>

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentStep === TUTORIAL_STEPS.length - 1 ? (
              <Button onClick={handleComplete} className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Complete Tutorial
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}