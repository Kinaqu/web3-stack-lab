# Runbook: Indexer Lagging

## Symptoms
- Grafana: `indexer_lag_blocks` stays high or keeps increasing
- API `/stats` shows large `lag`
- `indexedHead` grows very slowly or does not move
- `/tx/:hash` returns `tx_not_found` for recent transactions (even after confirmations)

---

## What to check (fast)

### 1. Is the indexer progressing?
Compare `indexedHead` over time:

```bash
curl -s http://localhost:3001/stats | jq '.indexedHead, .rpcHead, .lag'
sleep 10
curl -s http://localhost:3001/stats | jq '.indexedHead, .rpcHead, .lag'
```

**Expected:**
- `indexedHead` increases
- `lag` decreases or stays bounded

### 2. Check indexer logs

```bash
cd infra/services
docker compose logs -n 120 indexer
```

**Look for:**
- RPC errors (timeouts, connection refused)
- DB errors (deadlocks, connection errors)
- Repeated errors on the same block number

### 3. Check API health (DB/RPC)
```bash
curl -s http://localhost:3001/health | jq .
```

**Expected:**
- `db.ok=true`
- `rpc.ok=true`

## DB checks

### Check checkpoint state
```bash
cd infra/services
docker compose exec postgres psql -U web3 -d web3stack -c "SELECT * FROM indexer_state;"
```

### Check DB growth
```bash
docker compose exec postgres psql -U web3 -d web3stack -c "SELECT COUNT(*) AS blocks FROM blocks;"
docker compose exec postgres psql -U web3 -d web3stack -c "SELECT COUNT(*) AS txs FROM transactions;"
```

## Fast recovery

### Restart indexer
```bash
cd infra/services
docker compose restart indexer
docker compose logs -n 80 indexer
```

### If RPC is unhealthy
Restart L2 node stack:
```bash
cd infra/l2-node
docker compose restart
```

## Common root causes

### RPC unreachable / slow
**Symptoms:**
- `l2_rpc_up=0` (if metrics enabled)
- Indexer logs show `ENOTFOUND`, timeouts, failed to detect network

**Fix:**
- Verify `RPC URL` in env
- Ensure `extra_hosts: host.docker.internal:host-gateway` when using host RPC
- Check L2 node is running and responsive

### DB bottleneck
**Symptoms:**
- Indexer logs show DB timeouts
- Postgres connections saturated

**Fix:**
- Increase Postgres resources (CPU/RAM/disk IOPS)
- Reduce indexing concurrency (if enabled)
- Tune pool size in indexer

### Indexer stuck on a bad block / receipt fetch issues
**Symptoms:**
- Repeating errors on the same block
- Receipt fetch failing repeatedly

**Fix:**
- Restart indexer
- Inspect failing block/tx hash in logs
- If needed, rollback a few blocks (reorg handler) or manually adjust checkpoint (devnet only)

### Confirmations too high for devnet
**Symptoms:**
- Indexer always behind even though it’s “healthy”

**Fix:**
- Reduce `CONFIRMATIONS` (e.g. 1–5 for devnet)

## Prevention

### Alert on
- `IndexerNotProgressing` (no change in `indexer_indexed_head` for 10m)
- `IndexerLagHigh` (lag > 200 blocks for 5m)

### Keep a dashboard panel for
- `indexer_indexed_head`
- `indexer_lag_blocks`
- `l2_rpc_head`

### Add resource monitoring
- Disk free %
- CPU/memory
- Postgres exporter metrics