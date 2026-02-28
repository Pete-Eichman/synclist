import { ListItem } from './api';
import * as offlineQueue from '../db/offlineQueue';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:3001';

// How long to wait before each reconnect attempt (capped at MAX_BACKOFF_MS)
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export type ServerEvent =
  | { type: 'item_added'; payload: ListItem }
  | { type: 'item_checked'; payload: ListItem }
  | { type: 'item_unchecked'; payload: ListItem }
  | { type: 'item_deleted'; payload: { id: string } }
  | { type: 'item_reordered'; payload: { items: { id: string; position: number }[] } };

type EventListener = (event: ServerEvent) => void;
type StatusListener = (status: ConnectionStatus) => void;

export interface SocketManager {
  connect: (listId: string, deviceId: string) => void;
  disconnect: () => void;
  send: (action: object) => void;
  onEvent: (listener: EventListener) => () => void;
  onStatusChange: (listener: StatusListener) => () => void;
}

export function createSocketManager(): SocketManager {
  let ws: WebSocket | null = null;
  let listId: string | null = null;
  let deviceId: string | null = null;
  let backoffMs = INITIAL_BACKOFF_MS;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let intentionalClose = false;

  const eventListeners = new Set<EventListener>();
  const statusListeners = new Set<StatusListener>();

  function emitStatus(status: ConnectionStatus) {
    statusListeners.forEach((fn) => fn(status));
  }

  function emitEvent(event: ServerEvent) {
    eventListeners.forEach((fn) => fn(event));
  }

  function openConnection() {
    if (!listId || !deviceId) return;

    intentionalClose = false;
    emitStatus('connecting');

    ws = new WebSocket(`${WS_URL}?listId=${listId}&deviceId=${deviceId}`);

    ws.onopen = () => {
      backoffMs = INITIAL_BACKOFF_MS; // reset on successful connect
      emitStatus('connected');
      // Drain any actions queued while the connection was down
      offlineQueue.flush((action) => ws?.send(JSON.stringify(action))).catch(console.error);
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as ServerEvent;
        emitEvent(event);
      } catch {
        // Malformed message from server — ignore
      }
    };

    ws.onclose = () => {
      if (intentionalClose) return;

      emitStatus('disconnected');

      // Exponential backoff reconnect
      reconnectTimer = setTimeout(() => {
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        openConnection();
      }, backoffMs);
    };

    ws.onerror = () => {
      // onclose fires immediately after onerror, so reconnect logic lives there
    };
  }

  return {
    connect(newListId, newDeviceId) {
      listId = newListId;
      deviceId = newDeviceId;
      openConnection();
    },

    disconnect() {
      intentionalClose = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      ws = null;
      emitStatus('disconnected');
    },

    send(action) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(action));
      } else {
        offlineQueue.enqueue(action).catch(console.error);
      }
    },

    onEvent(listener) {
      eventListeners.add(listener);
      return () => eventListeners.delete(listener);
    },

    onStatusChange(listener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
  };
}

// Singleton instance shared across the app
export const socketManager = createSocketManager();
