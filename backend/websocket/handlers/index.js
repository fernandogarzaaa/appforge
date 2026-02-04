/**
 * WebSocket Event Handlers Index
 * Exports all event handler functions
 */

export { joinSession } from './joinSession.js';
export { leaveSession } from './leaveSession.js';
export { cursorUpdate } from './cursorUpdate.js';
export { codeChange } from './codeChange.js';
export { getSessionState } from './getSessionState.js';

// Additional participant events (auto-triggered by join/leave)
// - participant-joined (emitted on join)
// - participant-left (emitted on leave)
