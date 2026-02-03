# Runbooks (Stage 1)

This document describes quick troubleshooting and recovery steps for the local devnet stack.

## 1. Basic health checks

### RPC
- **Symptom:** scripts/tools cannot connect
- **Check:** RPC should respond at the configured endpoint (default planned: `http://localhost:8545`)

### Explorer
- **Symptom:** UI not loading / not syncing
- **Check:** explorer container is up; it can reach the RPC

### Indexer + DB
- **Symptom:** indexed head lags behind chain head
- **Check:** Postgres is up; indexer logs show progress; checkpoint advances

### Monitoring (later)
- Prometheus targets UP
- Grafana dashboards loading

## 2. Incident: RPC is down

### Symptoms
- Connection errors / timeouts to the RPC endpoint
- Explorer and indexer also fail

### Checks
1. Are L2 node containers running?
2. Do node logs show OOM, disk-full, or repeated panics?
3. Is the RPC port occupied by another process?

### Recovery
- Restart the L2 node stack
- If disk is full: free space / rotate logs / prune unused images & volumes
- If OOM: lower load or increase resources, then restart

## 3. Incident: Indexer lagging

### Symptoms
- `indexed_head` << `chain_head`
- API (later) returns stale data

### Checks
1. RPC errors or rate limits in indexer logs
2. Postgres availability and storage health
3. CPU/memory pressure

### Recovery
- Restart indexer
- If reorg-handling bug suspected: rollback and resync (procedure will be defined once indexer is implemented)

## 4. Incident: Faucet not dispensing

### Symptoms
- Faucet endpoint errors
- No outgoing txs or txs stuck

### Checks
1. Faucet key loaded and has balance
2. RPC reachable
3. Rate limit not blocking normal use

### Recovery
- Top up faucet
- Restart faucet service
- Adjust limits for local testing

## 5. Incident: Disk full

### Symptoms
- node/db errors with I/O failures
- services crash-looping

### Checks
- Docker disk usage and volume sizes
- Large logs or DB volumes

### Recovery
- Clear space (logs/unused images/volumes)
- Increase disk size if needed
- Add/adjust disk usage alerts (later in monitoring)
