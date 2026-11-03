import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("..", import.meta.url);
const box = { module: { exports: {} } };
vm.runInNewContext(
  await readFile(new URL("source/static/i18n.js", root), "utf8"),
  box,
);
const api = box.module.exports;
const config = JSON.parse(
  await readFile(new URL("source/site-config.json", root), "utf8"),
);
let checks = 0;
for (const locale of api.LOCALES) {
  const page = await readFile(
    new URL("dist/public/" + locale + "/index.html", root),
    "utf8",
  );
  const d = api.D[locale];
  assert.equal(api.QUOTES[locale].length, 16);
  assert.equal(api.PHOTO_ALTS[locale].length, 42);
  assert.equal(d.missionSections.length, 9);
  assert(page.includes('lang="' + locale + '"'));
  assert(page.includes('<base href="/">'));
  assert(
    page.includes(
      'rel="canonical" href="' + config.origin + "/" + locale + '/"',
    ),
  );
  assert(
    page.includes(
      'name="robots" content="' +
        (config.indexing
          ? "index,follow,max-image-preview:large"
          : "noindex,nofollow") +
        '"',
    ),
  );
  for (const other of api.LOCALES)
    assert(
      page.includes(
        'hreflang="' + other + '" href="' + config.origin + "/" + other + '/"',
      ),
    );
  const text = page
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
  for (const paragraph of d.missionSections) {
    assert(
      text.includes(paragraph),
      locale + " missing complete mission paragraph",
    );
    checks++;
  }
  for (const story of api.STORIES[locale]) {
    assert(text.includes(story.title));
    for (const paragraph of story.text.split("\n\n"))
      assert(text.includes(paragraph));
    checks++;
  }
  for (const quote of api.QUOTES[locale]) {
    assert(
      text.includes(api.displayExcerpt(quote)),
      locale + " missing full curated quote",
    );
    checks++;
  }
  assert.equal((page.match(/class="ssr-story-full"/g) || []).length, 3);
  assert.equal((page.match(/rel="canonical"/g) || []).length, 1);
  assert.doesNotMatch(page, /\son(?:load|error|click)=/);
  assert.doesNotMatch(page, /https:\/\/example\.invalid/);
  assert(page.includes('name="twitter:card" content="summary_large_image"'));
  assert(
    page.includes(
      'property="og:image" content="' +
        config.origin +
        "/assets/hackit-transparent.",
    ),
  );
  const graph = JSON.parse(
    page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
  );
  assert.equal(graph["@graph"][0].name, "HackIt");
  assert.equal(graph["@graph"][0].url, config.origin + "/");
  assert.equal(graph["@graph"][1].inLanguage, locale);
  for (const image of api.PHOTO_ALTS[locale])
    assert(page.includes(image.replaceAll("&", "&amp;")));
}
console.log(
  checks +
    " complete-content assertions passed across four prerendered locales, with configured canonical/hreflang/JSON-LD and social metadata.",
);
