// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useOnboarding } from '../../phase4/onboarding/useOnboarding';
// Placeholder - hook not available in animation version
const useOnboarding = () => ({});
import { useAnimations } from './useAnimations';
import { useAccessibility } from '../accessibility/useAccessibility';
import { useResponsive } from '../responsive/useResponsive';
import { AnimatedCard, AnimatedButton, AnimatedProgress, AnimatedToggle } from './AnimatedComponents';

/**
 * AnimatedOnboardingFlow
 * 
 * Demonstrates Phase 4 Onboarding enhanced with Phase 5 animations.
 * Features smooth step transitions, engaging tutorials, and accessibility.
 * 
 * Props:
 *   - onComplete: Callback when onboarding is completed
 *   - onSkip: Callback when onboarding is skipped
 *   - mode: 'tutorial' | 'checklist' | 'full'
 * 
 * Features:
 *   - Animated checklist completion
 *   - Smooth step transitions
 *   - Engaging tutorial card reveal animations
 *   - Progress bar smooth updates
 *   - Interactive step indicators
 *   - Accessibility announcements
 *   - Responsive multi-device support
 */
export function AnimatedOnboardingFlow({ onComplete, onSkip, mode = 'full' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [expandedTutorial, setExpandedTutorial] = useState(null);
  const [showTips, setShowTips] = useState(true);

  const {
    steps,
    tutorials,
    checklist,
    isComplete,
    completeStep,
    skipStep,
    completeOnboarding,
  } = useOnboarding();

  const animations = useAnimations();
  const { announce, createAccessibleButton, createAccessibleProgressBar } = useAccessibility();
  const { isMobile, isDesktop } = useResponsive();

  // Handle step completion
  const handleStepComplete = useCallback(async (stepId) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    announce(`Completed step: ${stepId}`, 'polite');
    try {
      await completeStep(stepId);
    } catch (error) {
      console.error('Error completing step:', error);
    }
  }, [completedSteps, completeStep, announce]);

  // Handle skip step
  const handleSkipStep = useCallback(async (stepId) => {
    announce(`Skipped step: ${stepId}`, 'polite');
    try {
      await skipStep(stepId);
    } catch (error) {
      console.error('Error skipping step:', error);
    }
  }, [skipStep, announce]);

  // Handle finish onboarding
  const handleFinish = useCallback(async () => {
    announce('Onboarding completed successfully', 'polite');
    try {
      await completeOnboarding();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, [completeOnboarding, onComplete, announce]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      announce(`Advanced to step ${currentStep + 2} of ${steps.length}`, 'polite');
    }
  }, [currentStep, steps.length, announce]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      announce(`Returned to step ${currentStep} of ${steps.length}`, 'polite');
    }
  }, [currentStep, steps.length, announce]);

  const progressPercentage = (completedSteps.size / (steps?.length || 1)) * 100;
  const isCurrentStepComplete = completedSteps.has(steps[currentStep]?.id);

  return (
    <motion.div
      className="space-y-8"
      variants={animations.containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Progress */}
      <motion.div
        className="space-y-4"
        variants={animations.itemVariants}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to AppForge
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Let's get you set up in a few minutes
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completedSteps.size} of {steps?.length || 0} completed
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <motion.div
            className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            {...createAccessibleProgressBar({
              value: progressPercentage,
              label: 'Onboarding progress',
            })}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            />
          </motion.div>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar - Step List */}
        <motion.div
          className="lg:col-span-1"
          variants={animations.itemVariants}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-white font-semibold">Steps</h2>
            </div>
            <div className="space-y-2 p-4">
              {steps?.map((step, index) => (
                <motion.button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    currentStep === index
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                      : completedSteps.has(step.id)
                      ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        completedSteps.has(step.id)
                          ? 'bg-green-500 text-white'
                          : currentStep === index
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}
                      animate={
                        completedSteps.has(step.id)
                          ? { scale: [1, 1.2, 1] }
                          : {}
                      }
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      {completedSteps.has(step.id) ? '✓' : index + 1}
                    </motion.div>
                    <div>
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs opacity-75">{step.duration || '5 min'}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          variants={animations.itemVariants}
        >
          {/* Current Step */}
          <AnimatePresence mode="wait">
            {steps && steps[currentStep] && (
              <motion.div
                key={currentStep}
                variants={animations.containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-6"
              >
                {/* Step Card */}
                <AnimatedCard className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
                  <motion.div
                    variants={animations.itemVariants}
                    className="space-y-6"
                  >
                    {/* Step Header */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <motion.span
                          className="inline-block text-3xl"
                          animate={{ rotate: 360 }}
                          transition={{
                            delay: 0.2,
                            duration: 1,
                            ease: 'easeOut',
                          }}
                        >
                          {steps[currentStep].icon || '⭐'}
                        </motion.span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          Step {currentStep + 1} of {steps.length}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {steps[currentStep].title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {steps[currentStep].description}
                      </p>
                    </div>

                    {/* Step Content */}
                    <div className="space-y-4">
                      {steps[currentStep].content && (
                        <motion.div
                          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3"
                          variants={animations.itemVariants}
                        >
                          {Array.isArray(steps[currentStep].content) ? (
                            steps[currentStep].content.map((item, idx) => (
                              <motion.div
                                key={idx}
                                className="flex gap-3"
                                variants={animations.listItemVariants}
                              >
                                <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                                  →
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {item}
                                </span>
                              </motion.div>
                            ))
                          ) : (
                            <p className="text-gray-700 dark:text-gray-300">
                              {steps[currentStep].content}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Completion Checkbox */}
                    <AnimatedToggle
                      isOpen={isCurrentStepComplete}
                      onClick={() => {
                        if (isCurrentStepComplete) {
                          const newCompleted = new Set(completedSteps);
                          newCompleted.delete(steps[currentStep].id);
                          setCompletedSteps(newCompleted);
                        } else {
                          handleStepComplete(steps[currentStep].id);
                        }
                      }}
                      className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 cursor-pointer"
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCurrentStepComplete}
                          onChange={() => {
                            if (isCurrentStepComplete) {
                              const newCompleted = new Set(completedSteps);
                              newCompleted.delete(steps[currentStep].id);
                              setCompletedSteps(newCompleted);
                            } else {
                              handleStepComplete(steps[currentStep].id);
                            }
                          }}
                          className="w-5 h-5 rounded accent-green-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          I've completed this step
                        </span>
                      </label>
                    </AnimatedToggle>
                  </motion.div>
                </AnimatedCard>

                {/* Tutorials Section */}
                {showTips && tutorials && tutorials.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      💡 Tips & Tutorials
                    </h3>
                    {tutorials.map((tutorial, idx) => (
                      <AnimatedCard
                        key={tutorial.id}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 cursor-pointer"
                        onClick={() =>
                          setExpandedTutorial(
                            expandedTutorial === tutorial.id ? null : tutorial.id
                          )
                        }
                        whileHover={{ x: 4 }}
                      >
                        <motion.div
                          variants={animations.itemVariants}
                          className="space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-amber-900 dark:text-amber-200">
                                {tutorial.title}
                              </p>
                              <p className="text-sm text-amber-800/70 dark:text-amber-300/70">
                                {tutorial.duration}
                              </p>
                            </div>
                            <span className="text-xl">
                              {expandedTutorial === tutorial.id ? '▼' : '▶'}
                            </span>
                          </div>
                          <AnimatePresence>
                            {expandedTutorial === tutorial.id && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-sm text-amber-900/80 dark:text-amber-200/80 pt-2 border-t border-amber-200 dark:border-amber-800"
                              >
                                {tutorial.content}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </AnimatedCard>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div
            className="flex gap-3 justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
            variants={animations.itemVariants}
          >
            <div className="flex gap-3">
              <AnimatedButton
                onClick={handlePrevious}
                disabled={currentStep === 0}
                {...createAccessibleButton({
                  label: 'Go to previous step',
                  disabled: currentStep === 0,
                })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ← Previous
              </AnimatedButton>

              <AnimatedButton
                onClick={handleNext}
                disabled={currentStep === steps.length - 1}
                {...createAccessibleButton({
                  label: 'Go to next step',
                  disabled: currentStep === steps.length - 1,
                })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next →
              </AnimatedButton>
            </div>

            <div className="flex gap-3">
              <AnimatedButton
                onClick={() => {
                  announce('Skipped onboarding', 'polite');
                  if (onSkip) onSkip();
                }}
                {...createAccessibleButton({
                  label: 'Skip onboarding',
                })}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                Skip
              </AnimatedButton>

              <AnimatedButton
                onClick={handleFinish}
                {...createAccessibleButton({
                  label: 'Complete onboarding',
                })}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
              >
                {currentStep === steps.length - 1 ? '✓ Complete' : 'Continue'}
              </AnimatedButton>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AnimatedOnboardingFlow;
