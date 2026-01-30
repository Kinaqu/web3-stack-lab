# WEB3-STACK-LAB

One repository = one system.

**Stage 1 (current):** bring up a local OP Stack L2 devnet with production-like ops basics:
- L2 node stack (execution + rollup node + roles)
- RPC endpoint
- Explorer (Blockscout) — next
- Faucet — next
- Indexer + Postgres — next
- Monitoring (Prometheus/Grafana) — next
- Docs + runbooks (this folder)

## Quickstart (coming next)
The exact commands will live in `infra/l2-node/` once the docker-compose devnet is added.

Expected flow:
1. Start the L2 devnet via Docker Compose (`infra/l2-node/`)
2. Verify RPC responds (default: `http://localhost:8545`)
3. Deploy `Counter` contract and send a “hello tx”

## Documentation
- `docs/architecture.md` — statement, requirements, architecture diagram, data flow, secrets
- `docs/threat-model.md` — trust assumptions, risks, mitigations
- `docs/runbooks.md` — troubleshooting and recovery playbooks

## Repository map
- `infra/` — node/explorer/indexer/monitoring/terraform scaffolding
- `contracts/` — demo contracts (Counter now; verifiers later)
- `backend/` — API services (later)
- `zk/`, `oracle/` — future stages (later)
