# SyncList

A real-time collaborative checklist app. Create a list, share a 6-character code, and edit together live — changes appear instantly on all connected devices.

<!-- Demo GIF goes here -->

## Tech Stack

**Mobile** — Expo (React Native) · TypeScript · Zustand · expo-sqlite

**Backend** — Node.js · Express · WebSockets (`ws`) · PostgreSQL

**Infrastructure** — Docker · Railway · GitHub Actions CI/CD

## Local Development

### Prerequisites

- Node.js 20+
- Docker and Docker Compose

### Run the backend

```bash
# Start Postgres + server
docker compose up

# Or run the server directly (requires a local Postgres instance)
cd server && npm install && npm run dev
```

### Run the mobile app

```bash
cd app && npm install && npx expo start
```

See [server/README.md](server/README.md) for environment variable configuration.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Mobile App (Expo)               │
│                                             │
│  REST (create/join list)                    │
│  WebSocket (real-time item sync)            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           Node.js / Express Server           │
│                                             │
│  POST /lists        GET /lists/:id          │
│  POST /lists/join                           │
│                                             │
│  WS /lists/:id  →  room management          │
│                     action broadcast        │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│              PostgreSQL (RDS)                │
└─────────────────────────────────────────────┘
```

## Project Structure

```
synclist/
├── app/          # Expo mobile app
└── server/       # Node.js backend
```
