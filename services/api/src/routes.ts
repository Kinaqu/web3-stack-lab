import type { FastifyInstance } from "fastify";
import { pool } from "./db.js";
import { provider } from "./rpc.js";


function isHexTxHash(s: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(s);
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    const out: any = { ok: true, db: { ok: true }, rpc: { ok: true } };

    try {
      await pool.query("SELECT 1");
    } catch (e: any) {
      out.ok = false;
      out.db = { ok: false, error: e?.message ?? String(e) };
    }

    try {
      const chainId = await provider.send("eth_chainId", []);
      out.rpc = { ok: true, chainId };
    } catch (e: any) {
      out.ok = false;
      out.rpc = { ok: false, error: e?.message ?? String(e) };
    }

    return out;
  });

  app.get("/tx/:hash", async (req, reply) => {
    const { hash } = req.params as { hash: string };

    if (!isHexTxHash(hash)) {
      return reply.code(400).send({ error: "invalid_tx_hash" });
    }

    const r = await pool.query(
      `SELECT hash, block_number, "from", "to", nonce, value, gas, gas_price, status
       FROM transactions
       WHERE hash = $1`,
      [hash]
    );

    if (r.rowCount === 0) {
      return reply.code(404).send({ error: "tx_not_found" });
    }

    const row = r.rows[0];
    return {
      hash: row.hash,
      blockNumber: Number(row.block_number),
      from: row.from,
      to: row.to,
      nonce: Number(row.nonce),
      value: row.value,
      gas: Number(row.gas),
      gasPrice: row.gas_price,
      status: row.status, // 1 success, 0 reverted, null unknown
    };
  });

  app.get("/stats", async () => {
    // RPC head
    const rpcHead = await provider.getBlockNumber();

    // DB indexed head
    const s = await pool.query(`SELECT indexed_block FROM indexer_state WHERE id = 1`);
    const indexedHead = s.rowCount ? Number(s.rows[0].indexed_block) : -1;

    // DB counts (fast enough for MVP)
    const [blocksCountRes, txsCountRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::bigint AS c FROM blocks`),
      pool.query(`SELECT COUNT(*)::bigint AS c FROM transactions`),
    ]);

    const dbBlockCount = Number(blocksCountRes.rows[0].c);
    const dbTxCount = Number(txsCountRes.rows[0].c);

    // confirmations (keep consistent with indexer)
    const confirmations = Number(process.env.CONFIRMATIONS ?? 5);

    // lag
    const lag = indexedHead >= 0 ? rpcHead - indexedHead : null;

    return {
      rpcHead,
      indexedHead,
      lag,
      confirmations,
      db: {
        blocks: dbBlockCount,
        transactions: dbTxCount,
      },
    };
  });
}
