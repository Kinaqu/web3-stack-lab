import { loadConfig } from "./config.js";
import { makePool, ensureSchema } from "./db.js";
import { startWorker } from "./worker.js";
import { startMetricsServer } from "./metrics-server.js";


async function main() {
  const cfg = loadConfig();

  const logger = {
    info: (...args: any[]) => console.log("[info]", ...args),
    error: (...args: any[]) => console.error("[error]", ...args)
  };

  const pool = makePool(cfg.databaseUrl);
  await ensureSchema(pool);

  startWorker({
    redisUrl: cfg.redisUrl,
    queueName: cfg.queueName,
    concurrency: cfg.concurrency,
    pool,
    logger
  });

  startMetricsServer(cfg.metricsPort);

  logger.info("prover-worker started");
  // keep process alive
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise<void>(() => {});
}



main().catch((err) => {
  console.error(err);
  process.exit(1);
});
