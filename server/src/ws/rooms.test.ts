import { WebSocket } from 'ws';
import { createRoomMap, joinRoom, leaveRoom, broadcast } from './rooms';

// Minimal WebSocket mock — only needs readyState and send
function mockClient(readyState: number = WebSocket.OPEN): WebSocket {
  return { readyState, send: jest.fn() } as unknown as WebSocket;
}

describe('rooms', () => {
  describe('joinRoom', () => {
    it('creates a new room and adds the client', () => {
      const rooms = createRoomMap();
      const ws = mockClient();

      joinRoom(rooms, 'list-1', ws);

      expect(rooms.get('list-1')?.has(ws)).toBe(true);
    });

    it('adds a second client to an existing room', () => {
      const rooms = createRoomMap();
      const ws1 = mockClient();
      const ws2 = mockClient();

      joinRoom(rooms, 'list-1', ws1);
      joinRoom(rooms, 'list-1', ws2);

      expect(rooms.get('list-1')?.size).toBe(2);
    });
  });

  describe('leaveRoom', () => {
    it('removes the client from the room', () => {
      const rooms = createRoomMap();
      const ws = mockClient();

      joinRoom(rooms, 'list-1', ws);
      leaveRoom(rooms, 'list-1', ws);

      expect(rooms.get('list-1')).toBeUndefined();
    });

    it('deletes the room when the last client leaves', () => {
      const rooms = createRoomMap();
      const ws = mockClient();

      joinRoom(rooms, 'list-1', ws);
      leaveRoom(rooms, 'list-1', ws);

      expect(rooms.has('list-1')).toBe(false);
    });

    it('does nothing if the room does not exist', () => {
      const rooms = createRoomMap();
      const ws = mockClient();

      expect(() => leaveRoom(rooms, 'nonexistent', ws)).not.toThrow();
    });
  });

  describe('broadcast', () => {
    it('sends to all clients in the room', () => {
      const rooms = createRoomMap();
      const ws1 = mockClient();
      const ws2 = mockClient();

      joinRoom(rooms, 'list-1', ws1);
      joinRoom(rooms, 'list-1', ws2);

      broadcast(rooms, 'list-1', { type: 'item_added' });

      expect(ws1.send).toHaveBeenCalledTimes(1);
      expect(ws2.send).toHaveBeenCalledTimes(1);
    });

    it('excludes the sender from the broadcast', () => {
      const rooms = createRoomMap();
      const sender = mockClient();
      const receiver = mockClient();

      joinRoom(rooms, 'list-1', sender);
      joinRoom(rooms, 'list-1', receiver);

      broadcast(rooms, 'list-1', { type: 'item_added' }, sender);

      expect(sender.send).not.toHaveBeenCalled();
      expect(receiver.send).toHaveBeenCalledTimes(1);
    });

    it('does not send to clients that are not OPEN', () => {
      const rooms = createRoomMap();
      const closed = mockClient(WebSocket.CLOSED);
      const open = mockClient();

      joinRoom(rooms, 'list-1', closed);
      joinRoom(rooms, 'list-1', open);

      broadcast(rooms, 'list-1', { type: 'item_added' });

      expect(closed.send).not.toHaveBeenCalled();
      expect(open.send).toHaveBeenCalledTimes(1);
    });

    it('does nothing if the room does not exist', () => {
      const rooms = createRoomMap();
      expect(() => broadcast(rooms, 'nonexistent', { type: 'item_added' })).not.toThrow();
    });
  });
});
