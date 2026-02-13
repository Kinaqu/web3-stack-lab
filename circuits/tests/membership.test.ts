import { expect } from "chai";
import path from "node:path";
import { buildPoseidon } from "circomlibjs";
import { wasm as wasmTester } from "circom_tester";

function randField(): bigint {
  const r = BigInt(Math.floor(Math.random() * 1e9)) << 32n;
  return r + BigInt(Math.floor(Math.random() * 1e9));
}

const includePaths = [path.join(process.cwd(), "node_modules")];

describe("membership.circom (depth=4)", () => {
  it("valid path -> ok", async () => {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const circuitPath = path.join(process.cwd(), "circom/membership.circom");
    const circuit = await wasmTester(circuitPath, { include: includePaths });

    const depth = 4;

    const user = 123456789n;
    const nonce = randField();

    const leaf = F.toObject(poseidon([user, nonce])) as bigint;

    const pathElements: bigint[] = [];
    const pathIndices: bigint[] = [];

    let cur = leaf;

    for (let i = 0; i < depth; i++) {
      const sibling = randField();
      const idx = BigInt(Math.random() < 0.5 ? 0 : 1);

      pathElements.push(sibling);
      pathIndices.push(idx);

      const left = idx === 0n ? cur : sibling;
      const right = idx === 0n ? sibling : cur;

      cur = F.toObject(poseidon([left, right])) as bigint;
    }

    const root = cur;

    const input = {
      root: root.toString(),
      user: user.toString(),
      nonce: nonce.toString(),
      pathElements: pathElements.map((x) => x.toString()),
      pathIndices: pathIndices.map((x) => x.toString())
    };

    const w = await circuit.calculateWitness(input, true);
    await circuit.checkConstraints(w);
  });

  it("invalid path -> fail", async () => {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const circuitPath = path.join(process.cwd(), "circom/membership.circom");
    const circuit = await wasmTester(circuitPath, { include: includePaths });

    const depth = 4;

    const user = 999n;
    const nonce = randField();
    const leaf = F.toObject(poseidon([user, nonce])) as bigint;

    const pathElements: bigint[] = [];
    const pathIndices: bigint[] = [];
    let cur = leaf;

    for (let i = 0; i < depth; i++) {
      const sibling = randField();
      const idx = 0n;
      pathElements.push(sibling);
      pathIndices.push(idx);

      const left = cur;
      const right = sibling;
      cur = F.toObject(poseidon([left, right])) as bigint;
    }

    const root = cur;

    // Break the path
    pathElements[2] = pathElements[2] + 1n;

    const badInput = {
      root: root.toString(),
      user: user.toString(),
      nonce: nonce.toString(),
      pathElements: pathElements.map((x) => x.toString()),
      pathIndices: pathIndices.map((x) => x.toString())
    };

    let threw = false;
    try {
      const w = await circuit.calculateWitness(badInput, true);
      await circuit.checkConstraints(w);
    } catch {
      threw = true;
    }
    expect(threw).to.equal(true);
  });
});