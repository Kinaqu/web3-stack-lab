import fs from "node:fs";
import path from "node:path";
import { buildPoseidon } from "circomlibjs";

function randField() {
  const a = BigInt(Math.floor(Math.random() * 1e9));
  const b = BigInt(Math.floor(Math.random() * 1e9));
  return (a << 32n) + b;
}

const poseidon = await buildPoseidon();
const F = poseidon.F;

const depth = 4;
const user = 123456789n;
const nonce = randField();

const leaf = F.toObject(poseidon([user, nonce]));

const pathElements = [];
const pathIndices = [];
let cur = leaf;

for (let i = 0; i < depth; i++) {
  const sibling = randField();
  const idx = BigInt(Math.random() < 0.5 ? 0 : 1);

  pathElements.push(sibling);
  pathIndices.push(idx);

  const left = idx === 0n ? cur : sibling;
  const right = idx === 0n ? sibling : cur;
  cur = F.toObject(poseidon([left, right]));
}

const root = cur;

const input = {
  root: root.toString(),
  user: user.toString(),
  nonce: nonce.toString(),
  pathElements: pathElements.map((x) => x.toString()),
  pathIndices: pathIndices.map((x) => x.toString())
};

const outDir = path.join(process.cwd(), "build");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "input.json"), JSON.stringify(input, null, 2));

console.log("Wrote build/input.json");
console.log("root =", input.root);