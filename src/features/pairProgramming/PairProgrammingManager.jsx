import React, { useState, useRef, useEffect } from 'react';
import { Users, Play, Square, MessageSquare, Save, Download } from 'lucide-react';
import { usePairProgramming } from './usePairProgramming';
import { cn } from '@/lib/utils';

/**
 * Pair Programming Manager Component
 * Real-time collaborative coding interface
 */
export function PairProgrammingManager() {
  const {
    sessions,
    activeSession,
    participants,
    cursorPositions,
    sharedCode,
    messages,
    createSession,
    joinSession,
    endSession,
    syncCode,
    sendMessage,
    startRecording,
    stopRecording,
    getSessionStats
  } = usePairProgramming();

  const [sessionMode, setSessionMode] = useState('create'); // create, join, active
  const [joinCode, setJoinCode] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [currentUser] = useState({ id: 'user_1', name: 'You' });
  const [showRecording, setShowRecording] = useState(false);
  const codeEditorRef = useRef(null);

  const handleCreateSession = () => {
    const session = createSession(currentUser.id, currentUser.name);
    setSessionMode('active');
    setShowRecording(false);
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinSession(joinCode, currentUser.id, currentUser.name);
      setSessionMode('active');
    } catch (error) {
      console.error('Failed to join:', error);
    }
  };

  const handleEndSession = () => {
    if (activeSession) {
      endSession(activeSession.id);
      setSessionMode('create');
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeSession) return;
    sendMessage(messageInput, currentUser.id, currentUser.name);
    setMessageInput('');
  };

  const stats = activeSession ? getSessionStats(activeSession.id) : null;

  return (
    <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          Pair Programming
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {activeSession ? 'Session active' : 'Start or join a coding session'}
        </p>
      </div>

      {!activeSession ? (
        // Session Setup
        <div className="space-y-4">
          {sessionMode === 'create' && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Start New Session</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Create a session and share the code with your partner
              </p>
              <button
                onClick={handleCreateSession}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Create Session
              </button>
              <button
                onClick={() => setSessionMode('join')}
                className="w-full px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium"
              >
                Join Existing Session
              </button>
            </div>
          )}

          {sessionMode === 'join' && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Join Session</h3>
              <input
                type="text"
                placeholder="Enter session code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoinSession}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Join
                </button>
                <button
                  onClick={() => setSessionMode('create')}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded font-medium"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Active Session
        <div className="space-y-4">
          {/* Session Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Session ID</p>
                <p className="font-mono text-sm text-slate-900 dark:text-white">{activeSession.id.slice(0, 12)}...</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Participants</p>
                <p className="font-bold text-slate-900 dark:text-white">{stats?.participants || 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Duration</p>
                <p className="font-mono text-sm text-slate-900 dark:text-white">
                  {Math.floor((stats?.duration || 0) / 1000)}s
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Lines</p>
                <p className="font-bold text-slate-900 dark:text-white">{stats?.totalLines || 0}</p>
              </div>
            </div>
          </div>

          {/* Recording Control */}
          <div className="flex gap-2">
            {!showRecording ? (
              <button
                onClick={() => {
                  startRecording(activeSession.id);
                  setShowRecording(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
              >
                <Play className="w-4 h-4" />
                Record Session
              </button>
            ) : (
              <button
                onClick={() => {
                  stopRecording(activeSession.id);
                  setShowRecording(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-medium"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </button>
            )}
            <button
              onClick={handleEndSession}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded font-medium"
            >
              End Session
            </button>
          </div>

          {/* Code Editor & Chat Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Code Editor */}
            <div className="lg:col-span-2 space-y-2">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-900 text-slate-100 px-4 py-2 flex justify-between items-center">
                  <span className="text-sm font-medium">Shared Code</span>
                  <button className="p-1 hover:bg-slate-700 rounded">
                    <Save className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  ref={codeEditorRef}
                  value={sharedCode}
                  onChange={(e) => syncCode(e.target.value, currentUser.id)}
                  className="w-full h-96 bg-slate-900 text-slate-100 p-4 font-mono text-sm resize-none focus:outline-none"
                  placeholder="Start coding..."
                />
              </div>

              {/* Participants */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Participants</h3>
                <div className="space-y-2">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded">
                      <span className="text-sm text-slate-900 dark:text-white">{p.name}</span>
                      {cursorPositions[p.id] && (
                        <span className="text-xs text-slate-500">
                          Line {cursorPositions[p.id].line}:{cursorPositions[p.id].column}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
              <div className="bg-slate-900 text-slate-100 px-4 py-2">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {msg.participantName}
                    </p>
                    <p className="text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 p-2 rounded">
                      {msg.content}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Type message..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
