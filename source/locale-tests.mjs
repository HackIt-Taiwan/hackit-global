import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const path = new URL("./static/i18n.js", import.meta.url);
const sandbox = { module: { exports: {} }, URL };
vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox);
const {
  localizedStructuredData,
  resolveLocale: resolve,
  valid,
  pathLocale,
  localePathURL,
  localeCookie,
  browserLocale,
  countryLocale,
  readSaved,
  LOCALES,
  D,
  QUOTES,
  QUOTE_CREDITS,
  PHOTO_ALTS,
  STORIES,
  displayExcerpt,
  MISSION_HEADINGS,
  missionBlocks,
  renderMissionBlock,
} = sandbox.module.exports;
let cases = 0;
function eq(actual, expected) {
  assert.equal(actual, expected);
  cases++;
}
eq(
  resolve({ url: "en", saved: "zh-HK", country: "TW", languages: ["zh-CN"] }),
  "en",
);
eq(
  resolve({ url: "junk", saved: "zh-HK", country: "TW", languages: ["en"] }),
  "zh-HK",
);
eq(resolve({ saved: "zh-CN", country: "HK" }), "zh-CN");
eq(
  resolve({
    url: "en",
    path: "/zh-TW/",
    saved: "zh-HK",
    country: "CN",
    languages: ["zh-CN"],
  }),
  "en",
);
eq(
  resolve({
    url: "bad",
    path: "/zh-TW/",
    saved: "zh-HK",
    country: "CN",
    languages: ["en"],
  }),
  "zh-TW",
);
eq(resolve({ path: "/zh-HK/", saved: "en", country: "TW" }), "zh-HK");
eq(resolve({ path: "/bad/", saved: "zh-CN", country: "HK" }), "zh-CN");
eq(resolve({ path: "/", country: "HK", languages: ["en"] }), "zh-HK");
for (const locale of LOCALES) {
  eq(pathLocale("/" + locale + "/"), locale);
  eq(pathLocale("/" + locale), locale);
  eq(pathLocale("/" + locale + "/nested"), locale);
  eq(pathLocale("/" + locale.toLowerCase() + "/"), locale);
  const url = localePathURL(
    "https://example.com/en/?foo=1&lang=zh-HK&bar=a%20b#mission",
    locale,
  );
  eq(url.pathname, "/" + locale + "/");
  eq(url.searchParams.has("lang"), false);
  eq(url.searchParams.get("foo"), "1");
  eq(url.searchParams.get("bar"), "a b");
  eq(url.hash, "#mission");
  eq(url.origin, "https://example.com");
}
for (const locale of LOCALES) {
  eq(
    localeCookie(locale, true),
    "hackit-locale=" +
      locale +
      "; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
  );
  eq(
    localeCookie(locale, false),
    "hackit-locale=" + locale + "; Path=/; Max-Age=31536000; SameSite=Lax",
  );
}
assert.throws(() => localeCookie("bad; injected=1"));
cases++;
eq(pathLocale("/english/"), null);
eq(pathLocale("/zh-TWextra/"), null);
eq(pathLocale("/"), null);
eq(pathLocale(null), null);
assert.throws(() => localePathURL("https://example.com/", "bad"));
cases++;

