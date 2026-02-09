import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withClient } from "./db.js";
import { logger } from "./logger.js";

function migrationsDirPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // dist/migrate.js -> dist/../migrations
  return path.resolve(__dirname, "..", "migrations");
}

export async function runMigrations(): Promise<void> {
  const migrationsDir = migrationsDirPath();
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await withClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    for (const file of files) {
      const res = await client.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [file]);
      if (res.rowCount && res.rowCount > 0) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      logger.info({ file }, "applying migration");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
  });
}
