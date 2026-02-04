/**
 * WebSocket Event Handler: Code Change
 * Broadcast code edits to all participants in real-time
 */

import { logger } from '../../config/logger.js';

export async function codeChange(io, socket, sessionManager, data, callback) {
  try {
    const { sessionId, change, language, version } = data;
    const userId = socket.userId;

    if (!sessionId || !change) {
      return callback?.({
        success: false,
        error: 'Missing sessionId or change data'
      });
    }

    // Validate change structure
    if (!change.content && change.delta === undefined) {
      return callback?.({
        success: false,
        error: 'Invalid change format'
      });
    }

    // Update session state with new code
    const updatedSession = await sessionManager.updateSessionState(sessionId, {
      code: change.content || change.delta,
      language: language,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
      clientVersion: version
    });

    // Broadcast change to all participants (including sender for confirmation)
    io.to(sessionId).emit('code-updated', {
      userId,
      username: socket.user?.username,
      change: {
        content: change.content,
        delta: change.delta,
        position: change.position,
        type: change.type // 'insert', 'delete', 'replace'
      },
      language,
      version: updatedSession.state.version,
      timestamp: new Date()
    });

    logger.info(`📝 Code changed in session ${sessionId} by ${userId}`);

    callback?.({
      success: true,
      version: updatedSession.state.version,
      timestamp: updatedSession.state.lastModified
    });
  } catch (error) {
    logger.error('Code change error:', error);
    callback?.({
      success: false,
      error: error.message
    });
  }
}

export default codeChange;
