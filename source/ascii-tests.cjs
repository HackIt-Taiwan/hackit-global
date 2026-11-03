const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const source = fs.readFileSync(__dirname + "/static/app.js", "utf8");
const code = source.slice(
  source.indexOf("function paintAscii"),
  source.indexOf("// Pixel-based story timing"),
);
let chars = 0;
const ctx = {
  clearRect() {},
  fillText(s) {
    assert.equal(typeof s, "string");
    assert.equal(s.length, 1);
    assert(" .:+*".includes(s));
    chars++;
  },
};
const image = { naturalWidth: 900, naturalHeight: 750 },
  canvas = {
    getContext() {
      return ctx;
    },
  };
const sandbox = {
  Math,
  Number,
  window: { innerWidth: 390 },
  tiles: Array.from({ length: 4 }, () => ({
    querySelector(s) {
      return s === "canvas" ? canvas : image;
    },
  })),
  samples: Array.from({ length: 4 }, () =>
    new Uint8ClampedArray(96 * 64 * 4).fill(200),
  ),
  clamp: (x) => Math.max(0, Math.min(1, x)),
  mix: (a, b, t) => a + (b - a) * t,
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
for (const w of [1, 7, 28, 118, 253, 900])
  for (const h of [1, 9, 36, 192, 550])
    for (const m of [0, 0.1, 0.5, 0.9, 1])
      for (let i = 0; i < 4; i++) sandbox.paintAscii(i, w, h, m);
sandbox.samples[0] = [];
sandbox.paintAscii(0, 300, 200, 0.5);
console.log(
  "ASCII sample range tests passed:",
  chars,
  "single valid glyphs; includes empty samples/extreme aspect ratios.",
);
