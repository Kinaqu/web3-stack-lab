export type Config = {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  queueName: string;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
};

export function loadConfig(): Config {
  const port = Number(process.env.PORT ?? "8080");
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const redisUrl = process.env.REDIS_URL ?? "";
  const queueName = process.env.QUEUE_NAME ?? "prove";
  const logLevel = (process.env.LOG_LEVEL ?? "info") as Config["logLevel"];

  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  if (!redisUrl) throw new Error("REDIS_URL is required");

  return { port, databaseUrl, redisUrl, queueName, logLevel };
}
