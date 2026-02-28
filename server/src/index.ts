import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import pool from './db/pool';
import { createListRouter } from './routes/lists';
import { createRoomMap, joinRoom, leaveRoom } from './ws/rooms';
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

wss.on('connection', (ws, req) => {
  // Clients connect via ws://host?listId=<id>&deviceId=<id>
  const { query } = parse(req.url ?? '', true);
  const listId = query.listId as string | undefined;

  if (!listId) {
    ws.close(1008, 'listId is required');
    return;
  }

  joinRoom(rooms, listId, ws);

  ws.on('message', (data) => {
    handleMessage(ws, data.toString(), pool, rooms);
  });

  ws.on('close', () => {
    leaveRoom(rooms, listId, ws);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server, wss };
