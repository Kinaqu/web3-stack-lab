# Proof API

The Proof API is an HTTP service responsible for accepting proof generation
requests and managing the lifecycle of proof jobs.

It does NOT generate proofs itself. Instead, it:

- validates requests
- persists jobs in Postgres
- enqueues proving tasks in Redis
- exposes job status endpoints
- exposes Prometheus metrics

The prover-worker consumes jobs from the queue.

---

## Architecture Role

Proof API is the entry point of the ZK proving pipeline:

Client → Proof API → Redis Queue → Prover Worker → Postgres



The API is stateless. All state lives in Postgres and Redis.

---

## Endpoints

### Health
GET /health


Returns service status.

---

### Create Proof Job
POST /proofs


Body:

```json
{
  "root": "0x...",
  "user": "0x...",
  "epoch": 1,
  "leaf": "0x..."
}


Response:
{
  "id": "uuid"
}



Get Proof Job
GET /proofs/:id

Returns:

status

request

publicInputs

proof (stub in MVP)


List Jobs

GET /proofs?limit=20



Metrics
GET /metrics


Prometheus-compatible metrics.


Environment Variables
PORT=8080
DATABASE_URL=postgres://...
REDIS_URL=redis://...
QUEUE_NAME=prove
LOG_LEVEL=info



Running Locally

From the repo root:
docker compose -f infra/services/zk/docker-compose.zk.yml up -d --build


API will be available at:
http://localhost:3101



Design Decisions
Async proving

Proof generation is asynchronous because proving can take seconds to minutes.

Durable jobs

Jobs are persisted before enqueueing to avoid loss.

Queue-based architecture

Redis queue decouples API latency from prover performance.


Security Model (MVP)

The API is not a trust boundary.

Security relies on:

circuit correctness

verifier contract

public input binding

Future improvements:

authentication

rate limiting

job deduplication

replay protection


