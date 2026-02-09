import { runMigrations } from "./migrate.js";
import { runIndexerForever } from "./indexer.js";
import { logger } from "./logger.js";
import { pool } from "./db.js";


async function main(): Promise<void> {
  await runMigrations();
  await runIndexerForever();
}

main().catch((e) => {
  logger.error({ err: e?.message ?? e }, "fatal");
  pool.end().catch(() => undefined);
  process.exit(1);
});
