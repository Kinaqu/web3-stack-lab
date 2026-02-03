# infra/l2-node

Local OP Stack devnet via Docker Compose.

**Services:**
- `op-geth` (execution client)
- `op-node` (rollup node + sequencer)

## Files

- **`docker-compose.yml`** — local node stack
- **`.env`** — local runtime config (DO NOT COMMIT)
- **`.env.example`** — template for `.env` (create this file)
- **`jwt.txt`** — Engine API JWT secret (DO NOT COMMIT)
- **`genesis.json`, `rollup.json`** — node configs
- **`l1_contracts.json`** — extracted L1 addresses (optional convenience)
- **`op-geth-data/`, `opnode_*`** — runtime databases (DO NOT COMMIT)

## Setup

### 1) Create `.env`

Create `infra/l2-node/.env.example`:

```bash
cat > infra/l2-node/.env.example << 'EOF'
L1_RPC_URL=https://your-sepolia-rpc.example
L1_BEACON_URL=https://ethereum-sepolia-beacon-api.publicnode.com
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
P2P_ADVERTISE_IP=127.0.0.1
EOF
```

Then:

```bash
cp infra/l2-node/.env.example infra/l2-node/.env
# edit infra/l2-node/.env with real values
```

### 2) Generate JWT

```bash
openssl rand -hex 32 > infra/l2-node/jwt.txt
chmod 600 infra/l2-node/jwt.txt
```

### 3) Initialize op-geth (once)

Run from `infra/l2-node/`:

```bash
docker run --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  us-docker.pkg.dev/oplabs-tools-artifacts/images/op-geth:v1.101605.0 \
  init --datadir=./op-geth-data --state.scheme=hash ./genesis.json
```

### Run

```bash
cd infra/l2-node
docker compose up -d
docker compose ps
```

## Endpoints

- **L2 RPC (HTTP):** `http://localhost:8545`
- **L2 WS:** `ws://localhost:8546`
- **Engine API (authrpc):** `http://localhost:8551`
- **op-node admin RPC:** `http://localhost:8547`

## Health checks

```bash
cast block-number --rpc-url http://localhost:8545

curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"admin_sequencerActive","params":[],"id":1}' \
  http://localhost:8547
```

## L1→L2 deposit (fund an EOA on L2)

Portal address is stored in deployment state; you can read it from `l1_contracts.json` or `state.json`:

```bash
jq -r '.OptimismPortalProxy' infra/l2-node/l1_contracts.json
# or:
jq -r '.opChainDeployments[0].OptimismPortalProxy' infra/l2-node/state.json
```

### Deposit:

```bash
export L1_RPC_URL=...
export L1_PK=0xFUNDED_SEPOLIA_PRIVATE_KEY
export PORTAL=0x...   # from jq above
export L2_TO=0xYOUR_L2_ADDRESS

cast send $PORTAL \
  "depositTransaction(address,uint256,uint64,bool,bytes)" \
  $L2_TO 0 200000 false 0x \
  --value 0.05ether \
  --rpc-url $L1_RPC_URL \
  --private-key $L1_PK
```

### Check L2 balance:

```bash
cast balance $L2_TO --rpc-url http://localhost:8545
```

## Common issues

### Blocks stop growing
Often caused by a stuck tx in geth txpool (e.g. too low fee). Fast dev fix:

```bash
docker compose restart op-geth
docker compose restart op-node

# Then resend tx with explicit gas price.
```

### op-node config decode error (unknown field in `rollup.json`)
Upgrade `op-node`/`op-geth` to a recent matching pair.

### L1 rate limits (429)
Use a better L1 RPC provider and recreate `op-node`:

```bash
unset L1_RPC_URL L1_BEACON_URL PRIVATE_KEY P2P_ADVERTISE_IP
docker compose up -d --no-deps --force-recreate op-node
```

## Secrets

**Never commit:**
- `.env`
- `jwt.txt`
- `op-geth-data/`
- `opnode_*`