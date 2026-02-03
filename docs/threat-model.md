# Threat Model (Stage 1)

Stage 1 is a dev/test system. The goal is operational correctness and basic safety (not mainnet-grade hardening).

## Assets (what we protect)
- **Private keys:** sequencer/batcher/proposer/faucet
- **RPC availability and stability**
- **Indexed data integrity (Postgres)** and correctness under reorgs
- **Project credibility** (no leaked keys, no trivially abusable faucet)

## Trust assumptions
- Single sequencer is acceptable in Stage 1
- Local host + Docker environment are trusted
- External endpoints (if exposed) may be abused (DoS/faucet draining)
- L1 RPC provider (if used) may rate-limit / be temporarily unavailable

## Threats & mitigations

| Category | Threat | Impact | Stage 1 mitigation |
|---|---|---|---|
| **Secrets** | key leaked via git/logs | role compromise / funds loss | `.env` ignored, never log secrets, use examples/templates |
| **Faucet** | faucet draining / abuse | faucet empty, broken UX | rate-limit, optional allowlist, logging + balance alarms |
| **RPC** | DoS / spam | RPC unusable | keep RPC local by default; add rate limiting if exposing |
| **Infra** | disk full (node/db/logs) | outages, data corruption | disk usage alerts, log rotation, sane volumes |
| **Infra** | OOM / CPU saturation | outages | resource limits, monitoring, restart policy |
| **Data** | L1/L2 reorg breaks indexer | incorrect API/data | reorg handling (rollback N), checkpointing, idempotent writes |
| **Provider** | L1 RPC rate limit / outages | batcher/proposer fails | retries + exponential backoff, provider switching plan |
| **Supply chain** | vulnerable images/deps | compromise risk | pin versions, minimal dependencies, update cadence |

## Out of scope (Stage 1)
- full decentralization / permissionless sequencing
- formal audits, mainnet security posture
- advanced MEV / censorship resistance research
