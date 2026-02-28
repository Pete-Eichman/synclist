import { WebSocket } from 'ws';
import { Pool } from 'pg';
import { createRoomMap, joinRoom } from './rooms';
import { handleMessage } from './handlers';

// --- Helpers ---

function mockClient(): WebSocket {
  return { readyState: WebSocket.OPEN, send: jest.fn() } as unknown as WebSocket;
}

function sentMessages(ws: WebSocket): unknown[] {
  return (ws.send as jest.Mock).mock.calls.map(([msg]) => JSON.parse(msg));
}

// Mock the queries module so tests never touch a real database
jest.mock('../db/queries', () => ({
  addItem: jest.fn(),
  setItemChecked: jest.fn(),
  deleteItem: jest.fn(),
  reorderItems: jest.fn(),
}));

import * as queries from '../db/queries';
const mockPool = {} as Pool;

// --- Tests ---

describe('handleMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends an error for invalid JSON', async () => {
    const ws = mockClient();
    const rooms = createRoomMap();

    await handleMessage(ws, 'not json', mockPool, rooms);

    expect(sentMessages(ws)[0]).toMatchObject({ type: 'error' });
  });

  it('sends an error for a message missing required fields', async () => {
    const ws = mockClient();
    const rooms = createRoomMap();

    await handleMessage(ws, JSON.stringify({ type: 'item_added' }), mockPool, rooms);

    expect(sentMessages(ws)[0]).toMatchObject({ type: 'error' });
  });

  describe('item_added', () => {
    it('persists the item and echoes it back to the sender', async () => {
      const savedItem = { id: 'server-uuid', text: 'Milk', position: 0, list_id: 'list-1' };
      (queries.addItem as jest.Mock).mockResolvedValue(savedItem);

      const ws = mockClient();
      const rooms = createRoomMap();
      joinRoom(rooms, 'list-1', ws);

      await handleMessage(
        ws,
        JSON.stringify({
          type: 'item_added',
          listId: 'list-1',
          deviceId: 'device-1',
          payload: { text: 'Milk', position: 0 },
        }),
        mockPool,
        rooms,
      );

      expect(queries.addItem).toHaveBeenCalledTimes(1);
      expect(sentMessages(ws)[0]).toMatchObject({ type: 'item_added', payload: savedItem });
    });

    it('broadcasts the new item to other clients in the room', async () => {
      const savedItem = { id: 'server-uuid', text: 'Eggs', position: 1 };
      (queries.addItem as jest.Mock).mockResolvedValue(savedItem);

      const sender = mockClient();
      const receiver = mockClient();
      const rooms = createRoomMap();
      joinRoom(rooms, 'list-1', sender);
      joinRoom(rooms, 'list-1', receiver);

      await handleMessage(
        sender,
        JSON.stringify({
          type: 'item_added',
          listId: 'list-1',
          deviceId: 'device-1',
          payload: { text: 'Eggs', position: 1 },
        }),
        mockPool,
        rooms,
      );

      expect(sentMessages(receiver)[0]).toMatchObject({ type: 'item_added', payload: savedItem });
    });
  });

  describe('item_checked', () => {
    it('persists the updated item and broadcasts it', async () => {
      const updated = { id: 'item-1', checked: true };
      (queries.setItemChecked as jest.Mock).mockResolvedValue(updated);

      const sender = mockClient();
      const receiver = mockClient();
      const rooms = createRoomMap();
      joinRoom(rooms, 'list-1', sender);
      joinRoom(rooms, 'list-1', receiver);

      await handleMessage(
        sender,
        JSON.stringify({
          type: 'item_checked',
          listId: 'list-1',
          deviceId: 'device-1',
          payload: { id: 'item-1' },
        }),
        mockPool,
        rooms,
      );

      expect(queries.setItemChecked).toHaveBeenCalledWith(mockPool, 'item-1', true);
      expect(sentMessages(receiver)[0]).toMatchObject({ type: 'item_checked', payload: updated });
    });

    it('does nothing if the item no longer exists', async () => {
      (queries.setItemChecked as jest.Mock).mockResolvedValue(null);

      const sender = mockClient();
      const receiver = mockClient();
      const rooms = createRoomMap();
      joinRoom(rooms, 'list-1', sender);
      joinRoom(rooms, 'list-1', receiver);

      await handleMessage(
        sender,
        JSON.stringify({
          type: 'item_checked',
          listId: 'list-1',
          deviceId: 'device-1',
          payload: { id: 'gone-item' },
        }),
        mockPool,
        rooms,
      );

      expect(receiver.send).not.toHaveBeenCalled();
    });
  });

  describe('item_deleted', () => {
    it('deletes the item and broadcasts the id', async () => {
      (queries.deleteItem as jest.Mock).mockResolvedValue(undefined);

      const sender = mockClient();
      const receiver = mockClient();
      const rooms = createRoomMap();
      joinRoom(rooms, 'list-1', sender);
      joinRoom(rooms, 'list-1', receiver);

      await handleMessage(
        sender,
        JSON.stringify({
          type: 'item_deleted',
          listId: 'list-1',
          deviceId: 'device-1',
          payload: { id: 'item-1' },
        }),
        mockPool,
        rooms,
      );

      expect(queries.deleteItem).toHaveBeenCalledWith(mockPool, 'item-1');
      expect(sentMessages(receiver)[0]).toMatchObject({
        type: 'item_deleted',
        payload: { id: 'item-1' },
      });
    });
  });

  describe('item_reordered', () => {
    it('persists the new order and broadcasts it', async () => {
      (queries.reorderItems as jest.Mock).mockResolvedValue(undefined);

      const sender = mockClient();
      const receiver = mockClient();
      const rooms = createRoomMap();
      joinRoom(rooms, 'list-1', sender);
      joinRoom(rooms, 'list-1', receiver);

      const reorderPayload = { items: [{ id: 'a', position: 0 }, { id: 'b', position: 1 }] };

      await handleMessage(
        sender,
        JSON.stringify({
          type: 'item_reordered',
          listId: 'list-1',
          deviceId: 'device-1',
          payload: reorderPayload,
        }),
        mockPool,
        rooms,
      );

      expect(queries.reorderItems).toHaveBeenCalledWith(mockPool, reorderPayload.items);
      expect(sentMessages(receiver)[0]).toMatchObject({
        type: 'item_reordered',
        payload: reorderPayload,
      });
    });
  });
});
