import pg from "pg";
const { Pool } = pg;

export type JobRow = {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  request: any;
  public_inputs: any | null;
  proof: any | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

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

export async function insertJob(pool: pg.Pool, id: string, request: any) {
  await pool.query(
    `INSERT INTO zkp_jobs (id, status, request) VALUES ($1, 'queued', $2)`,
    [id, request]
  );
}

export async function getJob(pool: pg.Pool, id: string): Promise<JobRow | null> {
  const res = await pool.query(`SELECT * FROM zkp_jobs WHERE id=$1`, [id]);
  return res.rows[0] ?? null;
}


export async function listJobs(pool: pg.Pool, limit: number): Promise<JobRow[]> {
  const res = await pool.query(
    `SELECT * FROM zkp_jobs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows as JobRow[];
}
