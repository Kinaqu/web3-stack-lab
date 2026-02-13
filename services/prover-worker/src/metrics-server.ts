import http from "node:http";
import { registry } from "./metrics.js";

export function startMetricsServer(port: number) {
  const server = http.createServer(async (req, res) => {
    if (req.url === "/metrics") {
      res.statusCode = 200;
      res.setHeader("Content-Type", registry.contentType);
      res.end(await registry.metrics());
      return;
    }
    res.statusCode = 404;
    res.end("not found");
  });

  server.listen(port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`[info] metrics listening on :${port}/metrics`);
  });

  return server;
}
