import { Worker } from "bullmq";
import type { Pool } from "pg";
import { setDone, setFailed, setStatus } from "./db.js";
import { jobsProcessedTotal, jobDurationSeconds } from "./metrics.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function startWorker(opts: {
  redisUrl: string;
  queueName: string;
  concurrency: number;
  pool: Pool;
  logger: { info: Function; error: Function };
}) {
  const worker = new Worker(
    opts.queueName,
    async (job) => {
      const end = jobDurationSeconds.startTimer();
      const jobId = (job.data?.jobId ?? "") as string;
      if (!jobId) throw new Error("missing jobId");

      opts.logger.info({ jobId }, "job started");
      await setStatus(opts.pool, jobId, "running");

      // STUB proving
      await sleep(1500);

    const req = (job.data?.request ?? {}) as any;

    const publicInputs = {
    root: req.root ?? null,
    user: req.user ?? null,
    epoch: req.epoch ?? null
    };


      const proof = {
        // placeholder proof blob
        pi_a: ["0x0", "0x0"],
        pi_b: [["0x0", "0x0"], ["0x0", "0x0"]],
        pi_c: ["0x0", "0x0"]
      };

      await setDone(opts.pool, jobId, publicInputs, proof);
      opts.logger.info({ jobId }, "job done");

      jobsProcessedTotal.inc({ result: "done" });
      end();
      return { ok: true };
    },
    {
      connection: { url: opts.redisUrl },
      concurrency: opts.concurrency
    }
  );

  worker.on("failed", async (job, err) => {
    const jobId = (job?.data?.jobId ?? "") as string;
    opts.logger.error({ jobId, err: err?.message }, "job failed");
    if (jobId) {
      await setFailed(opts.pool, jobId, err?.message ?? "unknown error");
    }
    jobsProcessedTotal.inc({ result: "failed" });
  });

  return worker;
}
