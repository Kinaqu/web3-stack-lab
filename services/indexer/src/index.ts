import { runMigrations } from "./migrate.js";
import { runIndexerForever } from "./indexer.js";
import { logger } from "./logger.js";
import { pool } from "./db.js";
import { startMetricsServer } from "./metrics.js";


async function main(): Promise<void> {
  await runMigrations();
  startMetricsServer(9102);
  await runIndexerForever();
}

main().catch((e) => {
  logger.error({ err: e?.message ?? e }, "fatal");
  pool.end().catch(() => undefined);
  process.exit(1);
});
