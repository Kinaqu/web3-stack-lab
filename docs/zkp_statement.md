# 📜 ZK Proof Service — Statement and Requirements

## 📝 Statement

> [!NOTE]
> This project implements a ZK Proof Service that generates zero-knowledge proofs of **Merkle allowlist membership** and verifies them on-chain.

A user proves that they belong to a predefined Merkle set without revealing the full dataset or the Merkle path. The proof is generated off-chain by a prover service and verified by a smart contract deployed on the L2 network.

The system is designed as an infrastructure component that can be reused by dApps for allowlist gating, identity proofs, and access control.

---

## 🎯 Scope (Phase 1 / MVP)

The MVP focuses on:

- **Merkle membership circuit**
- **Proof generation via background worker**
- **Queue-based proof pipeline**
- **On-chain verifier contract** (stub in Phase 1)
- **Minimal HTTP API** for job creation and status tracking

> [!TIP]
> The goal is to demonstrate a production-like proof pipeline rather than cryptographic sophistication.

---

## ⚙️ System Requirements

### ⏱️ Latency

Proof generation is asynchronous.

**Target:**
- **p50**: < 5 seconds
- **p95**: < 30 seconds

The API must remain responsive even under proof load.

---

### 💰 Cost Constraints

For MVP:

- Prover runs on **CPU**
- Limited worker concurrency
- No GPU assumptions
- Proof artifacts stored in **Postgres** (stub)

Future versions may introduce:
- batching
- GPU provers
- proof caching
- external artifact storage

---

### 🛡️ Reliability Requirements

The proof pipeline must be resilient to:

- API restarts
- worker restarts
- Redis reconnects
- database reconnects

> [!IMPORTANT]
> Jobs must not be lost once accepted.

---

## 🔒 Trust Assumptions

The **prover is not trusted**.

Security relies on:

1. Deterministic circuit constraints
2. On-chain verification
3. Domain-separated public inputs
4. Replay protection (nullifier / epoch in later phases)

> [!IMPORTANT]
> The verifier contract is the root of trust. The API and worker are treated as operational infrastructure, not as security boundaries.

---

## ⚠️ Threat Model

### 🔄 Replay Attacks
A previously valid proof could be reused.

**Mitigation (planned):**
- Epoch-based proofs
- Nullifier tracking on-chain
- Domain separation

---

### ✏️ Public Input Substitution
An attacker attempts to modify:
- Merkle root
- User address
- Epoch

**Mitigation:**
- These values are part of public inputs
- Verifier enforces equality constraints

---

### 🌊 Queue DoS
An attacker floods the API with proof jobs.

**Mitigation (later phases):**
- Rate limiting
- Authentication
- Job deduplication
- Queue backpressure

> [!NOTE]
> MVP accepts this risk.

---

### ❌ Invalid Proof Acceptance (Critical)
The most severe failure would be accepting an invalid proof.

**Mitigation:**
- Verifier contract tests
- Circuit tests
- Integration tests
- Fuzzing in later phases

> [!CRITICAL]
> This is the primary security invariant of the system.

---

## 🚫 Non-Goals (MVP)

The following are intentionally out of scope:

- Decentralized prover network
- zkTLS
- Recursive proofs
- GPU optimization
- Production key ceremony
- Multi-tenant isolation
- Identity systems

---

## ✅ Success Criteria (Day 1)

The system is considered initialized when:

- [ ] `proof-api` container runs
- [ ] `prover-worker` container runs
- [ ] Redis and Postgres run
- [ ] `/health` endpoint responds
- [ ] `POST /proofs` creates a job
- [ ] worker processes job
- [ ] `GET /proofs/:id` returns result

This establishes the foundation for circuit and verifier integration.
