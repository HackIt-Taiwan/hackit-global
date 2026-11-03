import assert from "node:assert/strict";
await import("./static/masonry.js");
const { chooseColumns, computePositions } = globalThis.HackItMasonry;
let checks = 0;
function check(condition, message) {
  assert.ok(condition, message);
  checks++;
}
for (const [w, n] of [
  [320, 1],
  [359, 1],
  [360, 2],
  [375, 2],
  [699, 2],
  [700, 3],
  [768, 3],
  [1099, 3],
  [1100, 4],
  [1440, 4],
])
  check(chooseColumns(w) === n, "responsive breakpoint");
let seed = 73;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
for (const columns of [1, 2, 3, 4])
  for (const count of [1, 4, 61, 100])
    for (let run = 0; run < 60; run++) {
      const heights = Array.from({ length: count }, () => 30 + rnd() * 1600),
        width = columns * 280 + (columns - 1) * 18,
        layout = computePositions(heights, width, columns, 18);
      check(layout.items.length === heights.length, "no removed cards");
      const ends = Array(columns).fill(null);
      layout.items.forEach((item, i) => {
        check(item.index === i, "DOM order retained");
        check(item.height === heights[i], "natural heights unchanged");
        check(
          item.width > 0 && item.x >= 0 && item.x + item.width <= width + 0.001,
          "horizontal bounds",
        );
        if (i)
          check(
            item.y >= layout.items[i - 1].y,
            "monotonic visual reading order",
          );
        if (ends[item.column] !== null)
          check(
            Math.abs(item.y - ends[item.column] - 18) < 0.0001,
            "exact next-card gap, no row void",
          );
        ends[item.column] = item.y + item.height;
        check(
          item.y + item.height <= layout.totalHeight + 0.001,
          "last card reachable",
        );
      });
      for (let i = 0; i < layout.items.length; i++)
        for (let j = i + 1; j < layout.items.length; j++) {
          const a = layout.items[i],
            b = layout.items[j];
          check(
            !(
              a.x < b.x + b.width - 0.001 &&
              b.x < a.x + a.width - 0.001 &&
              a.y < b.y + b.height - 0.001 &&
              b.y < a.y + a.height - 0.001
            ),
            "no overlap",
          );
        }
      check(
        Math.abs(
          Math.max(...ends.filter((x) => x !== null)) - layout.totalHeight,
        ) < 0.001,
        "height includes longest column",
      );
    }
for (const factor of [0.1, 0.5, 1, 2, 3, 10]) {
  const layout = computePositions(
    [100, 110 * factor, 150, 2000 * factor, 80, 1],
    375,
    2,
    12,
  );
  check(
    layout.items[3].height === 2000 * factor,
    "long content never truncated",
  );
}
const tie = computePositions([100, 100, 100, 100], 600, 2, 12);
check(
  tie.items.map((i) => i.column).join(",") === "0,1,0,1",
  "leftmost tie breaking",
);
console.log(
  `${checks} masonry assertions passed: deterministic 1–4 columns, arbitrary 30–1630px text heights, exact column gaps, no overlap, monotonic DOM reading order, complete height.`,
);
