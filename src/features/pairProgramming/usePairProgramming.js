import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Pair Programming Hook
 * Real-time collaborative code editing with cursor tracking
 */
export function usePairProgramming() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('appforge_pair_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSession, setActiveSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [cursorPositions, setCursorPositions] = useState({});
  const [sharedCode, setSharedCode] = useState('');
  const [sessionStatus, setSessionStatus] = useState('idle'); // idle, connecting, active, ended
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('appforge_pair_sessions', JSON.stringify(sessions));
  }, [sessions]);

  /**
   * Create a new pair programming session
   */
  const createSession = useCallback((initiatorId, initiatorName) => {
    const sessionId = `pair_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const session = {
      id: sessionId,
      initiator: { id: initiatorId, name: initiatorName },
      createdAt: Date.now(),
      duration: 0,
      status: 'pending',
      participants: [{ id: initiatorId, name: initiatorName, joinedAt: Date.now() }],
      recordingEnabled: false,
      recordingData: null
    };

    setSessions(prev => [...prev, session]);
    setActiveSession(session);
    setSessionStatus('idle');
    
    return session;
  }, []);

  /**
   * Join an existing session
   */
  const joinSession = useCallback(async (sessionId, participantId, participantName) => {
    try {
      setSessionStatus('connecting');

      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if already a participant
      const isParticipant = session.participants.some(p => p.id === participantId);
      if (isParticipant) {
        throw new Error('Already in this session');
      }

      const updatedSession = {
        ...session,
        participants: [
          ...session.participants,
          { id: participantId, name: participantName, joinedAt: Date.now() }
        ],
        status: 'active'
      };

      setSessions(prev =>
        prev.map(s => s.id === sessionId ? updatedSession : s)
      );
      setActiveSession(updatedSession);
      setParticipants(updatedSession.participants);
      setSessionStatus('active');

      return updatedSession;
    } catch (error) {
      console.error('Join session error:', error);
      setSessionStatus('idle');
      throw error;
    }
  }, [sessions]);

  /**
   * End pair programming session
   */
  const endSession = useCallback(async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const duration = Date.now() - session.createdAt;
    const endedSession = {
      ...session,
      status: 'ended',
      duration,
      endedAt: Date.now()
    };

    setSessions(prev =>
      prev.map(s => s.id === sessionId ? endedSession : s)
    );

    setActiveSession(null);
    setSessionStatus('idle');
    setParticipants([]);
    setCursorPositions({});
  }, [sessions]);

  /**
   * Update cursor position for real-time collaboration
   */
  const updateCursorPosition = useCallback((participantId, line, column) => {
    setCursorPositions(prev => ({
      ...prev,
      [participantId]: { line, column, timestamp: Date.now() }
    }));

    // Broadcast via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor_update',
        participantId,
        line,
        column
      }));
    }
  }, []);

  /**
   * Sync code changes
   */
  const syncCode = useCallback((code, participantId) => {
    setSharedCode(code);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'code_change',
        code,
        participantId,
        timestamp: Date.now()
      }));
    }
  }, []);

  /**
   * Send chat message
   */
  const sendMessage = useCallback((content, participantId, participantName) => {
    const message = {
      id: `msg_${Date.now()}`,
      content,
      participantId,
      participantName,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, message]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        ...message
      }));
    }

    return message;
  }, []);

  /**
   * Start recording session
   */
  const startRecording = useCallback((sessionId) => {
    setSessions(prev =>
      prev.map(s => s.id === sessionId
        ? { ...s, recordingEnabled: true, recordingData: { startTime: Date.now(), events: [] } }
        : s
      )
    );
  }, []);

  /**
   * Stop recording
   */
  const stopRecording = useCallback((sessionId) => {
    setSessions(prev =>
      prev.map(s => s.id === sessionId
        ? { ...s, recordingEnabled: false }
        : s
      )
    );
  }, []);

  /**
   * Playback recorded session
   */
  const playbackSession = useCallback((sessionId, speed = 1) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.recordingData) return null;

    return {
      sessionId,
      duration: session.duration,
      recordedAt: session.createdAt,
      playbackSpeed: speed,
      events: session.recordingData.events || []
    };
  }, [sessions]);

  /**
   * Get session statistics
   */
  const getSessionStats = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;

    return {
      sessionId,
      initiator: session.initiator.name,
      participants: session.participants.length,
      duration: session.duration,
      startTime: new Date(session.createdAt).toLocaleString(),
      endTime: session.endedAt ? new Date(session.endedAt).toLocaleString() : 'In Progress',
      totalLines: sharedCode.split('\n').length,
      recordingEnabled: session.recordingEnabled
    };
  }, [sessions, sharedCode]);

  return {
    sessions,
    activeSession,
    participants,
    cursorPositions,
    sharedCode,
    sessionStatus,
    messages,
    createSession,
    joinSession,
    endSession,
    updateCursorPosition,
    syncCode,
    sendMessage,
    startRecording,
    stopRecording,
    playbackSession,
    getSessionStats,
    isSessionActive: sessionStatus === 'active'
  };
}
