-- 0001_init.sql

CREATE TABLE IF NOT EXISTS indexer_state (
  id                SMALLINT PRIMARY KEY,
  indexed_block     BIGINT NOT NULL DEFAULT -1,
  indexed_block_hash TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- one row state
INSERT INTO indexer_state (id, indexed_block, indexed_block_hash)
VALUES (1, -1, NULL)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS blocks (
  number      BIGINT PRIMARY KEY,
  hash        TEXT NOT NULL UNIQUE,
  parent_hash TEXT NOT NULL,
  timestamp   BIGINT NOT NULL,
  tx_count    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_blocks_parent_hash ON blocks(parent_hash);

CREATE TABLE IF NOT EXISTS transactions (
  hash         TEXT PRIMARY KEY,
  block_number BIGINT NOT NULL REFERENCES blocks(number) ON DELETE CASCADE,
  "from"       TEXT NOT NULL,
  "to"         TEXT,
  nonce        BIGINT NOT NULL,
  value        TEXT NOT NULL,
  gas          BIGINT NOT NULL,
  gas_price    TEXT,
  status       SMALLINT,
  input        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_txs_block_number ON transactions(block_number);
CREATE INDEX IF NOT EXISTS idx_txs_from ON transactions("from");
CREATE INDEX IF NOT EXISTS idx_txs_to ON transactions("to");
