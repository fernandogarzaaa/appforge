import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ChevronRight, Star, BookOpen, Play } from 'lucide-react';
import { useOnboarding } from './useOnboarding';

/**
 * OnboardingFlow Component
 * Displays onboarding checklist, tutorial recommendations, and tour system
 * Features: Step progression, Tutorial recommendations, Tour management, Progress tracking
 */
export const OnboardingFlow = () => {
  const {
    onboardingState,
    startOnboarding,
    completeStep,
    skipOnboarding,
    completeOnboarding,
    getOnboardingProgress,
    startTour,
    advanceTourStep,
    skipTour,
    activeTours,
    createTutorial,
    trackTutorialView,
    rateTutorial,
    getRecommendedTutorials,
    tutorials,
  } = useOnboarding();

  const [activeTab, setActiveTab] = useState('checklist');
  const [tutorialCategory, setTutorialCategory] = useState('all');
  const [recommendedTutorials, setRecommendedTutorials] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    if (onboardingState?.completedSteps) {
      setCompletedSteps(onboardingState.completedSteps);
    }
    const recommended = getRecommendedTutorials(
      tutorialCategory === 'all' ? undefined : tutorialCategory,
      6
    );
    setRecommendedTutorials(recommended);
  }, [tutorialCategory]);

  const onboardingSteps = [
    { id: 1, title: 'Create Your First Project', description: 'Learn how to set up a new project' },
    { id: 2, title: 'Configure Settings', description: 'Customize your workspace preferences' },
    { id: 3, title: 'Invite Team Members', description: 'Add collaborators to your project' },
    { id: 4, title: 'Deploy Your App', description: 'Push your first deployment' },
    { id: 5, title: 'Monitor Performance', description: 'Set up analytics and monitoring' },
  ];

  const categories = ['all', 'getting-started', 'advanced', 'integration', 'deployment'];

  const handleStartStep = (stepIndex) => {
    if (!completedSteps.includes(stepIndex)) {
      completeStep(stepIndex);
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const progress = getOnboardingProgress();

  const handleStartTour = (tourName, steps) => {
    startTour(tourName, steps);
  };

  const isStepCompleted = (stepId) => completedSteps.includes(stepId - 1);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-green-400" />
          <h2 className="text-2xl font-bold text-white">Onboarding & Tutorials</h2>
        </div>
        <div className="text-right">
          <p className="text-green-400 font-bold text-lg">{progress}%</p>
          <p className="text-slate-400 text-sm">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-slate-400 text-sm text-center">
          {completedSteps.length} of {onboardingSteps.length} steps completed
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {['checklist', 'tutorials', 'tours'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition ${
              activeTab === tab
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Checklist Tab */}
      {activeTab === 'checklist' && (
        <div className="space-y-3">
          {onboardingSteps.map((step, idx) => (
            <div
              key={step.id}
              className={`rounded-lg p-4 transition ${
                isStepCompleted(step.id)
                  ? 'bg-slate-800 border border-green-500/50'
                  : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {isStepCompleted(step.id) ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isStepCompleted(step.id) ? 'text-white line-through text-slate-400' : 'text-white'}`}>
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">{step.description}</p>
                </div>
                <div className="flex-shrink-0">
                  {!isStepCompleted(step.id) && (
                    <button
                      onClick={() => handleStartStep(idx)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                    >
                      <Play className="w-3 h-3" />
                      Start
                    </button>
                  )}
                  {isStepCompleted(step.id) && (
                    <span className="text-green-400 text-sm font-medium">Done</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {progress === 100 && (
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">🎉 Onboarding Complete!</h3>
                  <p className="text-slate-400 text-sm mt-1">You've successfully completed all onboarding steps</p>
                </div>
                <button
                  onClick={() => completeOnboarding()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  Finish
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tutorials Tab */}
      {activeTab === 'tutorials' && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setTutorialCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                  tutorialCategory === cat
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Tutorials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedTutorials.map(tutorial => (
              <div
                key={tutorial.id}
                className="bg-slate-800 rounded-lg p-4 flex flex-col hover:border-green-500/50 border border-slate-700 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold flex-1">{tutorial.title}</h3>
                  <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded capitalize">
                    {tutorial.difficulty || 'beginner'}
                  </span>
                </div>

                <p className="text-slate-400 text-sm flex-1 mb-3">{tutorial.description}</p>

                {/* Stars and Views */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.round(tutorial.averageRating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{tutorial.viewCount || 0} views</span>
                </div>

                {/* Est. Time */}
                <p className="text-xs text-slate-500 mb-3">⏱️ {tutorial.estimatedTime || 15} mins</p>

                {/* Action Buttons */}
                <button
                  onClick={() => {
                    trackTutorialView(tutorial.id);
                    handleStartTour(tutorial.id, []);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                >
                  <Play className="w-3 h-3" />
                  Start Tutorial
                </button>
              </div>
            ))}
          </div>

          {recommendedTutorials.length === 0 && (
            <p className="text-slate-400 text-center py-8">No tutorials available in this category</p>
          )}
        </div>
      )}

      {/* Tours Tab */}
      {activeTab === 'tours' && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            <h3 className="text-white font-semibold">Feature Tours</h3>

            {/* Feature Tours */}
            <div className="space-y-2">
              {[
                { name: 'Command Palette Tour', steps: 8, icon: '⌨️' },
                { name: 'Dashboard Navigation', steps: 6, icon: '🗺️' },
                { name: 'Team Collaboration', steps: 7, icon: '👥' },
                { name: 'Settings Exploration', steps: 5, icon: '⚙️' },
              ].map(tour => (
                <div key={tour.name} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tour.icon}</span>
                    <div>
                      <p className="text-white font-medium">{tour.name}</p>
                      <p className="text-slate-400 text-xs">{tour.steps} steps</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleStartTour(tour.name, Array.from({ length: tour.steps }, (_, i) => `step_${i + 1}`))
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                  >
                    <Play className="w-3 h-3" />
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Tours */}
          {Object.keys(activeTours).length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 space-y-2">
              <h3 className="text-white font-semibold">Active Tours</h3>
              {Object.entries(activeTours).map(([tourName, tour]) => (
                <div key={tourName} className="bg-slate-800 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{tourName}</p>
                    <p className="text-slate-400 text-xs">
                      Step {tour.currentStep + 1} of {tour.steps.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => advanceTourStep(tourName)}
                      className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                    >
                      Next Step
                    </button>
                    <button
                      onClick={() => skipTour(tourName)}
                      className="flex-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition"
                    >
                      Skip Tour
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnboardingFlow;
