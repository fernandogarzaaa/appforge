/**
 * WebSocket Event Handler: Get Session State
 * Retrieve complete session state for new participant or refresh
 */

import { logger } from '../../config/logger.js';

export async function getSessionState(sessionManager, data, callback) {
  try {
    const { sessionId } = data;

    if (!sessionId) {
      return callback?.({
        success: false,
        error: 'Missing sessionId'
      });
    }

    const session = await sessionManager.getSession(sessionId);

    if (!session) {
      return callback?.({
        success: false,
        error: 'Session not found'
      });
    }

    callback?.({
      success: true,
      session: {
        id: session.id,
        projectId: session.projectId,
        state: {
          code: session.state.code,
          language: session.state.language,
          version: session.state.version,
          lastModified: session.state.lastModified,
          lastModifiedBy: session.state.lastModifiedBy
        },
        participants: session.participants.map(p => ({
          userId: p.userId,
          username: p.username,
          avatar: p.avatar,
          cursor: p.cursor,
          selection: p.selection,
          isActive: p.isActive
        })),
        settings: session.settings,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      }
    });

    logger.debug(`Retrieved session state: ${sessionId}`);
  } catch (error) {
    logger.error('Get session state error:', error);
    callback?.({
      success: false,
      error: error.message
    });
  }
}

export default getSessionState;
