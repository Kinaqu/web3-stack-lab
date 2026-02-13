const path = require("node:path");

const wasm = process.argv[2];
const input = process.argv[3];
const out = process.argv[4];

if (!wasm || !input || !out) {
  console.error("Usage: node scripts/run_witness.cjs <wasm> <input.json> <witness.wtns>");
  process.exit(1);
}

const gen = path.join(process.cwd(), "build", "membership_js", "generate_witness.js");
require(gen)(wasm, input, out);