import client from "prom-client";

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new client.Counter({
  name: "proof_api_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"] as const,
  registers: [registry]
});

export const proofJobsCreatedTotal = new client.Counter({
  name: "proof_api_jobs_created_total",
  help: "Total proof jobs created",
  registers: [registry]
});