eq(resolve({ country: "TW", languages: ["en"] }), "zh-TW");
eq(resolve({ country: "HK", languages: ["zh-CN"] }), "zh-HK");
eq(resolve({ country: "CN", languages: ["zh-TW"] }), "zh-CN");
eq(resolve({ country: "JP", languages: ["zh-TW"] }), "en");
eq(resolve({ country: "MO", languages: ["zh-HK"] }), "en");
eq(resolve({ country: null, languages: ["zh-HK"] }), "zh-HK");
eq(resolve({ country: "XX", languages: ["zh-Hant-TW"] }), "zh-TW");
eq(resolve({ country: "T1", languages: ["zh-Hant-HK"] }), "zh-HK");
eq(resolve({ country: "invalid", languages: ["en-US"] }), "en");
eq(resolve({ country: "ZZ", languages: ["fr-FR", "en-GB"] }), "en");
eq(resolve({ languages: ["fr-FR"] }), "zh-TW");
eq(resolve({}), "zh-TW");
eq(valid("ZH-tw"), "zh-TW");
eq(valid("zh"), null);
eq(valid("<script>"), null);
eq(browserLocale(["fr", "zh-Hans"]), "zh-CN");
eq(browserLocale(["zh-Hant"]), "zh-TW");
eq(countryLocale("tw"), "zh-TW");
eq(countryLocale("XY"), null);
eq(resolve({ country: "EN", languages: ["zh-HK"] }), "zh-HK");
eq(countryLocale(null), null);
eq(
  readSaved({
    getItem() {
      throw Error("blocked storage");
    },
  }),
  null,
);
eq(
  readSaved({
    getItem() {
      return "en";
    },
  }),
  "en",
);
eq(
  readSaved({
    getItem() {
      return "bad";
    },
  }),
  null,
);
for (const locale of LOCALES) {
  const original = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://example.com/#organization",
        description: "old",
        sameAs: ["https://hackit.tw"],
      },
      {
        "@type": "WebPage",
        "@id": "old",
        url: "old",
        inLanguage: "old",
        name: "old",
        description: "old",
      },
      { "@type": "WebSite", url: "https://example.com/" },
    ],
  };
  const canonical = "https://example.com/" + locale + "/",
    graph = localizedStructuredData(original, locale, canonical),
    page = graph["@graph"][1];
  eq(page.url, canonical);
  eq(page["@id"], canonical + "#webpage");
  eq(page.inLanguage, locale);
  eq(page.name, D[locale].title);
  eq(page.description, D[locale].description);
  eq(graph["@graph"][0].description, D[locale].description);
  eq(graph["@graph"][0]["@id"], original["@graph"][0]["@id"]);
  eq(graph["@graph"][2].url, "https://example.com/");
  eq(original["@graph"][1].url, "old");
}
const curated = JSON.parse(
  fs.readFileSync(new URL("./feedback-locales.json", import.meta.url), "utf8"),
);
const provenance = JSON.parse(
  fs.readFileSync(new URL("./wall-provenance.json", import.meta.url), "utf8"),
);
const keys = Object.keys(D["zh-TW"]).sort();
// Exercise the actual rendering helper with a minimal DOM text-node model.
class TestNode {
  constructor(tag, text = "") {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.raw = text;
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  get textContent() {
    return this.raw + this.children.map((n) => n.textContent).join("");
  }
  set textContent(value) {
    this.raw = String(value);
    this.children = [];
  }
}
const testDoc = {
  createElement(tag) {
    return new TestNode(tag);
  },
  createTextNode(text) {
    return new TestNode("#text", text);
  },
};
for (const locale of LOCALES) {
  for (const block of missionBlocks(locale)) {
    const node = renderMissionBlock(testDoc, block);
    eq(node.textContent, block.text);
    if (block.sectionIndex === 5) {
      eq(node.children.filter((n) => n.className === "force-row").length, 3);
      eq(
        node.children
          .filter((n) => n.tagName === "#text")
          .map((n) => n.textContent)
          .join(""),
        "\n\n",
      );
    }
    if (block.sectionIndex === 7) {
      eq(node.children[1].className, "formula-power-marker");
      eq(node.children[1].textContent, "^");
      eq(node.children[2].tagName, "sup");
      eq(node.children[2].className, "formula-exponent");
      eq(
        node.children[2].textContent,
        block.text.slice(block.text.indexOf("^") + 1),
      );
    }
  }
}

for (const locale of LOCALES) {
  const blocks = missionBlocks(locale),
    paragraphs = blocks.filter((b) => b.tag === "p"),
    headings = blocks.filter((b) => b.tag === "h3");
  eq(paragraphs.length, 9);
  eq(headings.length, 5);
  eq(
    JSON.stringify(paragraphs.map((b) => b.text)),
    JSON.stringify(D[locale].missionSections),
  );
  eq(Object.keys(MISSION_HEADINGS[locale]).join(","), "2,3,4,5,7");
  for (const heading of headings) {
    eq(heading.editorial, true);
    eq(heading.className, "mission-section-title");
    assert.ok(heading.text.length);
    cases++;
  }
  for (const index of [2, 3, 4, 5, 7]) {
    const at = blocks.findIndex((b) => b.sectionIndex === index);
    eq(blocks[at - 1].text, MISSION_HEADINGS[locale][index]);
  }
  eq(paragraphs[5].text, D[locale].missionSections[5]);
  eq(paragraphs[7].text, D[locale].missionSections[7]);
}

const mission = JSON.parse(
  fs.readFileSync(new URL("./mission-locales.json", import.meta.url), "utf8"),
);
for (const locale of LOCALES) {
  eq(D[locale].missionSections.length, 9);
  eq(
    JSON.stringify(D[locale].missionSections),
    JSON.stringify(mission.locales[locale]),
  );
  eq(D[locale].missionSections[0], D[locale].missionLead);
  eq(D[locale].missionSections[5].split("\n").length, 3);
  eq(D[locale].missionSections[6].split("\n").length, 2);
  assert.ok(/13[‒–]23/.test(D[locale].missionSections[3]));
  cases++;
  eq((D[locale].missionSections[7].match(/×/g) || []).length, 3);
  assert.ok(D[locale].missionSections[7].includes("^"));
  cases++;
}
eq(
  D["zh-TW"].missionSections[7],
  "未來的設計者 =（勇氣 × 創新力 × 執行力）^（協作 × 工具槓桿）",
);
eq(
  D["zh-TW"].missionSections[8],
  "——用勇氣啟動、以創新尋路、靠執行抵達，並讓社群協作與科技放大改變的力量。",
);
eq(
  JSON.stringify(D["zh-HK"].missionSections),
  JSON.stringify(D["zh-TW"].missionSections),
);
eq(mission.source.section, "2.1. HackIt 使命");
eq(mission.source.pdfPage, 8);
eq(mission.source.printedPage, 7);

eq(
  D["zh-TW"].missionLead,
  "HackIt 的使命，是讓年輕 Builder 在親手改變世界的過程中，成為勇於冒險、持續成長、並相信自己力量的未來設計者。",
);
for (const locale of LOCALES) {
  eq(D[locale].readingCopy, D[locale].missionLead);
  assert.deepEqual(D[locale].readingTitle, D[locale].mission);
  cases++;
  eq(Object.hasOwn(D[locale], "missionCopy"), false);
}
eq(D["zh-TW"].belief, "我們的使命");
eq(D["en"].belief, "Our mission");

for (const locale of LOCALES)
  for (const key of [
    "activitiesTitle",
    "activitiesCopy",
    "beyondTitle",
    "beyondCopy",
  ]) {
    eq(Object.hasOwn(D[locale], key), false);
  }
assert.ok(!fs.readFileSync(path, "utf8").includes("[data-intro="));
cases++;
for (const locale of LOCALES) {
  assert.deepEqual(Object.keys(D[locale]).sort(), keys);
  cases++;
  for (const [k, v] of Object.entries(D[locale])) {
    assert.ok(
      typeof v === "string"
        ? v.length
        : Array.isArray(v) &&
            v.length &&
            v.every((s) => typeof s === "string" && s.length),
      `${locale}.${k} is complete`,
    );
    cases++;
  }
  eq(QUOTES[locale].length, curated.quotes.length);
  eq(QUOTE_CREDITS[locale].length, curated.quotes.length);
  eq(PHOTO_ALTS[locale].length, provenance.photos.length);
  for (const s of [
    ...QUOTES[locale],
    ...QUOTE_CREDITS[locale],
    ...PHOTO_ALTS[locale],
  ]) {
    assert.ok(typeof s === "string" && s.length && !s.includes("undefined"));
    cases++;
  }
}

for (const locale of LOCALES)
  curated.quotes.forEach((q, i) => {
    eq(QUOTES[locale][i], q.locales[locale].text);
    eq(
      QUOTE_CREDITS[locale][i],
      q.locales[locale].credit + " · " + q.locales[locale].renderingLabel,
    );
  });

provenance.photos.forEach((p, i) => {
  eq(PHOTO_ALTS["zh-TW"][i], p.alt);
  assert.ok(
    fs.existsSync(new URL("./static/assets/" + p.file, import.meta.url)),
    p.file + " exists",
  );
  cases++;
});
for (const locale of LOCALES) {
  eq(STORIES[locale].length, (curated.stories || []).length);
  for (const [i, story] of STORIES[locale].entries()) {
    const original = curated.stories[i].locales[locale];
    for (const field of [
      "title",
      "summary",
      "text",
      "credit",
      "renderingLabel",
    ])
      eq(story[field], original[field]);
    assert.ok(
      story.title && story.text && story.credit && story.renderingLabel,
    );
    cases++;
  }
}
eq(D["en"].storySummaryLabel, "Editorial summary · Full reflection available");
eq(D["zh-TW"].storySummaryLabel, "編輯摘要；可展開閱讀全文");
eq(D["zh-HK"].storySummaryLabel, "編輯摘要；可展開閱讀全文");
eq(D["zh-CN"].storySummaryLabel, "编辑摘要；可展开阅读全文");
eq(displayExcerpt("first **3D 模型** last"), "first 3D 模型 last");
eq(displayExcerpt("<script>"), "<" + "script>");
assert.ok(!/footer>span/.test(fs.readFileSync(path, "utf8")));
cases++;
assert.ok(
  fs
    .readFileSync(path, "utf8")
    .includes(".ssr-story-full[data-ssr-story-index]"),
);
cases++;
for (const locale of LOCALES)
  for (const story of STORIES[locale]) {
    eq(story.text.split("\n\n").join("\n\n"), story.text);
  }

console.log(
  `${cases} locale assertions passed: four full dictionaries, ${provenance.photos.length} image descriptions each, ${curated.quotes.length} curated feedback localizations and ${(curated.stories || []).length} long stories each, complete nine-section mission in all locales, preference precedence and storage failures.`,
);
