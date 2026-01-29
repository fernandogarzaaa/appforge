import React, { useState } from 'react';
import { Award, Zap, Trophy, TrendingUp } from 'lucide-react';
import { useCodeReviewGamification } from './useCodeReviewGamification';
import { cn } from '@/lib/utils';

/**
 * Code Review Gamification Component
 * Display badges, leaderboard, streaks, and achievements
 */
export function CodeReviewGamification() {
  const {
    userStats,
    leaderboard,
    badges,
    completeReview,
    markHelpful,
    getAchievementProgress,
    getBadgeIcon
  } = useCodeReviewGamification();

  const [activeTab, setActiveTab] = useState('stats'); // stats, badges, leaderboard, achievements
  const achievements = getAchievementProgress();
  const progress = (userStats.points % 500) / 500;

  return (
    <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header with User Stats */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-yellow-500" />
          Code Review Gamification
        </h2>

        {/* User Profile Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-90">Level</p>
              <p className="text-3xl font-bold">{userStats.level}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Points</p>
              <p className="text-3xl font-bold">{userStats.points}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Reviews</p>
              <p className="text-3xl font-bold">{userStats.reviewsCompleted}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Streak</p>
              <p className="text-3xl font-bold">{userStats.currentStreak}🔥</p>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-4">
            <p className="text-sm opacity-90 mb-2">Level Progress</p>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {['stats', 'badges', 'leaderboard', 'achievements'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 font-medium text-sm transition capitalize",
              activeTab === tab
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Review Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Total Reviews</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {userStats.reviewsCompleted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Average Score</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {userStats.averageScore.toFixed(1)}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Total Comments</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {userStats.totalComments}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Helpful Votes</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {userStats.helpful}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Streaks</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Current Streak</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-slate-700 rounded p-2 text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {userStats.currentStreak}
                      </p>
                      <p className="text-xs text-slate-500">days</p>
                    </div>
                    <span className="text-4xl">🔥</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Longest Streak</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {userStats.longestStreak}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.length === 0 ? (
              <p className="col-span-full text-center text-slate-500 py-8">
                No badges earned yet. Complete reviews to unlock badges!
              </p>
            ) : (
              badges.map(badge => (
                <div
                  key={badge.id}
                  className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg p-4 text-center border border-yellow-300 dark:border-yellow-700"
                >
                  <p className="text-4xl mb-2">{badge.icon}</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{badge.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{badge.description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(badge.awardedAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-2">
            <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-lg overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-4 font-semibold border-b border-slate-700">
                <span className="w-12">Rank</span>
                <span className="flex-1">Name</span>
                <span className="w-20 text-right">Reviews</span>
                <span className="w-20 text-right">Points</span>
              </div>
              {leaderboard.slice(0, 10).map((user, index) => (
                <div
                  key={user.id}
                  className={cn(
                    "px-4 py-3 flex items-center gap-4 border-b border-slate-700",
                    index === 0 && "bg-yellow-900/30",
                    index === 1 && "bg-gray-600/30",
                    index === 2 && "bg-orange-800/30"
                  )}
                >
                  <span className="w-12 font-bold">
                    {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {index + 1}
                  </span>
                  <span className="flex-1">{user.name}</span>
                  <span className="w-20 text-right">{user.reviews}</span>
                  <span className="w-20 text-right font-bold">{user.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {/* Reviews Achievement */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">📋 Reviews</h3>
              <div className="space-y-3">
                {[
                  { target: 1, name: 'First Review', icon: '🎖️' },
                  { target: 10, name: 'Reviewer', icon: '⭐' },
                  { target: 50, name: 'Expert', icon: '👑' }
                ].map(milestone => {
                  const progress = (achievements.reviews.current / milestone.target) * 100;
                  const completed = achievements.reviews.current >= milestone.target;
                  return (
                    <div key={milestone.target}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          {milestone.icon} {milestone.name}
                        </span>
                        <span className="text-sm text-slate-500">
                          {Math.min(achievements.reviews.current, milestone.target)}/{milestone.target}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            completed ? "bg-green-500" : "bg-blue-500"
                          )}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak Achievement */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">🔥 Streaks</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Current</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {achievements.streak.current}/{achievements.streak.target} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Personal Best</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {achievements.streak.best} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
