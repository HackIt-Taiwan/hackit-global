import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = new URL("..", import.meta.url);
const sandbox = { module: { exports: {} } };
vm.runInNewContext(
  await readFile(new URL("source/static/i18n.js", root), "utf8"),
  sandbox,
);
const api = sandbox.module.exports;
const config = JSON.parse(
  await readFile(new URL("source/site-config.json", root), "utf8"),
);
const origin = new URL(config.origin);
if (
  origin.protocol !== "https:" ||
  origin.username ||
  origin.password ||
  origin.search ||
  origin.hash ||
  origin.pathname !== "/"
) {
  throw new Error(
    "Site origin must be an HTTPS origin without credentials, path, query, or fragment.",
  );
}
if (
  !["private", "public"].includes(config.visibility) ||
  typeof config.indexing !== "boolean" ||
  (config.visibility === "private" && config.indexing)
) {
  throw new Error(
    "Site visibility and indexing must be configured explicitly and consistently.",
  );
}
const payload = {
  origin: origin.origin,
  indexing: config.indexing,
  locales: api.LOCALES,
  dictionaries: api.D,
  quotes: api.QUOTES,
  credits: api.QUOTE_CREDITS,
  photoAlts: api.PHOTO_ALTS,
  stories: api.STORIES,
  missionBlocks: Object.fromEntries(
    api.LOCALES.map((locale) => [locale, api.missionBlocks(locale)]),
  ),
};
const result = spawnSync(
  process.env.PYTHON || "python3",
  ["scripts/render-locales.py"],
  {
    cwd: fileURLToPath(root),
    input: JSON.stringify(payload),
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  },
);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
