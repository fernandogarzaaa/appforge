import { useState, useCallback, useEffect } from 'react';

/**
 * Code Review Gamification Hook
 * Badges, leaderboards, streaks, and achievements
 */
export function useCodeReviewGamification() {
  const [userStats, setUserStats] = useState(() => {
    const saved = localStorage.getItem('appforge_review_stats');
    return saved ? JSON.parse(saved) : {
      reviewsCompleted: 0,
      averageScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalComments: 0,
      helpful: 0,
      badges: [],
      level: 1,
      points: 0
    };
  });

  const [leaderboard, setLeaderboard] = useState(() => {
    const saved = localStorage.getItem('appforge_leaderboard');
    return saved ? JSON.parse(saved) : [];
  });

  const [badges, setBadges] = useState(() => {
    const saved = localStorage.getItem('appforge_badges');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('appforge_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('appforge_review_stats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('appforge_leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    localStorage.setItem('appforge_badges', JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    localStorage.setItem('appforge_reviews', JSON.stringify(reviews));
  }, [reviews]);

  /**
   * Award badge to user
   */
  const awardBadge = useCallback((badgeId, badgeName, description) => {
    const badge = {
      id: badgeId,
      name: badgeName,
      description,
      awardedAt: Date.now(),
      icon: getBadgeIcon(badgeId)
    };

    setBadges(prev => {
      if (prev.some(b => b.id === badgeId)) return prev;
      return [...prev, badge];
    });

    setUserStats(prev => ({
      ...prev,
      badges: [...prev.badges, badgeId],
      points: prev.points + getBadgePoints(badgeId)
    }));
  }, []);

  /**
   * Complete code review
   */
  const completeReview = useCallback((prId, score, comments = 0) => {
    const review = {
      id: `review_${Date.now()}`,
      prId,
      score,
      comments,
      completedAt: Date.now()
    };

    setReviews(prev => [...prev, review]);

    setUserStats(prev => {
      const newStats = {
        ...prev,
        reviewsCompleted: prev.reviewsCompleted + 1,
        averageScore: (prev.averageScore * prev.reviewsCompleted + score) / (prev.reviewsCompleted + 1),
        totalComments: prev.totalComments + comments,
        currentStreak: prev.currentStreak + 1,
        longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
        points: prev.points + (score * 10) + (comments * 5)
      };

      // Check for badges
      checkBadges(newStats);

      return newStats;
    });

    // Update leaderboard
    updateLeaderboard();
  }, []);

  /**
   * Check if user earned badges
   */
  const checkBadges = (stats) => {
    // First Review
    if (stats.reviewsCompleted === 1) {
      awardBadge('first-review', 'First Review', 'Completed your first code review');
    }

    // 10 Reviews
    if (stats.reviewsCompleted === 10) {
      awardBadge('10-reviews', 'Reviewer', 'Completed 10 code reviews');
    }

    // 50 Reviews
    if (stats.reviewsCompleted === 50) {
      awardBadge('50-reviews', 'Expert Reviewer', 'Completed 50 code reviews');
    }

    // Streak of 5
    if (stats.currentStreak === 5) {
      awardBadge('streak-5', 'On Fire 🔥', 'Maintained a 5-day review streak');
    }

    // Perfect Score
    if (stats.averageScore >= 9.5 && stats.reviewsCompleted >= 5) {
      awardBadge('perfect-score', 'Perfect Eye', 'Maintained near-perfect review scores');
    }

    // Helpful Reviewer
    if (stats.helpful >= 10) {
      awardBadge('helpful', 'Helpful 💚', 'Received 10+ helpful votes on reviews');
    }
  };

  /**
   * Update leaderboard rankings
   */
  const updateLeaderboard = useCallback(() => {
    // In real app, fetch from backend
    setLeaderboard(prev => {
      const updated = [...prev];
      const userIndex = updated.findIndex(u => u.id === 'current-user');
      
      if (userIndex >= 0) {
        updated[userIndex] = { ...updated[userIndex], points: userStats.points };
        return updated.sort((a, b) => b.points - a.points);
      }
      return updated;
    });
  }, [userStats.points]);

  /**
   * Get badge icon
   */
  const getBadgeIcon = (badgeId) => {
    const icons = {
      'first-review': '🎖️',
      '10-reviews': '⭐',
      '50-reviews': '👑',
      'streak-5': '🔥',
      'perfect-score': '💯',
      'helpful': '💚',
    };
    return icons[badgeId] || '🏆';
  };

  /**
   * Get badge points
   */
  const getBadgePoints = (badgeId) => {
    const points = {
      'first-review': 50,
      '10-reviews': 100,
      '50-reviews': 250,
      'streak-5': 75,
      'perfect-score': 150,
      'helpful': 50,
    };
    return points[badgeId] || 25;
  };

  /**
   * Calculate level from points
   */
  const calculateLevel = useCallback(() => {
    const level = Math.floor(userStats.points / 500) + 1;
    setUserStats(prev => ({ ...prev, level }));
  }, [userStats.points]);

  /**
   * Get achievement progress
   */
  const getAchievementProgress = useCallback(() => {
    return {
      reviews: {
        current: userStats.reviewsCompleted,
        targets: [1, 10, 50, 100],
        current: userStats.reviewsCompleted
      },
      streak: {
        current: userStats.currentStreak,
        best: userStats.longestStreak,
        target: 10
      },
      average: {
        current: userStats.averageScore,
        target: 9.5
      }
    };
  }, [userStats]);

  /**
   * Mark review comment as helpful
   */
  const markHelpful = useCallback((reviewId) => {
    setUserStats(prev => ({
      ...prev,
      helpful: prev.helpful + 1,
      points: prev.points + 10
    }));
  }, []);

  return {
    userStats,
    leaderboard,
    badges,
    reviews,
    completeReview,
    awardBadge,
    updateLeaderboard,
    markHelpful,
    getAchievementProgress,
    calculateLevel,
    getBadgeIcon
  };
}
