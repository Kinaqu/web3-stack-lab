# Architecture (Stage 1 — L2 Infra Foundation)

## 1) Statement (what we build)

We are building a **local OP Stack L2 devnet** as an engineering system:
- L2 node stack (execution + rollup node + roles: sequencer/batcher/proposer)
- Public interfaces: **RPC**, Explorer, Faucet
- Data services: **Indexer + Postgres** (and later API)
- Observability: metrics/logs/alerts
- Operational docs: architecture + threat model + runbooks

Goal of Stage 1: it is **reproducible**, works end-to-end, and is **operable** (not a one-off demo).

## 2) Requirements (latency / cost / trust)

### Latency / UX targets (dev/test oriented)
- RPC reads should feel responsive for dev workflows (seconds OK; tens of seconds = bad)
- Explorer should reflect new txs within minutes after inclusion
- Indexer lag: normally within a few blocks; visible alert when drifting

### Cost
- Local devnet: $0
- Public testnet (optional later): minimal VPS; prioritize reproducibility over cost optimization

### Trust assumptions (Stage 1)
- Single sequencer is acceptable
- Keys for roles (sequencer/batcher/proposer/faucet) are trusted and managed as dev/test secrets
- L1 RPC provider (if used) may rate-limit or fail temporarily → retries/backoff required

## 3) System diagram (must-have)

```mermaid
flowchart LR
  subgraph Host[Local machine (Docker)]
    subgraph L2[OP Stack L2]
      OPNODE[op-node]
      OPGETH[op-geth (execution)]
      SEQ[Sequencer]
      BATCH[Batcher]
      PROP[Proposer]
    end

    subgraph Interfaces[Interfaces]
      RPC[L2 RPC :8545]
      EXP[Explorer (Blockscout)]
      FAU[Faucet]
    end

    subgraph Data[Data services]
      IDX[Indexer]
      DB[(Postgres)]
    end

    subgraph Obs[Observability]
      PROM[Prometheus]
      GRAF[Grafana]
      LOG[Logs (Loki / stdout)]
    end
  end

  OPNODE --> OPGETH
  SEQ --> OPGETH

  OPGETH --> RPC
  RPC --> EXP
  RPC --> IDX
  IDX --> DB
  RPC --> FAU

  OPNODE --> PROM
  OPGETH --> PROM
  PROM --> GRAF
  OPGETH --> LOG
  OPNODE --> LOG
```


4) Data flow (how data moves)

Transactions
Client/script → L2 RPC → Sequencer → L2 block → (Explorer + Indexer read via RPC) → user sees confirmations / UI updates.

Indexing
Indexer reads from L2 RPC:
blocks → txs → receipts/logs → stores in Postgres

keeps a checkpoint (last_processed_block)

must be restart-safe (resume from checkpoint)

must handle reorgs: rollback N blocks when head mismatch is detected



5) Secrets & signing responsibilities

Stage 1 secrets (minimal set):
SEQUENCER_KEY — sequencer role

BATCHER_KEY — posts batches to L1 (when applicable)

PROPOSER_KEY — posts outputs to L1 (when applicable)

FAUCET_KEY — signs faucet transfers


Rules:
never commit secrets

pass via environment variables / compose secrets (env is fine for Stage 1)



6) Repo mapping (where things live)

infra/l2-node/ — docker-compose devnet + configs

infra/explorer/ — Blockscout setup

infra/indexer/ — Postgres + indexer runner

infra/monitoring/ — Prometheus/Grafana configs/dashboards

contracts/ — Counter contract now; verifiers later

backend/ — API later

7) Stage 1 Definition of Done

Local devnet starts via Docker Compose

RPC responds and can accept transactions

Deploy Counter → increment → verify via RPC

Explorer shows blocks/txs

Faucet rate-limits + logs distributions

Indexer writes to Postgres and survives restarts

Basic monitoring: RPC down, indexer lag, disk usage