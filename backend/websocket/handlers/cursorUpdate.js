/**
 * WebSocket Event Handler: Cursor Update
 * Real-time cursor position synchronization
 */

import { logger } from '../../config/logger.js';

export function cursorUpdate(io, socket, data) {
  try {
    const { sessionId, position, selection } = data;
    const userId = socket.userId;

    if (!sessionId || position === undefined) {
      logger.warn('Invalid cursor update data');
      return;
    }

    // Broadcast cursor position to all users in session except sender
    io.to(sessionId).emit('cursor-moved', {
      userId,
      username: socket.user?.username,
      position: {
        line: position.line || 0,
        column: position.column || 0
      },
      selection: selection || null,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Cursor update error:', error);
  }
}

export default cursorUpdate;
