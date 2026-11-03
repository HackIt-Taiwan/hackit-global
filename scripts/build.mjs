import { readFile, writeFile, readdir, mkdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { extname, dirname, basename } from "node:path";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";

const root = new URL("..", import.meta.url);
const input = new URL("source/static/", root);
const dist = new URL("dist/", root);
const publicRoot = new URL("public/", dist);
const config = JSON.parse(
  await readFile(new URL("source/site-config.json", root), "utf8"),
);
const locales = ["zh-TW", "zh-HK", "zh-CN", "en"];
const files = [
  "entry.css",
  "entry.js",
  "style.css",
  "app.js",
  "i18n.js",
  "masonry.js",
];
for (const entry of await readdir(new URL("assets/", input), {
  withFileTypes: true,
})) {
  if (!entry.isFile() || !/^[a-z0-9-]+\.(?:png|webp|svg)$/i.test(entry.name))
    throw new Error("Unexpected asset entry.");
  files.push("assets/" + entry.name);
}
const sources = new Map(
  await Promise.all(
    files.map(async (file) => [file, await readFile(new URL(file, input))]),
  ),
);
const fingerprints = new Map();
for (const [file, bytes] of sources) {
  const extension = extname(file);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  fingerprints.set(
    file,
    (dirname(file) === "." ? "" : dirname(file) + "/") +
      basename(file, extension) +
      "." +
      hash +
      extension,
  );
}
function rewrite(text) {
  for (const [from, to] of fingerprints) text = text.replaceAll(from, to);
  return text;
}
await rm(dist, { recursive: true, force: true });
await mkdir(publicRoot, { recursive: true });
const report = { files: [], bytes: 0 };
async function emit(file, bytes, compress) {
  const target = new URL(file, publicRoot);
  await mkdir(new URL("./", target), { recursive: true });
  await writeFile(target, bytes);
  report.files.push({
    path: "/" + file,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  report.bytes += bytes.length;
  if (compress) {
    await writeFile(
      new URL(file + ".gz", publicRoot),
      gzipSync(bytes, { level: 9 }),
    );
    await writeFile(
      new URL(file + ".br", publicRoot),
      brotliCompressSync(bytes, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 9 },
      }),
    );
  }
}
for (const [file, bytes] of sources) {
  const textual = /\.(?:css|js|svg)$/.test(file);
  const output = textual ? Buffer.from(rewrite(bytes.toString("utf8"))) : bytes;
  if (textual && !output.equals(bytes))
    throw new Error(
      "Unexpected nested asset dependency; update fingerprint ordering before release.",
    );
  await emit(fingerprints.get(file), output, textual);
}
for (const locale of locales)
  await emit(
    locale + "/index.html",
    Buffer.from(
      rewrite(await readFile(new URL(locale + "/index.html", input), "utf8")),
    ),
    true,
  );
await writeFile(
  new URL("site-config.json", dist),
  JSON.stringify(config, null, 2) + "\n",
);
await writeFile(
  new URL("build-manifest.json", dist),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  "Built " +
    report.files.length +
    " public files (" +
    report.bytes +
    " bytes), with content fingerprints and compressed text.",
);
