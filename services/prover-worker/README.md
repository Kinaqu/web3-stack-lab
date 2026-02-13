# Prover Worker

The prover-worker is responsible for generating ZK proofs in the background.

It consumes jobs from Redis and writes results to Postgres.

In the MVP, the worker produces **stub proofs**. Later phases will integrate
real circuit proving via snarkjs.

---

## Architecture Role
Proof API → Redis Queue → Prover Worker → Postgres



The worker is horizontally scalable.

Multiple workers can process the same queue.

---

## Responsibilities

- consume proof jobs
- generate witness
- generate proof (future phase)
- persist results
- expose metrics

---

## Worker Lifecycle
queued → running → done / failed



The worker guarantees:

- idempotent processing
- status persistence
- retry safety (future)

---

## Metrics

Exposed via:
/metrics



Typical metrics:

- jobs processed
- job duration
- failures
- queue activity

---

## Environment Variables
DATABASE_URL=postgres://...
REDIS_URL=redis://...
QUEUE_NAME=prove
WORKER_CONCURRENCY=2
LOG_LEVEL=info
METRICS_PORT=9101




---

## Running Locally

Worker is started via docker-compose:
docker compose -f infra/services/zk/docker-compose.zk.yml up



---

## Failure Model

Worker failures must not corrupt job state.

If a worker crashes:

- jobs remain in Redis
- job state remains in Postgres
- another worker can resume processing

---

## Future Responsibilities

Later phases will add:

- real witness generation
- snarkjs proving
- proof artifact storage
- retry strategy
- timeout handling
- batching
- GPU provers

---

## Non-Goals (MVP)

- decentralized proving
- proof marketplace
- hardware optimization