import Fastify from "fastify";
import { config } from "./config.js";
import { registerRoutes } from "./routes.js";
import { pool } from "./db.js";
import { startMetricsServer } from "./metrics.js";



async function main(): Promise<void> {
  const app = Fastify({ logger: { level: config.logLevel } });




  await registerRoutes(app);

  app.addHook("onClose", async () => {
    await pool.end();
  });

  startMetricsServer(9101);

  await app.listen({ host: "0.0.0.0", port: config.port });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
