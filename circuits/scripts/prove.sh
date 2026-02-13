#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CIRCUITS_DIR="$ROOT_DIR/circuits"
BUILD_DIR="$CIRCUITS_DIR/build"
JS_DIR="$BUILD_DIR/membership_js"

mkdir -p "$BUILD_DIR"

echo "[prove] generating sample input"
node "$CIRCUITS_DIR/scripts/gen_sample_input.mjs"

echo "[prove] ensure compiled artifacts exist"
test -f "$BUILD_DIR/membership.r1cs" || (echo "missing membership.r1cs, run build.sh first" && exit 1)
test -f "$JS_DIR/membership.wasm" || (echo "missing membership.wasm, run build.sh first" && exit 1)

PTAU="$BUILD_DIR/pot12_final.ptau"
if [ ! -f "$PTAU" ]; then
  echo "[prove] creating PTAU (dev only)"
  snarkjs powersoftau new bn128 12 "$BUILD_DIR/pot12_0000.ptau" -v
  snarkjs powersoftau contribute "$BUILD_DIR/pot12_0000.ptau" "$BUILD_DIR/pot12_0001.ptau" --name="dev" -v -e="random"
  snarkjs powersoftau prepare phase2 "$BUILD_DIR/pot12_0001.ptau" "$PTAU" -v
fi

ZKEY="$BUILD_DIR/membership_0000.zkey"
ZKEY_FINAL="$BUILD_DIR/membership_final.zkey"
VK="$BUILD_DIR/verification_key.json"

if [ ! -f "$ZKEY_FINAL" ]; then
  echo "[prove] groth16 setup"
  snarkjs groth16 setup "$BUILD_DIR/membership.r1cs" "$PTAU" "$ZKEY" -v
  snarkjs zkey contribute "$ZKEY" "$ZKEY_FINAL" --name="dev" -v -e="random"
  snarkjs zkey export verificationkey "$ZKEY_FINAL" "$VK"
fi

echo "[prove] patch witness generator to CommonJS (.cjs) to avoid ESM 'type: module' issues"
# witness_calculator.js -> witness_calculator.cjs
if [ -f "$JS_DIR/witness_calculator.js" ] && [ ! -f "$JS_DIR/witness_calculator.cjs" ]; then
  mv "$JS_DIR/witness_calculator.js" "$JS_DIR/witness_calculator.cjs"
fi

# generate_witness.js -> generate_witness.cjs and fix require path
if [ -f "$JS_DIR/generate_witness.js" ] && [ ! -f "$JS_DIR/generate_witness.cjs" ]; then
  mv "$JS_DIR/generate_witness.js" "$JS_DIR/generate_witness.cjs"
  # replace require("./witness_calculator.js") -> require("./witness_calculator.cjs")
  sed -i 's#"\./witness_calculator\.js"#"./witness_calculator.cjs"#g' "$JS_DIR/generate_witness.cjs"
  sed -i "s#'./witness_calculator\.js'#'./witness_calculator.cjs'#g" "$JS_DIR/generate_witness.cjs"
fi

echo "[prove] witness (CommonJS)"
node "$JS_DIR/generate_witness.cjs" \
  "$JS_DIR/membership.wasm" \
  "$BUILD_DIR/input.json" \
  "$BUILD_DIR/witness.wtns"

echo "[prove] prove"
snarkjs groth16 prove "$ZKEY_FINAL" "$BUILD_DIR/witness.wtns" "$BUILD_DIR/proof.json" "$BUILD_DIR/public.json"

echo "[prove] verify"
snarkjs groth16 verify "$VK" "$BUILD_DIR/public.json" "$BUILD_DIR/proof.json"

echo "[prove] OK: proof verified off-chain"