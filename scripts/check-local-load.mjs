import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { readdir } from "node:fs/promises";
import { loadConfiguration } from "../server/config.mjs";
import { createSiteServer } from "../server/runtime.mjs";

// This bounded concurrency smoke test creates its own loopback-only service.
// It has no option to target a public or third-party service.
assert.equal(
  process.argv.length,
  2,
  "This check accepts no remote target or load overrides.",
);
const configuration = await loadConfiguration();
const server = await createSiteServer(configuration);
const agent = new http.Agent({ keepAlive: true, maxSockets: 16 });
const stylesheet = (await readdir(configuration.publicDir)).find((file) =>
  /^style(?:\.[a-f0-9]{12})?\.css$/.test(file),
);
assert(stylesheet);
const paths = ["/en/", "/zh-TW/", "/" + stylesheet, "/healthz", "/api/locale"];
const count = 1200;
const durations = [];
let next = 0;
try {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  const start = performance.now();
  async function worker() {
    while (next < count) {
      const index = next++;
      const requestStart = performance.now();
      await new Promise((resolve, reject) => {
        const request = http.get(
          {
            hostname: "127.0.0.1",
            port,
            path: paths[index % paths.length],
            agent,
            headers: { "Accept-Encoding": "gzip" },
            timeout: 5000,
          },
          (response) => {
            if (response.statusCode !== 200)
              reject(new Error("Unexpected status " + response.statusCode));
            response.resume();
            response.on("end", resolve);
            response.on("error", reject);
          },
        );
        request.on("error", reject);
        request.on("timeout", () =>
          request.destroy(new Error("Local request timed out.")),
        );
      });
      durations.push(performance.now() - requestStart);
    }
  }
  await Promise.all(Array.from({ length: 16 }, worker));
  durations.sort((a, b) => a - b);
  const percentile = (p) =>
    Number(
      durations[
        Math.min(durations.length - 1, Math.floor(durations.length * p))
      ].toFixed(2),
    );
  assert.equal(durations.length, count);
  console.log(
    JSON.stringify({
      kind: "bounded local concurrency smoke; client and server share one process",
      requests: count,
      concurrency: 16,
      failures: 0,
      durationMs: Number((performance.now() - start).toFixed(2)),
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      p99Ms: percentile(0.99),
    }),
  );
} finally {
  agent.destroy();
  server.closeAllConnections();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
}
