import { Pool } from "pg";
import { config } from "./config.js";


export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

export async function withClient<T>(fn: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
