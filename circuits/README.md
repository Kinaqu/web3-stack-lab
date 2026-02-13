# 🛡️ ZK Circuits — Merkle Membership (Groth16)

![Circom](https://img.shields.io/badge/Circom-2.x-blue)
![SnarkJS](https://img.shields.io/badge/SnarkJS-Groth16-orange)
![License](https://img.shields.io/badge/License-MIT-green)

This directory contains the zero-knowledge circuit used by the ZK Proof Service.

The circuit proves **Merkle allowlist membership** without revealing the Merkle path. It is implemented in **Circom** and uses **Poseidon hashing** and **Groth16 proofs (snarkjs)**.

---

## 📝 Statement

The circuit proves that:

- A user belongs to a Merkle tree
- The Merkle root is known publicly
- The proof is bound to a specific user

### Leaf Definition

```rust
leaf = Poseidon(user, nonce)
```

### Inputs

| Type | Name | Description |
| :--- | :--- | :--- |
| **Public** | `root` | The Merkle root of the allowlist |
| **Public** | `user` | The user's address |
| **Private** | `nonce` | Secret value to prevent rainbow table attacks |
| **Private** | `pathElements[depth]` | Merkle siblings |
| **Private** | `pathIndices[depth]` | Path direction (0 or 1) |

The circuit recomputes the Merkle root from the leaf and path and enforces:
```rust
computedRoot === root
```

---

## 📂 Directory Structure

```graphql
circuits/
├── circom/
│   └── membership.circom   # Main circuit definition
├── scripts/
│   ├── build.sh            # Compile circuit
│   ├── prove.sh            # Generate proof (dev)
│   └── gen_sample_input.mjs
├── tests/
│   └── membership.test.ts  # Integration tests
└── build/                  # Generated artifacts (wasm, zkey, r1cs)
```

---

## 🛠️ Requirements

Install the following dependencies:

- **Circom (2.x)** - [Installation Guide](https://docs.circom.io/getting-started/installation/)
- **SnarkJS**
- **Node.js ≥ 20**

### Example Installation

```bash
npm i -g snarkjs
```

> [!TIP]
> If `circom` is not installed, you must build it from source (Rust).

---

## 🧪 Running Circuit Tests

From the `circuits` directory:

```bash
npm test
```

**Tests cover:**
- ✅ Valid Merkle path → constraints satisfied
- ❌ Invalid Merkle path → constraint failure

---

## 🏗️ Build Circuit

Compile the circuit and generate WASM + R1CS:

```bash
./scripts/build.sh
```

**This produces:**
- `build/membership.r1cs`
- `build/membership_js/membership.wasm`
- `build/membership.sym`

---

## 🔐 Generate Proof (Off-chain)

Run the proof generation script:

```bash
./scripts/prove.sh
```

**This will:**
1. Generate sample input
2. Run Groth16 setup (dev parameters)
3. Generate witness
4. Generate proof
5. Verify proof off-chain

**Expected output:**
```text
snarkJS: OK!
[prove] OK: proof verified off-chain
```

---

## ℹ️ Development Notes

### CommonJS Witness Generator

Circom generates a CommonJS witness runner: `generate_witness.js`.

> [!NOTE]
> Since this project uses ESM (`"type": "module"`), the `prove` script automatically patches these files to `.cjs`. This is expected behavior for the MVP.

---

## ⚙️ Circuit Parameters

Merkle depth is currently fixed:

```javascript
depth = 4
```

This keeps proof generation fast during development.

---

## 🔮 Future Improvements

- [ ] Configurable Merkle depth
- [ ] Poseidon-based Merkle tree library
- [ ] Production trusted setup
- [ ] Proof caching
- [ ] Batched proving
- [ ] Recursive proofs
- [ ] PLONK support
