# Project Statement (Stage 1)

## Statement
Bring up a reproducible OP Stack L2 devnet on a single server.
The devnet must expose an L2 JSON-RPC endpoint and support end-to-end transactions (deploy + call a contract).

## Requirements
- Latency: RPC should be reliable for interactive dev workflows.
- Cost: must run on a single machine (Docker-based), no paid external services required.
- Trust: single-operator devnet; keys are dev-only (not production security).

## Threat Model (high level)
- RPC exposed publicly → tx spam / DoS.
- Leaked dev private keys → faucet drained / noisy chain state.
- Chain reset/redeploy → tools must tolerate reinitialization.
- Indexer desync (later) → API shows incorrect status.
EOF