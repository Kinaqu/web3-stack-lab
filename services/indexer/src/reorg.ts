import { withClient } from "./db.js";
import { logger } from "./logger.js";


export type IndexerState = {
  indexedBlock: bigint;
  indexedBlockHash: string | null;
};

export async function getState(): Promise<IndexerState> {
  return await withClient(async (client) => {
    const r = await client.query(
      `SELECT indexed_block, indexed_block_hash FROM indexer_state WHERE id = 1`
    );
    const row = r.rows[0];
    return {
      indexedBlock: BigInt(row.indexed_block),
      indexedBlockHash: row.indexed_block_hash ?? null,
    };
  });
}

export async function setState(indexedBlock: bigint, indexedBlockHash: string | null): Promise<void> {
  await withClient(async (client) => {
    await client.query(
      `UPDATE indexer_state
       SET indexed_block = $1, indexed_block_hash = $2, updated_at = now()
       WHERE id = 1`,
      [indexedBlock.toString(), indexedBlockHash]
    );
  });
}

export async function rollbackFrom(blockNumberInclusive: bigint): Promise<void> {
  await withClient(async (client) => {
    logger.warn({ blockNumberInclusive: blockNumberInclusive.toString() }, "rollback start");
    await client.query("BEGIN");
    try {
      await client.query(`DELETE FROM blocks WHERE number >= $1`, [blockNumberInclusive.toString()]);
      // tx удалятся каскадом
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  });
}
