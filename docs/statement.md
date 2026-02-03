# OP Stack Rollup Testnet (Portfolio)

## Statement

Build and operate a small OP Stack L2 rollup testnet on Sepolia.
The goal is to run the core chain components (L1 contracts + L2 sequencer),
then add an indexer, API, faucet, monitoring, and runbooks.

## Users

- Developers who need a reproducible L2 sandbox for deployments and experiments.
- Node/chain operators who want a minimal, production-style OP Stack setup.

## MVP Goals (Day 2–3)

- L2 RPC is up and responding.
- A "hello tx" works end-to-end:
  1. deposit ETH from L1 (Sepolia) to L2,
  2. deploy a Counter contract on L2,
  3. call `increment()`,
  4. verify via RPC.

## Constraints

- **Latency:** RPC should be usable for dev (local calls feel instant).
- **Cost:** minimize Sepolia ETH usage; no mainnet deployments.
- **Trust assumptions:** single operator for sequencer/admin keys (for now).

## Threat Model (high level)

- Key compromise (admin/sequencer/batcher/proposer keys).
- RPC abuse / DoS (spam requests or transactions).
- L1 reorgs impacting derivation/indexing correctness.
- Misconfiguration (wrong chain IDs, wrong genesis/rollup config).
- Supply-chain risk (malicious binaries/images).