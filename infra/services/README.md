# Services Compose

This compose stack runs the operational backend services for the L2 devnet:

- Postgres (indexing storage)
- Indexer (chain → DB pipeline)
- API (read interface for indexed data)
- Faucet (test ETH distribution)

Prometheus (metrics collection)

Grafana (dashboards)

node-exporter (host metrics)

postgres-exporter (DB metrics)

Together these services simulate a production-like rollup infra environment.

Architecture role

This stack provides:

indexed chain state

RPC-independent read layer

observability

operational recovery surface

The OP Stack node itself runs separately in:
infra/l2-node


Services
Postgres

Persistent storage for indexed chain data.

Tables:
- blocks
- transactions
- indexer_state
- schema_migrations

Port:
5432


Indexer

Indexes L2 blocks and transactions into Postgres.

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



HTTP interface for indexed chain data.

Endpoints:
GET /health
GET /stats
GET /tx/:hash



Port:
3001



Test ETH distribution service.

Port:
3002



---

## Run

From this directory:

docker compose up -d --build
```

Check logs:

docker compose logs -f



---

## Health Checks

API:
curl http://localhost:3001/health

**Stats:**
```bash
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