import { loadConfiguration } from "./config.mjs";
import { createSiteServer } from "./runtime.mjs";

try {
  const configuration = await loadConfiguration();
  const server = await createSiteServer(configuration);
  server.on("error", () => {
    console.error("Server failed to listen.");
    process.exitCode = 1;
  });
  server.listen(configuration.port, configuration.host, () =>
    console.log("HackIt server listening on port " + configuration.port + "."),
  );
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    console.log("HackIt server shutting down.");
    const deadline = setTimeout(() => {
      server.closeAllConnections();
      process.exit(1);
    }, 10_000);
    deadline.unref();
    server.close(() => {
      clearTimeout(deadline);
      process.exitCode = 0;
    });
    server.closeIdleConnections();
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
} catch {
  // Do not log filesystem paths, configuration contents, or visitor data.
  console.error(
    "Server startup failed. Verify the built public assets and explicit site configuration.",
  );
  process.exitCode = 1;
}
