import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const map = await readFile(new URL("source/world-map.svg", root), "utf8");
assert.equal((map.match(/class="map-activation"/g) || []).length, 1);
assert.equal((map.match(/class="taiwan-shape"/g) || []).length, 1);
for (const file of ["app.js", "i18n.js", "masonry.js", "entry.js"]) {
  const source = await readFile(new URL("source/static/" + file, root), "utf8");
  assert.doesNotMatch(
    source,
    /HackItRenderStats|innerHTML|document\.write\(|\beval\(/,
  );
}
const manifest = JSON.parse(
  await readFile(new URL("dist/build-manifest.json", root), "utf8"),
);
for (const entry of manifest.files) {
  assert.match(
    entry.path,
    /^(?:\/(?:zh-TW|zh-HK|zh-CN|en)\/index\.html|\/(?:assets\/)?[a-z0-9-]+\.[a-f0-9]{12}\.(?:js|css|svg|png|webp))$/i,
  );
  assert(
    !/\.env|provenance|feedback-locales|mission-locales|site-config|test|README/.test(
      entry.path,
    ),
  );
}
const files = await readdir(new URL("dist/public/", root));
assert(!files.includes(".openai"));
assert.equal(
  (await readFile(new URL("source/static/assets/wall-19.webp", root))).equals(
    await readFile(new URL("source/static/assets/wall-36.webp", root)),
  ),
  true,
  "Credential-bearing original must remain replaced.",
);
assert.equal(
  (await readFile(new URL("source/static/assets/wall-06.webp", root))).equals(
    await readFile(new URL("source/static/assets/wall-03.webp", root)),
  ),
  true,
  "Second credential-bearing original must remain replaced.",
);
console.log(
  "Publication-boundary regressions passed: one active map region, no unsafe DOM/debug globals, allowlisted fingerprinted build, no private source files, safe photo replacement.",
);
