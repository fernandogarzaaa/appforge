let ioInstance = null;

export function setIO(io) {
  ioInstance = io;
}

export function emitEvent(event, payload) {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
}

export function emitToRoom(roomId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(roomId).emit(event, payload);
}
