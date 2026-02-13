import Fastify from "fastify";
import { loadConfig } from "./config.js";
import { makePool, ensureSchema } from "./db.js";
import { makeQueue } from "./queue.js";
import { registerRoutes } from "./routes.js";

async function main() {
  const cfg = loadConfig();

  const app = Fastify({
    logger: { level: cfg.logLevel }
  });

  const pool = makePool(cfg.databaseUrl);
  await ensureSchema(pool);

  const queue = makeQueue(cfg.redisUrl, cfg.queueName);

  await registerRoutes(app, { pool, queue });

  await app.listen({ host: "0.0.0.0", port: cfg.port });
  app.log.info({ port: cfg.port }, "proof-api listening");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
