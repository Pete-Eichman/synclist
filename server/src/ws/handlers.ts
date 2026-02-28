import { WebSocket } from 'ws';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as queries from '../db/queries';
import { RoomMap, broadcast } from './rooms';

// --- Action type definitions ---

export type ActionType =
  | 'item_added'
  | 'item_checked'
  | 'item_unchecked'
  | 'item_deleted'
  | 'item_reordered';

interface BaseAction {
  type: ActionType;
  listId: string;
  deviceId: string;
}

export interface ItemAddedAction extends BaseAction {
  type: 'item_added';
  payload: { text: string; position: number };
}

export interface ItemCheckedAction extends BaseAction {
  type: 'item_checked' | 'item_unchecked';
  payload: { id: string };
}

export interface ItemDeletedAction extends BaseAction {
  type: 'item_deleted';
  payload: { id: string };
}

export interface ItemReorderedAction extends BaseAction {
  type: 'item_reordered';
  payload: { items: { id: string; position: number }[] };
}

export type Action =
  | ItemAddedAction
  | ItemCheckedAction
  | ItemDeletedAction
  | ItemReorderedAction;

// --- Action handlers ---
// Each handler persists the change, then broadcasts the result to the rest of the room.
// Broadcasting the persisted record (not just the raw action) ensures all clients share
// the same server-assigned IDs and timestamps.

export async function handleItemAdded(
  ws: WebSocket,
  action: ItemAddedAction,
  pool: Pool,
  rooms: RoomMap,
): Promise<void> {
  const item = await queries.addItem(pool, {
    id: uuidv4(),
    listId: action.listId,
    text: action.payload.text,
    position: action.payload.position,
    createdBy: action.deviceId,
  });

  // Echo back to sender with the server-assigned id, broadcast to everyone else
  ws.send(JSON.stringify({ type: 'item_added', payload: item }));
  broadcast(rooms, action.listId, { type: 'item_added', payload: item }, ws);
}

export async function handleItemChecked(
  ws: WebSocket,
  action: ItemCheckedAction,
  pool: Pool,
  rooms: RoomMap,
): Promise<void> {
  const checked = action.type === 'item_checked';
  const item = await queries.setItemChecked(pool, action.payload.id, checked);
  if (!item) return; // item was deleted by another client — silently drop

  broadcast(rooms, action.listId, { type: action.type, payload: item }, ws);
}

export async function handleItemDeleted(
  ws: WebSocket,
  action: ItemDeletedAction,
  pool: Pool,
  rooms: RoomMap,
): Promise<void> {
  await queries.deleteItem(pool, action.payload.id);
  broadcast(rooms, action.listId, { type: 'item_deleted', payload: { id: action.payload.id } }, ws);
}

export async function handleItemReordered(
  ws: WebSocket,
  action: ItemReorderedAction,
  pool: Pool,
  rooms: RoomMap,
): Promise<void> {
  await queries.reorderItems(pool, action.payload.items);
  broadcast(rooms, action.listId, { type: 'item_reordered', payload: action.payload }, ws);
}

// --- Main message dispatcher ---

export async function handleMessage(
  ws: WebSocket,
  raw: string,
  pool: Pool,
  rooms: RoomMap,
): Promise<void> {
  let action: Action;

  try {
    action = JSON.parse(raw) as Action;
  } catch {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    return;
  }

  if (!action.type || !action.listId || !action.deviceId) {
    ws.send(JSON.stringify({ type: 'error', message: 'Missing required fields' }));
    return;
  }

  try {
    switch (action.type) {
      case 'item_added':
        await handleItemAdded(ws, action as ItemAddedAction, pool, rooms);
        break;
      case 'item_checked':
      case 'item_unchecked':
        await handleItemChecked(ws, action as ItemCheckedAction, pool, rooms);
        break;
      case 'item_deleted':
        await handleItemDeleted(ws, action as ItemDeletedAction, pool, rooms);
        break;
      case 'item_reordered':
        await handleItemReordered(ws, action as ItemReorderedAction, pool, rooms);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown action type' }));
    }
  } catch (err) {
    console.error('Error handling action:', action.type, err);
    ws.send(JSON.stringify({ type: 'error', message: 'Server error' }));
  }
}
