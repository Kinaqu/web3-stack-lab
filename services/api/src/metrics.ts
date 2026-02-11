import http from "node:http";
import client from "prom-client";

client.collectDefaultMetrics({ prefix: "api_" });

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

export const dbUp = new client.Gauge({
  name: "db_up",
  help: "Whether DB is reachable (1=up, 0=down)",
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
    // eslint-disable-next-line no-console
    console.log(`[api] metrics listening on 0.0.0.0:${port}`);
  });
}
