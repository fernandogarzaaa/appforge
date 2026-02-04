/**
 * WebSocket Event Handler: Leave Session
 * User leaves collaborative room
 */

import { logger } from '../../config/logger.js';

export async function leaveSession(io, socket, sessionManager, data, callback) {
  try {
    const { sessionId } = data;
    const userId = socket.userId;

    if (!sessionId) {
      return callback?.({
        success: false,
        error: 'Missing sessionId'
      });
    }

    // Remove user from session
    const updatedSession = await sessionManager.leaveSession(sessionId, userId);

    // Leave socket.io room
    socket.leave(sessionId);
    socket.sessionId = null;

    // Notify remaining participants
    if (updatedSession) {
      io.to(sessionId).emit('participant-left', {
        userId,
        username: socket.user?.username,
        timestamp: new Date(),
        totalParticipants: updatedSession.participants.length
      });
    }

    logger.info(`👤 User ${userId} left session ${sessionId}`);

    callback?.({
      success: true,
      message: 'Left session successfully'
    });
  } catch (error) {
    logger.error('Leave session error:', error);
    callback?.({
      success: false,
      error: error.message
    });
  }
}

export default leaveSession;
