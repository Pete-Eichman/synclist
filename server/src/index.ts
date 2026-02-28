import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT ?? 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// TODO: mount list routes here (Phase 1)

const server = http.createServer(app);

// WebSocket server — all real-time list activity goes through here
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  // TODO: room join + action handling (Phase 1)
  ws.on('close', () => {});
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server, wss };
