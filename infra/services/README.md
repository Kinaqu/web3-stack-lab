# Services Compose

This compose stack runs the operational backend services for the L2 devnet:

- Postgres (indexing storage)
- Indexer (chain → DB pipeline)
- API (read interface for indexed data)
- Faucet (test ETH distribution)

These services together simulate a production-like infra layer for a rollup.

---

## Services

### Postgres
Stores indexed chain data.

Tables:
- blocks
- transactions
- indexer_state
- schema_migrations

Port:
5432


---

### Indexer
Indexes L2 blocks and transactions from RPC into Postgres.

Responsibilities:
- read blocks from L2 RPC
- store blocks + transactions
- maintain checkpoint
- handle short reorgs
- fetch receipts → status

Env:
DATABASE_URL
L2_RPC_URL
CONFIRMATIONS
REORG_SAFETY
POLL_INTERVAL_MS



---

### API
HTTP interface over indexed data.

Endpoints:
GET /health
GET /stats
GET /tx/:hash



Port:
3001



---

### Faucet
Simple test ETH distribution service.

Port:
3002



---

## Run

From this directory:

docker compose up -d --build


Check logs:

docker compose logs -f



---

## Health Checks

API:
curl http://localhost:3001/health



Stats:
curl http://localhost:3001/stats




---

## Troubleshooting

### Indexer not progressing
Check:
- L2 RPC reachable from container
- Postgres healthy
- confirmations not too large

docker compose logs indexer



---

### RPC not reachable
If using host RPC, ensure:

extra_hosts:

"host.docker.internal:host-gateway"


is configured.

---

### Reset database
docker compose down -v
docker compose up -d --build