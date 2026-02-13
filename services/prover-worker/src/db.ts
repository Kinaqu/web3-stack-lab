import pg from "pg";
const { Pool } = pg;

export function makePool(databaseUrl: string) {
  return new Pool({ connectionString: databaseUrl });
}

export async function ensureSchema(pool: pg.Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS zkp_jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      request JSONB NOT NULL,
      public_inputs JSONB,
      proof JSONB,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS zkp_jobs_status_idx ON zkp_jobs(status);
  `);
}

export async function setStatus(pool: pg.Pool, id: string, status: string) {
  await pool.query(
    `UPDATE zkp_jobs SET status=$2, updated_at=now() WHERE id=$1`,
    [id, status]
  );
}

export async function setDone(pool: pg.Pool, id: string, publicInputs: any, proof: any) {
  await pool.query(
    `UPDATE zkp_jobs
     SET status='done', public_inputs=$2, proof=$3, error=NULL, updated_at=now()
     WHERE id=$1`,
    [id, publicInputs, proof]
  );
}

export async function setFailed(pool: pg.Pool, id: string, error: string) {
  await pool.query(
    `UPDATE zkp_jobs
     SET status='failed', error=$2, updated_at=now()
     WHERE id=$1`,
    [id, error]
  );
}
