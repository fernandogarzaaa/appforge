/**
 * Presence Indicator Component
 * Shows who's currently editing the document in real-time
 */

import React from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Activity, Signal, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
];

function getColorForUser(userId) {
  const index = userId.charCodeAt(0) % USER_COLORS.length;
  return USER_COLORS[index];
}

export default function PresenceIndicator() {
  const { isConnected, activeUsers, cursorPositions } = useCollaboration();

  if (!activeUsers || activeUsers.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardContent className="p-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Signal className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Live
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  Offline
                </span>
              </>
            )}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'} online
          </span>
        </div>

        {/* Active Users List */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-3 h-3" />
            Editing Now
          </h3>

          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {activeUsers.map((user) => {
                const cursorData = cursorPositions[user.userId];
                const isEditing = cursorData?.timestamp && 
                  (Date.now() - new Date(cursorData.timestamp).getTime()) < 5000;

                return (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge
                      className="flex items-center gap-2 px-2.5 py-1.5"
                      style={{
                        backgroundColor: getColorForUser(user.userId),
                        color: 'white',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          animation: isEditing ? 'pulse 2s infinite' : 'none',
                        }}
                      />
                      <span className="text-xs font-medium truncate max-w-[100px]">
                        {user.userName}
                      </span>
                      {isEditing && (
                        <Activity className="w-3 h-3" />
                      )}
                    </Badge>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Cursor Positions */}
        {Object.keys(cursorPositions).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
              Cursor Positions
            </h3>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {Object.entries(cursorPositions).map(([userId, cursorData]) => {
                const user = activeUsers.find(u => u.userId === userId);
                if (!user) return null;

                return (
                  <motion.div
                    key={userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getColorForUser(userId) }}
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {user.userName}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 ml-2 flex-shrink-0">
                      Line {cursorData.line}:{cursorData.column}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
