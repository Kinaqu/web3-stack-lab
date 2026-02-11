import http from "node:http";
import client from "prom-client";
import { logger } from "./logger.js";

client.collectDefaultMetrics({ prefix: "indexer_" });

export const indexerIndexedHead = new client.Gauge({
  name: "indexer_indexed_head",
  help: "Last indexed block number",
});

export const indexerRpcHead = new client.Gauge({
  name: "indexer_rpc_head",
  help: "Current RPC head block number",
});

export const indexerLagBlocks = new client.Gauge({
  name: "indexer_lag_blocks",
  help: "Lag in blocks between rpc head and indexed head",
});

export const l2RpcUp = new client.Gauge({
  name: "l2_rpc_up",
  help: "Whether L2 RPC is reachable (1=up, 0=down)",
  labelNames: ["service"],
});

export const l2RpcHead = new client.Gauge({
  name: "l2_rpc_head",
  help: "Latest L2 block number observed via RPC",
  labelNames: ["service"],
});

export function startMetricsServer(port: number): void {
  const server = http.createServer(async (req, res) => {
    if (req.url !== "/metrics") {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.setHeader("Content-Type", client.register.contentType);
    res.writeHead(200);
    res.end(await client.register.metrics());
  });

  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "metrics server listening");
  });
}
