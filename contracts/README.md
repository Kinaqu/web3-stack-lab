# Contracts

Demo contracts + tests for the OP Stack L2 devnet.
Current: **Counter contract** used for the hello-tx flow:
- deploy
- increment
- read state via RPC

## Tooling

- Foundry (`forge`, `cast`)

## Setup

```bash
cd contracts
forge build
```

## Counter contract

File: `contracts/src/Counter.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public number;
    function increment() external { number += 1; }
}
```

## Hello tx (local L2)

Assumes:
- L2 RPC: `http://localhost:8545`
- You have ETH on L2 (via deposit)
- `L2_PK` is funded on L2

### From repo root:

```bash
export L2_RPC=http://localhost:8545
export L2_PK=0xYOUR_L2_PRIVATE_KEY
```

### Deploy

Tip: specify gas price explicitly (avoid stuck tx in local devnet).

```bash
cd ..
forge create --root contracts \
  --rpc-url "$L2_RPC" \
  --private-key "$L2_PK" \
  --broadcast \
  --legacy \
  --gas-price 50000000000 \
  src/Counter.sol:Counter
```

### Copy Deployed to: `0x...` into:

```bash
export COUNTER=0xDEPLOYED_ADDRESS
```

### Increment

```bash
cast send "$COUNTER" "increment()" \
  --rpc-url "$L2_RPC" \
  --private-key "$L2_PK" \
  --legacy \
  --gas-price 50000000000
```

### Read state

```bash
cast call "$COUNTER" "number()(uint256)" --rpc-url "$L2_RPC"
```

Expected: `1` (or increments with repeated calls).

## Tests

```bash
cd contracts
forge test -vvv
```

## Troubleshooting

### Blocks stop growing

Often caused by a stuck tx in geth txpool (e.g. too low fee). Fast dev fix:

```bash
cd infra/l2-node
docker compose restart op-geth
docker compose restart op-node
# Then re-send tx with explicit --gas-price.
```
