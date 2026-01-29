import { useState, useCallback, useEffect } from 'react';

/**
 * useOnboarding Hook
 * Manage user onboarding flows, tours, and tutorials
 */
export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState({
    completed: false,
    currentStep: 0,
    completedSteps: [],
    skipped: false,
    startedAt: null,
    completedAt: null
  });

  const [activeTours, setActiveTours] = useState([]);
  const [tourProgress, setTourProgress] = useState({});
  const [tutorials, setTutorials] = useState([]);

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('appforge_onboarding_state');
    if (saved) setOnboardingState(JSON.parse(saved));

    const tours = localStorage.getItem('appforge_active_tours');
    if (tours) setActiveTours(JSON.parse(tours));

    const progress = localStorage.getItem('appforge_tour_progress');
    if (progress) setTourProgress(JSON.parse(progress));

    const savedTutorials = localStorage.getItem('appforge_tutorials');
    if (savedTutorials) setTutorials(JSON.parse(savedTutorials));
  }, []);

  // Start onboarding
  const startOnboarding = useCallback(() => {
    const state = {
      completed: false,
      currentStep: 0,
      completedSteps: [],
      skipped: false,
      startedAt: new Date().toISOString(),
      completedAt: null
    };
    setOnboardingState(state);
    localStorage.setItem('appforge_onboarding_state', JSON.stringify(state));
  }, []);

  // Complete onboarding step
  const completeStep = useCallback((stepIndex) => {
    const updated = { ...onboardingState };
    if (!updated.completedSteps.includes(stepIndex)) {
      updated.completedSteps.push(stepIndex);
    }
    updated.currentStep = stepIndex + 1;
    setOnboardingState(updated);
    localStorage.setItem('appforge_onboarding_state', JSON.stringify(updated));
  }, [onboardingState]);

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    const updated = {
      ...onboardingState,
      skipped: true,
      completed: true,
      completedAt: new Date().toISOString()
    };
    setOnboardingState(updated);
    localStorage.setItem('appforge_onboarding_state', JSON.stringify(updated));
  }, [onboardingState]);

  // Complete entire onboarding
  const completeOnboarding = useCallback(() => {
    const updated = {
      ...onboardingState,
      completed: true,
      completedAt: new Date().toISOString()
    };
    setOnboardingState(updated);
    localStorage.setItem('appforge_onboarding_state', JSON.stringify(updated));
  }, [onboardingState]);

  // Get onboarding progress
  const getOnboardingProgress = useCallback(() => {
    const totalSteps = 10; // Default number of onboarding steps
    const completed = onboardingState.completedSteps.length;
    return {
      completed,
      total: totalSteps,
      percentage: ((completed / totalSteps) * 100).toFixed(1),
      status: onboardingState.completed ? 'completed' : 'in-progress',
      currentStep: onboardingState.currentStep
    };
  }, [onboardingState]);

  // Start tour
  const startTour = useCallback((tourName, steps) => {
    const tour = {
      id: Date.now(),
      name: tourName,
      steps,
      currentStep: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      completed: false
    };

    const updated = [...activeTours, tour];
    setActiveTours(updated);
    localStorage.setItem('appforge_active_tours', JSON.stringify(updated));

    setTourProgress(prev => ({
      ...prev,
      [tourName]: { currentStep: 0, completed: false }
    }));

    return tour;
  }, [activeTours]);

  // Advance tour step
  const advanceTourStep = useCallback((tourName) => {
    const updated = activeTours.map(tour => {
      if (tour.name === tourName) {
        const newStep = tour.currentStep + 1;
        const completed = newStep >= tour.steps.length;
        return {
          ...tour,
          currentStep: newStep,
          completed,
          completedAt: completed ? new Date().toISOString() : null
        };
      }
      return tour;
    });

    setActiveTours(updated);
    localStorage.setItem('appforge_active_tours', JSON.stringify(updated));

    setTourProgress(prev => ({
      ...prev,
      [tourName]: {
        currentStep: updated.find(t => t.name === tourName)?.currentStep || 0,
        completed: updated.find(t => t.name === tourName)?.completed || false
      }
    }));
  }, [activeTours]);

  // Skip tour
  const skipTour = useCallback((tourName) => {
    const updated = activeTours.filter(tour => tour.name !== tourName);
    setActiveTours(updated);
    localStorage.setItem('appforge_active_tours', JSON.stringify(updated));

    setTourProgress(prev => ({
      ...prev,
      [tourName]: { currentStep: -1, completed: true, skipped: true }
    }));
  }, [activeTours]);

  // Create tutorial
  const createTutorial = useCallback((tutorialConfig) => {
    const tutorial = {
      id: Date.now(),
      name: tutorialConfig.name,
      description: tutorialConfig.description,
      category: tutorialConfig.category || 'general',
      sections: tutorialConfig.sections || [],
      videoUrl: tutorialConfig.videoUrl,
      difficulty: tutorialConfig.difficulty || 'beginner',
      estimatedTime: tutorialConfig.estimatedTime || 5,
      createdAt: new Date().toISOString(),
      viewCount: 0,
      completionRate: 0,
      rating: 0
    };

    const updated = [...tutorials, tutorial];
    setTutorials(updated);
    localStorage.setItem('appforge_tutorials', JSON.stringify(updated));

    return tutorial;
  }, [tutorials]);

  // Track tutorial view
  const trackTutorialView = useCallback((tutorialId) => {
    const updated = tutorials.map(t => {
      if (t.id === tutorialId) {
        return { ...t, viewCount: (t.viewCount || 0) + 1 };
      }
      return t;
    });

    setTutorials(updated);
    localStorage.setItem('appforge_tutorials', JSON.stringify(updated));
  }, [tutorials]);

  // Rate tutorial
  const rateTutorial = useCallback((tutorialId, rating) => {
    const updated = tutorials.map(t => {
      if (t.id === tutorialId) {
        const newRating = ((t.rating * Math.max(1, t.viewCount - 1)) + rating) / Math.max(1, t.viewCount);
        return { ...t, rating: newRating.toFixed(1) };
      }
      return t;
    });

    setTutorials(updated);
    localStorage.setItem('appforge_tutorials', JSON.stringify(updated));
  }, [tutorials]);

  // Get recommended tutorials
  const getRecommendedTutorials = useCallback((category = null, limit = 5) => {
    let filtered = tutorials;

    if (category) {
      filtered = tutorials.filter(t => t.category === category);
    }

    return filtered
      .sort((a, b) => {
        // Sort by rating and views
        const aScore = (a.rating || 0) * (a.viewCount || 0);
        const bScore = (b.rating || 0) * (b.viewCount || 0);
        return bScore - aScore;
      })
      .slice(0, limit);
  }, [tutorials]);

  // Get tutorial by category
  const getTutorialsByCategory = useCallback((category) => {
    return tutorials.filter(t => t.category === category);
  }, [tutorials]);

  // Create onboarding checklist
  const createOnboardingChecklist = useCallback(() => {
    return [
      {
        id: 1,
        title: 'Create Your First Project',
        description: 'Start by creating your first project',
        completed: onboardingState.completedSteps.includes(0),
        icon: '📁'
      },
      {
        id: 2,
        title: 'Set Up Team Members',
        description: 'Invite team members to collaborate',
        completed: onboardingState.completedSteps.includes(1),
        icon: '👥'
      },
      {
        id: 3,
        title: 'Configure Settings',
        description: 'Customize your workspace settings',
        completed: onboardingState.completedSteps.includes(2),
        icon: '⚙️'
      },
      {
        id: 4,
        title: 'Explore Features',
        description: 'Take a tour of key features',
        completed: onboardingState.completedSteps.includes(3),
        icon: '🚀'
      },
      {
        id: 5,
        title: 'Set Up Integrations',
        description: 'Connect external services',
        completed: onboardingState.completedSteps.includes(4),
        icon: '🔗'
      }
    ];
  }, [onboardingState]);

  // Check if user needs onboarding
  const needsOnboarding = useCallback(() => {
    return !onboardingState.completed && !onboardingState.skipped;
  }, [onboardingState]);

  return {
    // State
    onboardingState,
    activeTours,
    tourProgress,
    tutorials,

    // Onboarding
    startOnboarding,
    completeStep,
    skipOnboarding,
    completeOnboarding,
    getOnboardingProgress,
    createOnboardingChecklist,
    needsOnboarding,

    // Tours
    startTour,
    advanceTourStep,
    skipTour,

    // Tutorials
    createTutorial,
    trackTutorialView,
    rateTutorial,
    getRecommendedTutorials,
    getTutorialsByCategory
  };
}
