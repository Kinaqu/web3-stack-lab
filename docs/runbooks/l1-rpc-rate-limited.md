# Runbook: L1 RPC rate-limited

## Symptoms
- op-node/batcher/proposer logs show 429 / rate limit / timeout
- L2 stalls or delays

## What to check
- op-node logs
- L1 RPC provider quota

## Fast recovery
- Switch to a different L1 RPC endpoint
- Add a second provider and failover

## Prevention
- Use a paid RPC plan for public testnet
- Configure caching / backoff
