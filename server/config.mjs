import { readFile, lstat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export function validateSiteConfig(input) {
  if (
    !input ||
    !["private", "public"].includes(input.visibility) ||
    typeof input.indexing !== "boolean"
  ) {
    throw new Error(
      "Site configuration requires an explicit visibility and indexing boolean.",
    );
  }
  let url;
  try {
    url = new URL(input.origin);
  } catch {
    throw new Error("Site configuration requires a valid canonical origin.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "The canonical origin must be an HTTPS origin without credentials, port, or path.",
    );
  }
  if (input.visibility === "private" && input.indexing)
    throw new Error("Private builds cannot enable indexing.");
  if (
    input.visibility === "public" &&
    url.origin !== "https://www.hackit.global"
  ) {
    throw new Error(
      "The production canonical origin must be https://www.hackit.global.",
    );
  }
  return Object.freeze({
    origin: url.origin,
    visibility: input.visibility,
    indexing: input.indexing,
  });
}

export async function loadConfiguration(env = process.env) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  let built = false;
  try {
    built = (await lstat(resolve(root, "dist/public"))).isDirectory();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const publicDir = resolve(root, built ? "dist/public" : "source/static");
  const configPath = resolve(
    root,
    built ? "dist/site-config.json" : "source/site-config.json",
  );
  const site = validateSiteConfig(
    JSON.parse(await readFile(configPath, "utf8")),
  );
  const port = env.PORT === undefined ? 3000 : Number(env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be an integer from 1 to 65535.");
  const host = env.HOST || "0.0.0.0";
  if (!["0.0.0.0", "127.0.0.1", "::", "::1"].includes(host))
    throw new Error("HOST must be a supported bind address.");
  return { publicDir, site, port, host };
}
