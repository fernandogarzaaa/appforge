// deno-lint-ignore-file
// @ts-nocheck
/**
 * Real-time Collaboration Service
 * WebSocket-based collaboration with presence awareness
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// In-memory storage for active sessions (in production, use Redis)
const collaborationSessions = new Map();
const userPresence = new Map();

interface CollaborationSession {
  projectId: string;
  participants: Set<string>;
  createdAt: Date;
  lastActivity: Date;
}

interface PresenceInfo {
  userId: string;
  userName: string;
  email: string;
  cursor?: { x: number; y: number };
  currentFile?: string;
  color: string;
  status: 'active' | 'idle' | 'away';
  lastSeen: Date;
}

/**
 * Initialize or join a collaboration session
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, action, data } = await req.json();

    if (!projectId) {
      return Response.json({ error: 'Missing projectId' }, { status: 400 });
    }

    switch (action) {
      case 'join': {
        // Join collaboration session
        let session = collaborationSessions.get(projectId);
        
        if (!session) {
          session = {
            projectId,
            participants: new Set(),
            createdAt: new Date(),
            lastActivity: new Date()
          };
          collaborationSessions.set(projectId, session);
        }

        session.participants.add(user.id);
        session.lastActivity = new Date();

        // Set user presence
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const userColor = colors[session.participants.size % colors.length];

        userPresence.set(user.id, {
          userId: user.id,
          userName: user.name || user.email.split('@')[0],
          email: user.email,
          color: userColor,
          status: 'active',
          lastSeen: new Date()
        });

        // Get all participants
        const participants = Array.from(session.participants)
          .map(id => userPresence.get(id))
          .filter(Boolean);

        return Response.json({
          success: true,
          sessionId: projectId,
          participants,
          yourColor: userColor
        }, { status: 200 });
      }

      case 'leave': {
        // Leave collaboration session
        const session = collaborationSessions.get(projectId);
        if (session) {
          session.participants.delete(user.id);
          
          if (session.participants.size === 0) {
            collaborationSessions.delete(projectId);
          }
        }

        userPresence.delete(user.id);

        return Response.json({ success: true }, { status: 200 });
      }

      case 'updateCursor': {
        // Update cursor position
        const presence = userPresence.get(user.id);
        if (presence) {
          presence.cursor = data.cursor;
          presence.currentFile = data.currentFile;
          presence.lastSeen = new Date();
          presence.status = 'active';

          // Broadcast to other participants
          const session = collaborationSessions.get(projectId);
          if (session) {
            const others = Array.from(session.participants)
              .filter(id => id !== user.id)
              .map(id => userPresence.get(id))
              .filter(Boolean);

            return Response.json({
              success: true,
              broadcast: {
                type: 'cursor',
                user: presence,
                data: data.cursor
              }
            }, { status: 200 });
          }
        }

        return Response.json({ success: true }, { status: 200 });
      }

      case 'updatePresence': {
        // Update user status
        const presence = userPresence.get(user.id);
        if (presence) {
          if (data.status) presence.status = data.status;
          if (data.currentFile) presence.currentFile = data.currentFile;
          presence.lastSeen = new Date();
        }

        return Response.json({ success: true }, { status: 200 });
      }

      case 'getParticipants': {
        // Get current participants
        const session = collaborationSessions.get(projectId);
        if (!session) {
          return Response.json({ participants: [] }, { status: 200 });
        }

        const participants = Array.from(session.participants)
          .map(id => userPresence.get(id))
          .filter(Boolean);

        return Response.json({ participants }, { status: 200 });
      }

      case 'sendMessage': {
        // Send chat message to participants
        const session = collaborationSessions.get(projectId);
        if (!session) {
          return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        const message = {
          id: crypto.randomUUID(),
          userId: user.id,
          userName: user.name || user.email,
          message: data.message,
          timestamp: new Date(),
          type: data.type || 'text'
        };

        // In production, store messages in database
        // For now, just broadcast
        return Response.json({
          success: true,
          message,
          broadcast: message
        }, { status: 200 });
      }

      case 'lockFile': {
        // Lock a file for editing
        const session = collaborationSessions.get(projectId);
        if (!session) {
          return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        // In production, implement file locking logic
        return Response.json({
          success: true,
          lockedBy: user.id,
          file: data.file
        }, { status: 200 });
      }

      case 'unlockFile': {
        // Unlock a file
        const session = collaborationSessions.get(projectId);
        if (!session) {
          return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        return Response.json({
          success: true,
          file: data.file
        }, { status: 200 });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Collaboration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Cleanup inactive sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  const timeout = 30 * 60 * 1000; // 30 minutes

  for (const [projectId, session] of collaborationSessions.entries()) {
    if (now.getTime() - session.lastActivity.getTime() > timeout) {
      collaborationSessions.delete(projectId);
    }
  }

  // Cleanup inactive users
  for (const [userId, presence] of userPresence.entries()) {
    if (now.getTime() - presence.lastSeen.getTime() > timeout) {
      userPresence.delete(userId);
    }
  }
}, 5 * 60 * 1000);
