-- SyncList database schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS lists (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  join_code   CHAR(6)     NOT NULL UNIQUE,
  created_by  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  text        TEXT        NOT NULL,
  checked     BOOLEAN     NOT NULL DEFAULT FALSE,
  position    INTEGER     NOT NULL,
  created_by  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep position values stable and queryable
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id, position);
