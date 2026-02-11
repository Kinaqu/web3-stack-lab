# Services Setup

This compose stack runs the operational backend services for the L2 devnet:

- **Postgres** (indexing storage)
- **Indexer** (chain → DB pipeline)
- **API** (read interface for indexed data)
- **Faucet** (test ETH distribution)
- **Prometheus** (metrics collection)
- **Grafana** (dashboards)
- **node-exporter** (host metrics)
- **postgres-exporter** (DB metrics)

> [!NOTE]
> Together these services simulate a production-like rollup infra environment.

## Architecture Role

This stack provides:
- **Indexed chain state**
- **RPC-independent read layer**
- **Observability**
- **Operational recovery surface**

The OP Stack node itself runs separately in `infra/l2-node`.

## Services

### Postgres
Persistent storage for indexed chain data.

**Port:** `5432`

**Tables:**
- `blocks`
- `transactions`
- `indexer_state`
- `schema_migrations`

### Indexer
Indexes L2 blocks and transactions into Postgres.

**Responsibilities:**
- Read blocks from L2 RPC
- Store blocks + transactions
- Maintain checkpoint
- Handle short reorgs
- Fetch receipts → status

**Env Vars:**
- `DATABASE_URL`
- `L2_RPC_URL`
- `CONFIRMATIONS`
- `REORG_SAFETY`
- `POLL_INTERVAL_MS`

### API
HTTP interface for indexed chain data.

**Port:** `3001`

**Endpoints:**
- `GET /health`
- `GET /stats`
- `GET /tx/:hash`

### Faucet
Test ETH distribution service.

**Port:** `3002`

---

## Run

From this directory:

```bash
docker compose up -d --build
```

**Check logs:**

```bash
docker compose logs -f
```

---

## Health Checks

### API Health
```bash
curl http://localhost:3001/health
```

### Stats
```bash
curl http://localhost:3001/stats
```

---

## Troubleshooting

### Indexer not progressing
**Check:**
- L2 RPC reachable from container
- Postgres healthy
- Confirmations not too large

```bash
docker compose logs indexer
```

### RPC not reachable
If using host RPC, ensure `extra_hosts` is configured:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### Reset database
```bash
docker compose down -v
docker compose up -d --build
```