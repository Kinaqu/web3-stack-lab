export type ApiConfig = {
  databaseUrl: string;
  l2RpcUrl: string;
  port: number;
  logLevel: string;
};

function mustGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getNumber(name: string, def: number): number {
  const v = process.env[name];
  if (!v) return def;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid number env ${name}=${v}`);
  return n;
}

export const config: ApiConfig = {
  databaseUrl: mustGet("DATABASE_URL"),
  l2RpcUrl: mustGet("L2_RPC_URL"),
  port: getNumber("PORT", 3001),
  logLevel: process.env.LOG_LEVEL ?? "info",
};
