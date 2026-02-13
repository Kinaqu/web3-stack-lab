#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CIRCUITS_DIR="$ROOT_DIR/circuits"
BUILD_DIR="$CIRCUITS_DIR/build"

mkdir -p "$BUILD_DIR"

echo "[build] compiling membership.circom -> build/"
circom "$CIRCUITS_DIR/circom/membership.circom" \
  -l "$CIRCUITS_DIR/node_modules" \
  --r1cs --wasm --sym \
  -o "$BUILD_DIR"

echo "[build] r1cs info:"
snarkjs r1cs info "$BUILD_DIR/membership.r1cs" | sed -n '1,40p'

echo "[build] done"
