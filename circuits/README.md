# ZK Circuits — Merkle Membership (Groth16)

This directory contains the zero-knowledge circuit used by the ZK Proof Service.

The circuit proves **Merkle allowlist membership** without revealing the Merkle path.

It is implemented in **Circom** and uses **Poseidon hashing** and **Groth16 proofs (snarkjs)**.

---

## Statement

The circuit proves that:

- a user belongs to a Merkle tree
- the Merkle root is known publicly
- the proof is bound to a specific user

Leaf definition:
leaf = Poseidon(user, nonce)



Public inputs:
root
user



Private inputs:
nonce
pathElements[depth]
pathIndices[depth



The circuit recomputes the Merkle root from the leaf and path and enforces:
computedRoot == root



---

## Directory Structure

circuits/
├── circom/
│ └── membership.circom
│
├── scripts/
│ ├── build.sh
│ ├── prove.sh
│ └── gen_sample_input.mjs
│
├── tests/
│ └── membership.test.ts
│
└── build/ (generated artifacts)



---

## Requirements

Install:

- circom (2.x)
- snarkjs
- Node.js ≥ 20

Example installation:


npm i -g snarkjs



If circom is not installed, build it from source (Rust).

---

## Running Circuit Tests

From the `circuits` directory:
npm test



Tests cover:

- valid Merkle path → constraints satisfied
- invalid Merkle path → constraint failure

---

## Build Circuit

Compile the circuit and generate WASM + R1CS:

./scripts/build.sh



This produces:
build/membership.r1cs
build/membership_js/membership.wasm
build/membership.sym



---

## Generate Proof (Off-chain)

Run:
./scripts/prove.sh



This will:

1. generate sample input
2. run Groth16 setup (dev parameters)
3. generate witness
4. generate proof
5. verify proof off-chain

Expected output:
snarkJS: OK!
[prove] OK: proof verified off-chain



---

## Development Notes

### CommonJS witness generator

Circom generates a CommonJS witness runner:
generate_witness.js



Since this project uses ESM (`"type": "module"`), the prove script
automatically patches these files to `.cjs`.

This is expected behavior for the MVP.

---

## Circuit Parameters

Merkle depth is currently fixed:
depth = 4



This keeps proof generation fast during development.

---

## Future Improvements

- configurable Merkle depth
- Poseidon-based Merkle tree library
- production trusted setup
- proof caching
- batched proving
- recursive proofs
- PLONK support
