import { provider } from "./rpc.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { withClient } from "./db.js";
import { getState, rollbackFrom, setState } from "./reorg.js";
import {
  indexerIndexedHead,
  indexerRpcHead,
  indexerLagBlocks,
  l2RpcUp,
  l2RpcHead,
} from "./metrics.js";

type RpcBlockWithTxs = any;

async function getHead(): Promise<bigint> {
  const n = await provider.getBlockNumber();
  return BigInt(n);
}

async function getBlockHash(n: bigint): Promise<string> {
  const b = await provider.getBlock(Number(n));
  if (!b) throw new Error(`Block not found: ${n.toString()}`);
  if (!b.hash) throw new Error(`Block hash is null: ${n.toString()}`);
  return b.hash;
}

function asTxHash(t: any): string | null {
  if (!t) return null;
  if (typeof t === "string" && t.startsWith("0x") && t.length === 66) return t;
  if (
    typeof t === "object" &&
    typeof t.hash === "string" &&
    t.hash.startsWith("0x") &&
    t.hash.length === 66
  )
    return t.hash;
  return null;
}

function toBigintString(v: any, fallback: string): string {
  try {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "bigint") return v.toString();
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : fallback;
    if (typeof v === "string") return v.length ? v : fallback;
    if (typeof v?.toString === "function") return v.toString();
    return fallback;
  } catch {
    return fallback;
  }
}

function clampToSafeNumber(n: bigint): number {
  // Prometheus client expects JS number; clamp bigints safely
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  const min = BigInt(Number.MIN_SAFE_INTEGER);
  if (n > max) return Number.MAX_SAFE_INTEGER;
  if (n < min) return Number.MIN_SAFE_INTEGER;
  return Number(n);
}

async function upsertBlockAndTxs(block: RpcBlockWithTxs): Promise<void> {
  const txHashes: string[] = [];
  for (const t of block.transactions ?? []) {
    const h = asTxHash(t);
    if (h) txHashes.push(h);
    else logger.warn({ t }, "skip tx without hash");
  }

  await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(
        `INSERT INTO blocks(number, hash, parent_hash, timestamp, tx_count)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (number)
         DO UPDATE SET hash = EXCLUDED.hash,
                       parent_hash = EXCLUDED.parent_hash,
                       timestamp = EXCLUDED.timestamp,
                       tx_count = EXCLUDED.tx_count`,
        [
          block.number.toString(),
          block.hash,
          block.parentHash,
          block.timestamp.toString(),
          txHashes.length,
        ]
      );

      for (const hash of txHashes) {
        const tx = await provider.getTransaction(hash);
        if (!tx) {
          logger.warn({ hash }, "tx not found via getTransaction; skipping");
          continue;
        }

        // Receipt (status)
        let status: number | null = null;
        try {
          const receipt = await provider.getTransactionReceipt(hash);
          status = receipt?.status ?? null; // 1 success, 0 reverted
        } catch (e: any) {
          logger.warn({ tx: hash, err: e?.message ?? e }, "failed to fetch receipt; status=null");
        }

        const gasPrice =
          (tx.gasPrice ?? tx.maxFeePerGas ?? tx.maxPriorityFeePerGas ?? null)?.toString() ?? null;

        // IMPORTANT: avoid inserting "undefined" into bigint columns
        const nonce = toBigintString(tx.nonce, "0");
        const value = toBigintString(tx.value, "0");
        const gas = toBigintString(tx.gasLimit, "0");

        await client.query(
          `INSERT INTO transactions(
             hash, block_number, "from", "to", nonce, value, gas, gas_price, input, status
           )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (hash)
           DO UPDATE SET
             block_number = EXCLUDED.block_number,
             "from" = EXCLUDED."from",
             "to" = EXCLUDED."to",
             nonce = EXCLUDED.nonce,
             value = EXCLUDED.value,
             gas = EXCLUDED.gas,
             gas_price = EXCLUDED.gas_price,
             input = EXCLUDED.input,
             status = EXCLUDED.status`,
          [
            tx.hash,
            block.number.toString(),
            tx.from,
            tx.to ?? null,
            nonce,
            value,
            gas,
            gasPrice,
            tx.data ?? null,
            status,
          ]
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  });
}

async function reorgCheckAndMaybeRollback(): Promise<void> {
  const state = await getState();
  if (state.indexedBlock < 0n || !state.indexedBlockHash) return;

  const actualHash = await getBlockHash(state.indexedBlock);
  if (actualHash === state.indexedBlockHash) return;

  const rollbackTo = state.indexedBlock - BigInt(config.reorgSafety);
  const safeRollbackFrom = rollbackTo > 0n ? rollbackTo : 0n;

  logger.warn(
    {
      indexedBlock: state.indexedBlock.toString(),
      expectedHash: state.indexedBlockHash,
      actualHash,
      rollbackFrom: safeRollbackFrom.toString(),
    },
    "reorg detected"
  );

  await rollbackFrom(safeRollbackFrom);
  await setState(safeRollbackFrom - 1n, null);
}

export async function runIndexerForever(): Promise<void> {
  logger.info(
    {
      confirmations: config.confirmations,
      reorgSafety: config.reorgSafety,
      pollIntervalMs: config.pollIntervalMs,
    },
    "indexer start"
  );

  while (true) {
    try {
      // Reorg protection
      await reorgCheckAndMaybeRollback();

      // Heads
      const head = await getHead();
      const target = head - BigInt(config.confirmations);

      // update RPC metrics
      l2RpcUp.set({ service: "indexer" }, 1);
      l2RpcHead.set({ service: "indexer" }, clampToSafeNumber(head));
      indexerRpcHead.set(clampToSafeNumber(head));

      const state = await getState();
      const start = state.indexedBlock + 1n;

      // update indexed metrics
      indexerIndexedHead.set(clampToSafeNumber(state.indexedBlock));
      indexerLagBlocks.set(clampToSafeNumber(head - state.indexedBlock));

      if (target < 0n || start > target) {
        await sleep(config.pollIntervalMs);
        continue;
      }

      logger.info(
        {
          head: head.toString(),
          target: target.toString(),
          start: start.toString(),
          confirmations: config.confirmations,
          lag: (head - state.indexedBlock).toString(),
        },
        "indexing"
      );

      for (let n = start; n <= target; n++) {
        const block = await provider.getBlock(Number(n), true);
        if (!block) throw new Error(`Block not found: ${n.toString()}`);
        if (!block.hash) throw new Error(`Block hash is null: ${n.toString()}`);

        await upsertBlockAndTxs(block);
        await setState(BigInt(block.number), block.hash);

        // update metrics as we go
        indexerIndexedHead.set(block.number);
        indexerLagBlocks.set(clampToSafeNumber(head - BigInt(block.number)));
      }
    } catch (e: any) {
      // If the error is RPC-related, mark RPC down for alerts
      const msg = String(e?.message ?? e);
      if (
        msg.includes("ENOTFOUND") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("failed to detect network") ||
        msg.includes("timeout") ||
        msg.includes("NETWORK_ERROR") ||
        msg.includes("SERVER_ERROR")
      ) {
        l2RpcUp.set({ service: "indexer" }, 0);
      }

      logger.error({ err: e?.message ?? e }, "indexer loop error");
      await sleep(Math.min(10_000, config.pollIntervalMs * 2));
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
