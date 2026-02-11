# Runbook: RPC down

## Symptoms
- `GET /health` returns `rpc.ok=false`
- Grafana: `l2_rpc_up == 0` or missing
- Indexer logs show RPC errors

## What to check
1) From host:
- Is L2 RPC reachable?
- Is the L2 node container running?

2) From containers:
- Can `api` and `indexer` resolve and reach the RPC URL?

## Quick commands
```bash
# API health
curl -s http://localhost:3001/health | jq .

# logs
cd infra/services
docker compose logs -n 80 api
docker compose logs -n 80 indexer
Fast recovery

1.Restart L2 node stack (if RPC is on host/compose):
cd infra/l2-node
docker compose restart



2.Restart API/Indexer (if they got stuck):


cd infra/services
docker compose restart api indexer


Deeper fixes

RPC URL wrong (env misconfig)

host.docker.internal not configured (missing extra_hosts)

L2 node crashed (disk/memory)

Rate limits / upstream provider issues (if using external RPC)

Prevention

Keep extra_hosts: host.docker.internal:host-gateway for api/indexer if using host RPC

Add alerts for RPC down + dashboard for head progress

