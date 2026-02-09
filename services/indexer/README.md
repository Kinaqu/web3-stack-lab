# Indexer Service

Indexes L2 blockchain data into Postgres.

This service converts RPC chain data into queryable relational storage.

---

## Responsibilities

- Read L2 blocks via JSON-RPC
- Store blocks and transactions
- Maintain checkpoint (indexer_state)
- Handle short reorgs
- Fetch receipts → transaction status
- Apply DB migrations on startup

---

## Architecture Role

Pipeline:

L2 RPC → Indexer → Postgres → API


The indexer is the only writer to the database.

---

## Environment Variables

DATABASE_URL=postgres://web3:web3pass@postgres:5432/web3stack
L2_RPC_URL=http://host.docker.internal:8545

CONFIRMATIONS=5
REORG_SAFETY=20
POLL_INTERVAL_MS=2000
LOG_LEVEL=info



---

## Migrations

SQL migrations are stored in:

migrations/

Applied automatically on startup.

Migration tracking table:


schema_migrations


---

## Reorg Strategy

Indexer verifies the hash of the last indexed block.

If mismatch detected:
- rollback last N blocks
- reset checkpoint
- resume indexing

Config:
REORG_SAFETY


---

## Checkpointing

State table:

indexer_state


Fields:
- indexed_block
- indexed_block_hash

Indexer resumes from checkpoint on restart.

---

## Running Locally

From infra/services:



docker compose up indexer


---

## Logs

Example indexing log:

indexing head=158900 target=158895 start=120



---

## Failure Modes

### RPC unavailable
Indexer retries automatically.

### Receipt fetch fails
Transaction stored with:
status = null



### Restart
Indexer resumes from checkpoint.

---

## Future Improvements

- batch inserts
- receipt concurrency pool
- metrics export
- queue-based indexing
