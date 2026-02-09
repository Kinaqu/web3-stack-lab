# Faucet service

Simple HTTP faucet for the local OP Stack L2.
It sends a fixed amount of ETH from a funded faucet account to a requested address, with basic rate limits.

## Endpoints
- `GET /health`
  - returns: current L2 block number, faucet address, faucet balance
- `POST /faucet`
  - body: `{ "address": "0x..." }`
  - returns: `{ ok, txHash, blockNumber, ... }`

## Requirements
- L2 RPC available on host:
  - `http://localhost:8545`
- Faucet account funded on L2 (must have ETH to send)

## Config
Environment is loaded from `.env`.

1) Create `.env`:
```bash
cp services/faucet/.env.example services/faucet/.env


Edit services/faucet/.env:

FAUCET_PRIVATE_KEY=0x... (DO NOT COMMIT)

L2_RPC_URL=http://host.docker.internal:8545 (default for Docker-on-Ubuntu with host-gateway)

AMOUNT_ETH=0.1 (payout per request)

Rate limits:

IP limiter: IP_WINDOW_MS, IP_MAX_REQ

Address cooldown: ADDR_COOLDOWN_MS

Run (Docker)

From repo root:
docker compose -f infra/services/docker-compose.yml up -d --build
Logs:
docker compose -f infra/services/docker-compose.yml logs -f faucet

Stop:
docker compose -f infra/services/docker-compose.yml down

Run (local, without Docker)

From services/faucet:
npm install
npm run build
node dist/index.js
Test

Health:
curl -s http://localhost:3002/health
Request payout:
curl -s -X POST http://localhost:3002/faucet \
  -H "Content-Type: application/json" \
  -d '{"address":"0xYOUR_ADDRESS"}'
Notes / Troubleshooting
jq parse error on /health

If you pipe /health into jq and get a parse error, the response may not be JSON (often due to 429 Too Many Requests from rate limit).
Check raw response:
curl -i http://localhost:3002/health
Slow /faucet response

The faucet waits for 1 confirmation (tx.wait(1)) for better UX.
If you want instant response, return txHash immediately and confirm asynchronously.

Security

This is an MVP faucet:

IP rate limiting + address cooldown

Logs payouts to /var/log/faucet/payouts.log (inside a Docker volume)

For public deployment you should add:

CAPTCHA or allowlist

persistent cooldown store (Redis/Postgres)

monitoring/alerts and stricter limits
