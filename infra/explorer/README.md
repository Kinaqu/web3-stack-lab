# Explorer (Blockscout)

This folder contains helper compose files and overrides for running Blockscout against the local OP Stack L2.

## What you get
- Blockscout UI (Explorer)
- Indexer (inside backend)
- Stats service (separate port)
- Visualizer service (separate port)

## Prerequisites
- Running L2 node with RPC on the host:
  - L2 HTTP RPC: `http://localhost:8545`
  - (Optional) L2 WS: `ws://localhost:8546`
- Blockscout submodule is initialized:
  - `infra/blockscout` (submodule)

## Initialize submodule

From repo root:

```bash
git submodule update --init --recursive
```

## Configuration

We keep the Blockscout submodule clean (no local edits inside it).
All environment/host/CORS adjustments are done via override files in this folder.

### Files

- `blockscout.override.env.example` → copy to `blockscout.override.env` (not committed)
- `docker-compose.linux-host-gateway.yml` → enables `host.docker.internal` inside containers
- `docker-compose.blockscout.override.yml` → overrides frontend/backend/stats env via compose

### Local override env

1. Create a local env file:
   ```bash
   cp infra/explorer/blockscout.override.env.example infra/explorer/blockscout.override.env
   ```
2. Edit it:

   `BLOCKSCOUT_HOST` should be the hostname/IP you use from your browser (IMPORTANT if you open UI from a laptop)

   Example: `BLOCKSCOUT_HOST=192.168.1.50`

   `BLOCKSCOUT_DB_PASSWORD` must match the DB password used by your Blockscout DB container

   If you already have running volumes, keep it unchanged to avoid reindexing.

## Run Blockscout

From repo root:

```bash
DOCKER_REPO=blockscout-optimism docker compose \
  --env-file infra/explorer/blockscout.override.env \
  -f infra/blockscout/docker-compose/geth.yml \
  -f infra/explorer/docker-compose.linux-host-gateway.yml \
  -f infra/explorer/docker-compose.blockscout.override.yml \
  up -d
```

Force recreate (if you changed env):

```bash
DOCKER_REPO=blockscout-optimism docker compose \
  --env-file infra/explorer/blockscout.override.env \
  -f infra/blockscout/docker-compose/geth.yml \
  -f infra/explorer/docker-compose.linux-host-gateway.yml \
  -f infra/explorer/docker-compose.blockscout.override.yml \
  up -d --force-recreate
```

## Access

- Explorer UI: `http://<BLOCKSCOUT_HOST>/`
- Stats API: `http://<BLOCKSCOUT_HOST>:8080/`
- Visualizer API: `http://<BLOCKSCOUT_HOST>:8081/`

## Troubleshooting

### UI loads but API requests are refused

If you open UI from a laptop and frontend env uses localhost, your browser will call your laptop instead of the devbox.
Fix: set `BLOCKSCOUT_HOST` to the devbox IP/DNS in `blockscout.override.env` and recreate containers.

### CORS error for Stats (8080)

Stats runs on a different origin (port 8080). CORS must allow the UI origin.
We set:

```env
STATS__SERVER__HTTP__CORS__ENABLED=true
STATS__SERVER__HTTP__CORS__ALLOWED_ORIGIN=http://<BLOCKSCOUT_HOST>
```

via `docker-compose.blockscout.override.yml`.

### Indexer errors (Mint.TransportError :eaddrnotavail)

This usually means too much concurrency in fetchers / too many outgoing connections.
Solution: reduce batch/concurrency env vars for heavy fetchers (balances/receipts/catchup) and recreate backend.