/**
 * WebSocket Event Handler: Join Session
 * User joins collaborative session/room
 */

import { logger } from '../../config/logger.js';

export async function joinSession(io, socket, sessionManager, data, callback) {
  try {
    const { sessionId, projectId } = data;

    if (!sessionId || !projectId) {
      return callback?.({
        success: false,
        error: 'Missing sessionId or projectId'
      });
    }

    // Create or get session
    let session;
    try {
      session = await sessionManager.getSession(sessionId);
    } catch (error) {
      // Session doesn't exist, create new one
      session = await sessionManager.createSession(projectId, {
        initialCode: data.initialCode,
        language: data.language
      });
    }

    // Add user to session
    await sessionManager.joinSession(sessionId, socket.userId, {
      username: socket.user?.username,
      avatar: socket.user?.avatar
    });

    // Join socket.io room
    socket.join(sessionId);
    socket.sessionId = sessionId;

    // Notify all participants in room
    io.to(sessionId).emit('participant-joined', {
      userId: socket.userId,
      username: socket.user?.username,
      avatar: socket.user?.avatar,
      timestamp: new Date(),
      totalParticipants: session.participants.length
    });

    logger.info(`👤 ${socket.user?.username} joined session ${sessionId}`);

    callback?.({
      success: true,
      session: {
        id: session.id,
        projectId: session.projectId,
        state: session.state,
        participants: session.participants,
        settings: session.settings
      },
      socketId: socket.id
    });
  } catch (error) {
    logger.error('Join session error:', error);
    callback?.({
      success: false,
      error: error.message
    });
  }
}

export default joinSession;
