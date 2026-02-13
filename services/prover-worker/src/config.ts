export type Config = {
  databaseUrl: string;
  redisUrl: string;
  queueName: string;
  concurrency: number;
  logLevel: string;
  metricsPort: number;
};

export function loadConfig(): Config {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const redisUrl = process.env.REDIS_URL ?? "";
  const queueName = process.env.QUEUE_NAME ?? "prove";
  const concurrency = Number(process.env.WORKER_CONCURRENCY ?? "2");
  const logLevel = process.env.LOG_LEVEL ?? "info";
  const metricsPort = Number(process.env.METRICS_PORT ?? "9101");

  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  if (!redisUrl) throw new Error("REDIS_URL is required");

  return { databaseUrl, redisUrl, queueName, concurrency, logLevel, metricsPort };
}
