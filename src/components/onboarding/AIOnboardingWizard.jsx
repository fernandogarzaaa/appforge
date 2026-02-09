import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, ArrowRight, Check, X, HelpCircle, 
  Clock, Target, BookOpen, Rocket 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIOnboardingWizard({ projectIdea, onComplete }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ['onboardingConfig'],
    queryFn: async () => {
      const configs = await base44.entities.OnboardingConfig.list();
      return configs[0] || { onboarding_enabled: true };
    }
  });

  const { data: progress, isLoading } = useQuery({
    queryKey: ['onboardingProgress', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const progs = await base44.entities.OnboardingProgress.filter({ 
        user_id: user.email,
        completed: false 
      });
      return progs[0] || null;
    },
    enabled: !!user
  });

  const generateOnboarding = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generatePersonalizedOnboarding', {
        user_role: user?.role || 'developer',
        project_idea: projectIdea,
        interaction_context: 'First project creation'
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
      setOpen(true);
    }
  });

  const updateProgress = useMutation({
    mutationFn: async ({ step, needHelp }) => {
      const response = await base44.functions.invoke('updateOnboardingProgress', {
        step_number: step,
        action_completed: steps[step]?.action,
        need_help: needHelp
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
      if (data.completed) {
        toast.success('🎉 Onboarding completed! You\'re ready to build!');
        setOpen(false);
        onComplete?.();
      } else {
        setCurrentStep(data.next_step);
        if (data.proactive_help) {
          toast.info(data.proactive_help.tip);
        }
      }
    }
  });

  useEffect(() => {
    if (!progress && user && config?.onboarding_enabled && !open) {
      // Auto-start onboarding for new users
      const hasSeenOnboarding = localStorage.getItem(`onboarding-${user.email}`);
      if (!hasSeenOnboarding) {
        generateOnboarding.mutate();
        localStorage.setItem(`onboarding-${user.email}`, 'started');
      }
    }
  }, [user, progress, config]);

  useEffect(() => {
    if (progress && !open) {
      setCurrentStep(progress.current_step);
      setOpen(true);
    }
  }, [progress]);

  if (!config?.onboarding_enabled || !progress) return null;

  const onboardingData = progress.personalized_content;
  const steps = onboardingData?.steps || [];
  const step = steps[currentStep];
  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    updateProgress.mutate({ step: currentStep, needHelp: false });
  };

  const handleNeedHelp = () => {
    setShowHelp(true);
    updateProgress.mutate({ step: currentStep, needHelp: true });
  };

  const handleNavigate = () => {
    if (step?.page) {
      navigate(createPageUrl(step.page));
      setOpen(false);
    }
  };

  const handleSkip = () => {
    if (config?.skip_allowed) {
      setOpen(false);
      localStorage.setItem(`onboarding-${user.email}`, 'skipped');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            {currentStep === 0 ? 'Welcome to AppForge!' : `Step ${currentStep + 1} of ${steps.length}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Your Progress</span>
              <span className="font-semibold text-purple-600">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Welcome Message */}
          {currentStep === 0 && onboardingData?.welcome_message && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="p-6">
                <p className="text-gray-800 leading-relaxed">{onboardingData.welcome_message}</p>
              </CardContent>
            </Card>
          )}

          {/* Current Step */}
          {step && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>~{step.estimated_minutes} minutes</span>
                    </div>
                  </div>
                </div>

                {/* Tutorial Content */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600 mt-1" />
                      <h4 className="font-semibold text-blue-900">Quick Tutorial</h4>
                    </div>
                    <p className="text-sm text-blue-800">{step.tutorial_content}</p>
                  </CardContent>
                </Card>

                {/* Action to Take */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Rocket className="w-4 h-4 text-green-600 mt-1" />
                      <h4 className="font-semibold text-green-900">Action</h4>
                    </div>
                    <p className="text-sm text-green-800">{step.action}</p>
                  </CardContent>
                </Card>

                {/* Proactive Tips */}
                {step.proactive_tips?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Pro Tips
                    </h4>
                    <div className="space-y-2">
                      {step.proactive_tips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Help Section */}
                {showHelp && updateProgress.data?.proactive_help && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <HelpCircle className="w-4 h-4 text-yellow-600 mt-1" />
                        <h4 className="font-semibold text-yellow-900">AI Assistance</h4>
                      </div>
                      <p className="text-sm text-yellow-800 mb-2">
                        {updateProgress.data.proactive_help.tip}
                      </p>
                      <p className="text-sm text-yellow-700 font-medium">
                        Suggested: {updateProgress.data.proactive_help.action_suggestion}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {config?.skip_allowed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-500"
                >
                  <X className="w-4 h-4 mr-1" />
                  Skip Onboarding
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNeedHelp}
                disabled={updateProgress.isPending}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Need Help
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {step?.page && (
                <Button
                  variant="outline"
                  onClick={handleNavigate}
                >
                  Go to {step.page}
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={updateProgress.isPending}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}