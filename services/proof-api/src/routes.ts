import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { Queue } from "bullmq";
import { getJob, insertJob, listJobs  } from "./db.js";
import { httpRequestsTotal, proofJobsCreatedTotal, registry } from "./metrics.js";

type Deps = {
  pool: Pool;
  queue: Queue;
};

export async function registerRoutes(app: FastifyInstance, deps: Deps) {
  app.addHook("onResponse", async (req, reply) => {
    const route = (req.routeOptions?.url ?? "unknown").toString();
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: String(reply.statusCode)
    });
  });

  app.get("/health", async () => {
    return { ok: true };
  });

  app.get("/metrics", async (_req, reply) => {
    reply.header("Content-Type", registry.contentType);
    return registry.metrics();
  });

  // POST /proofs -> create job (stub)
  app.post("/proofs", async (req, reply) => {
    const body = (req.body ?? {}) as any;

    // minimal "request" payload (you can extend later)
    const request = {
      root: body.root ?? null,
      user: body.user ?? null,
      epoch: body.epoch ?? null,
      leaf: body.leaf ?? null
    };

    const id = randomUUID();
    if (!request.root || !request.user || request.epoch === null || request.epoch === undefined || !request.leaf) {
    reply.code(400);
    return { error: "bad_request", message: "root, user, epoch, leaf are required" };
    }

    await insertJob(deps.pool, id, request);

    await deps.queue.add(
    "prove",
    { jobId: id, request },
    { removeOnComplete: true, removeOnFail: false }
    );

    proofJobsCreatedTotal.inc();
    reply.code(202);
    return { id, status: "queued" };
  });

  // GET /proofs/:id -> status + proof/publicInputs when ready
  app.get("/proofs/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const job = await getJob(deps.pool, id);
    if (!job) {
      reply.code(404);
      return { error: "not_found" };
    }
    return {
      id: job.id,
      status: job.status,
      request: job.request,
      publicInputs: job.public_inputs,
      proof: job.proof,
      error: job.error,
      createdAt: job.created_at,
      updatedAt: job.updated_at
    };
  });


  app.get("/proofs", async (req) => {
  const limit = Math.min(Number((req.query as any)?.limit ?? 20), 100);
  const jobs = await listJobs(deps.pool, limit);
  return jobs.map((j) => ({
    id: j.id,
    status: j.status,
    createdAt: j.created_at,
    updatedAt: j.updated_at
  }));
});

}


