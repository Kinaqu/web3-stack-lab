import client from "prom-client";

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const jobsProcessedTotal = new client.Counter({
  name: "prover_worker_jobs_processed_total",
  help: "Total jobs processed",
  labelNames: ["result"] as const,
  registers: [registry]
});

export const jobDurationSeconds = new client.Histogram({
  name: "prover_worker_job_duration_seconds",
  help: "Job processing duration (seconds)",
  buckets: [0.5, 1, 2, 5, 10, 20, 30],
  registers: [registry]
});
