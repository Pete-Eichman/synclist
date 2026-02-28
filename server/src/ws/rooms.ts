import { WebSocket } from 'ws';

// Maps a list ID to the set of clients currently connected to that list's room
export type RoomMap = Map<string, Set<WebSocket>>;

export function createRoomMap(): RoomMap {
  return new Map();
}

export function joinRoom(rooms: RoomMap, listId: string, ws: WebSocket): void {
  if (!rooms.has(listId)) {
    rooms.set(listId, new Set());
  }
  rooms.get(listId)!.add(ws);
}

export function leaveRoom(rooms: RoomMap, listId: string, ws: WebSocket): void {
  const room = rooms.get(listId);
  if (!room) return;

  room.delete(ws);

  if (room.size === 0) {
    rooms.delete(listId);
  }
}

// Broadcasts a message to everyone in the room except the sender
export function broadcast(
  rooms: RoomMap,
  listId: string,
  message: object,
  excludeWs?: WebSocket,
): void {
  const room = rooms.get(listId);
  if (!room) return;

  const payload = JSON.stringify(message);

  for (const client of room) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
