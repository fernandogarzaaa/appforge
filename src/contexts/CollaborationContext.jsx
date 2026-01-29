/**
 * Collaboration Context - Real-time WebSocket State Management
 * Manages WebSocket connection, presence, cursors, and document editing
 */

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { getWebSocketService } from '@/services/webSocketService';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { useActivity } from '@/contexts/ActivityContext';

const CollaborationContext = createContext();

export function CollaborationProvider({ children }) {
  const { user } = useBackendAuth();
  const { logActivity } = useActivity();
  const wsService = useRef(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursorPositions, setCursorPositions] = useState({});
  const [messages, setMessages] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [documentVersion, setDocumentVersion] = useState(0);
  const [editHistory, setEditHistory] = useState([]);
  const [error, setError] = useState(null);

  // Initialize WebSocket service
  useEffect(() => {
    wsService.current = getWebSocketService();
  }, []);

  // Connect to collaboration server
  const connectToDocument = useCallback(
    async (projectId, documentId, wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/collaborate`) => {
      try {
        if (!user?.id) {
          throw new Error('User not authenticated');
        }

        const ws = wsService.current;

        // Set up event listeners before connecting
        const unsubscribeFuncs = [];

        unsubscribeFuncs.push(
          ws.on('connected', () => {
            setIsConnected(true);
            setError(null);
            logActivity({
              type: 'collaboration_connected',
              title: 'Collaboration Connected',
              description: `Connected to real-time collaboration on document`,
              severity: 'success',
            });
          })
        );

        unsubscribeFuncs.push(
          ws.on('disconnected', () => {
            setIsConnected(false);
            logActivity({
              type: 'collaboration_disconnected',
              title: 'Collaboration Disconnected',
              description: 'Lost connection to real-time collaboration',
              severity: 'warning',
            });
          })
        );

        unsubscribeFuncs.push(
          ws.on('presence-changed', ({ activeUsers: users }) => {
            setActiveUsers(users);
          })
        );

        unsubscribeFuncs.push(
          ws.on('cursor-moved', (cursorData) => {
            setCursorPositions((prev) => ({
              ...prev,
              [cursorData.userId]: cursorData,
            }));
          })
        );

        unsubscribeFuncs.push(
          ws.on('user-joined', ({ userId, userName }) => {
            logActivity({
              type: 'user_joined_collaboration',
              title: 'User Joined',
              description: `${userName} joined the collaboration session`,
              severity: 'info',
            });
          })
        );

        unsubscribeFuncs.push(
          ws.on('user-left', ({ userId }) => {
            setCursorPositions((prev) => {
              const newPositions = { ...prev };
              delete newPositions[userId];
              return newPositions;
            });
          })
        );

        unsubscribeFuncs.push(
          ws.on('document-edited', ({ userId, operation, version }) => {
            setDocumentVersion(version);
            setEditHistory((prev) => [...prev, { userId, operation, version }]);
          })
        );

        unsubscribeFuncs.push(
          ws.on('message', (messageData) => {
            setMessages((prev) => [...prev, messageData]);
          })
        );

        unsubscribeFuncs.push(
          ws.on('error', (err) => {
            setError(err.message || 'WebSocket error occurred');
          })
        );

        // Connect to server
        await ws.connect(wsUrl, user.id, user.name || user.email, projectId, documentId);

        setCurrentDocument({ projectId, documentId });

        // Cleanup function
        return () => {
          unsubscribeFuncs.forEach((fn) => fn());
        };
      } catch (err) {
        setError(err.message);
        console.error('Failed to connect to collaboration:', err);
      }
    },
    [user, logActivity]
  );

  // Disconnect from document
  const disconnect = useCallback(() => {
    if (wsService.current) {
      wsService.current.disconnect();
      setIsConnected(false);
      setActiveUsers([]);
      setCursorPositions({});
      setMessages([]);
      setCurrentDocument(null);
    }
  }, []);

  // Send edit operation
  const sendEdit = useCallback(
    (operation) => {
      if (wsService.current?.isConnected) {
        wsService.current.sendEdit(operation, documentVersion);
      }
    },
    [documentVersion]
  );

  // Send cursor position
  const sendCursor = useCallback((x, y, line, column) => {
    if (wsService.current?.isConnected) {
      wsService.current.sendCursor(x, y, line, column);
    }
  }, []);

  // Send message
  const sendMessage = useCallback((content, type = 'text') => {
    if (wsService.current?.isConnected) {
      wsService.current.sendMessage(content, type);
    }
  }, []);

  // Request document sync
  const requestSync = useCallback(() => {
    if (wsService.current?.isConnected) {
      wsService.current.requestSync();
    }
  }, []);

  const value = {
    // Connection state
    isConnected,
    error,

    // Document info
    currentDocument,
    documentVersion,
    editHistory,

    // Presence & cursors
    activeUsers,
    cursorPositions,

    // Messages
    messages,

    // Actions
    connectToDocument,
    disconnect,
    sendEdit,
    sendCursor,
    sendMessage,
    requestSync,

    // WebSocket service (for advanced usage)
    wsService: wsService.current,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

/**
 * Hook to use collaboration context
 */
export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
}

export default CollaborationContext;
