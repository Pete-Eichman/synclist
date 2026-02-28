import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import pool from './db/pool';
import { createListRouter } from './routes/lists';
import { broadcast, createRoomMap, joinRoom, leaveRoom } from './ws/rooms';
import { handleMessage } from './ws/handlers';

const PORT = process.env.PORT ?? 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/lists', createListRouter(pool));

const server = http.createServer(app);

const wss = new WebSocketServer({ server });
const rooms = createRoomMap();

// Tracks the deviceId for each active WebSocket connection
const deviceConnections = new Map<WebSocket, string>();

wss.on('connection', (ws, req) => {
  // Clients connect via ws://host?listId=<id>&deviceId=<id>
  const { query } = parse(req.url ?? '', true);
  const listId = query.listId as string | undefined;
  const deviceId = query.deviceId as string | undefined;

  if (!listId || !deviceId) {
    ws.close(1008, 'listId and deviceId are required');
    return;
  }

  deviceConnections.set(ws, deviceId);
  joinRoom(rooms, listId, ws);
  broadcast(rooms, listId, { type: 'user_joined', payload: { deviceId } }, ws);

  ws.on('message', (data) => {
    handleMessage(ws, data.toString(), pool, rooms);
  });

  ws.on('close', () => {
    const departingDeviceId = deviceConnections.get(ws);
    deviceConnections.delete(ws);
    leaveRoom(rooms, listId, ws);
    if (departingDeviceId) {
      broadcast(rooms, listId, { type: 'user_left', payload: { deviceId: departingDeviceId } });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server, wss };
