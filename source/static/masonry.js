/* V8 content-aware wall. DOM order is never moved; shortest-column tops are
   monotonic in source order, with leftmost tie-breaking. Text is never changed. */
(function (host) {
  "use strict";
  function chooseColumns(viewportWidth) {
    return viewportWidth < 360
      ? 1
      : viewportWidth < 700
        ? 2
        : viewportWidth < 1100
          ? 3
          : 4;
  }
  function computePositions(heights, gridWidth, columnCount, gap) {
    const width = Math.max(1, Number(gridWidth) || 1),
      columns = Math.max(1, Math.floor(Number(columnCount) || 1));
    const gutter = Math.max(
      0,
      Math.min(Number(gap) || 0, (width - 1) / Math.max(1, columns - 1)),
    );
    const cardWidth = Math.max(1, (width - gutter * (columns - 1)) / columns),
      bottoms = Array(columns).fill(0);
    const items = heights.map((value, index) => {
      const height = Math.max(0, Number(value) || 0);
      let column = 0;
      for (let c = 1; c < columns; c++)
        if (bottoms[c] < bottoms[column]) column = c;
      const y = bottoms[column],
        x = column * (cardWidth + gutter);
      bottoms[column] = y + height + gutter;
      return { index, column, x, y, width: cardWidth, height };
    });
    return {
      items,
      totalHeight: items.length ? Math.max(...bottoms) - gutter : 0,
      columnCount: columns,
      gridWidth: width,
      gap: gutter,
      cardWidth,
    };
  }
  // Keep calculation helpers available to the source tests without exposing the
  // mutable layout cache or synchronous layout controls in the browser.
  if (!host.document) {
    host.HackItMasonry = { chooseColumns, computePositions };
    return;
  }
  const cache = new WeakMap();
  const doc = host.document;
  let pending = false,
    layingOut = false;
  const grids = new Set(),
    observed = new WeakSet();
  const near = (a, b) => Math.abs(a - b) < 0.25;
  function sameElements(a, b) {
    return a.length === b.length && a.every((e, i) => e === b[i]);
  }
  function fire(name, detail) {
    host.dispatchEvent(new CustomEvent(name, { detail }));
  }
  function layoutGrid(grid) {
    const gridWidth = grid.clientWidth;
    if (gridWidth < 1 || !grid.getClientRects().length) return;
    const elements = [...grid.children].filter((e) =>
      e.matches(".wall-photo,.wall-quote"),
    );
    if (!elements.length) return;
    const columnCount = chooseColumns(host.innerWidth),
      computed = host.getComputedStyle(grid),
      gap =
        parseFloat(computed.columnGap) ||
        parseFloat(computed.getPropertyValue("--wall-gap")) ||
        18;
    const previous = cache.get(grid),
      sameBase =
        previous &&
        near(previous.gridWidth, gridWidth) &&
        previous.columnCount === columnCount &&
        near(previous.gap, gap) &&
        sameElements(
          previous.items.map((x) => x.element),
          elements,
        );
    // ResizeObserver sees our height writes too; this read-only signature test
    // prevents a second write/event and breaks resize-feedback loops.
    if (
      sameBase &&
      elements.every((e, i) =>
        near(e.getBoundingClientRect().height, previous.items[i].height),
      )
    )
      return;
    fire("hackit:beforelayout", { grid, previous: previous || null });
    const cardWidth = computePositions(
      [],
      gridWidth,
      columnCount,
      gap,
    ).cardWidth;
    grid.classList.add("masonry-ready");
    grid.dataset.masonryReady = "";
    for (const element of elements) {
      element.style.width = cardWidth + "px";
      element.style.height = "auto";
    }
    const heights = elements.map((e) => e.getBoundingClientRect().height);
    const layout = computePositions(heights, gridWidth, columnCount, gap);
    layout.items.forEach((item, index) => {
      const element = elements[index];
      item.element = element;
      element.style.left = item.x + "px";
      element.style.top = item.y + "px";
      if (!observed.has(element)) {
        resizeObserver?.observe(element);
        observed.add(element);
      }
    });
    grid.style.height = Math.ceil(layout.totalHeight) + "px";
    grid.dataset.columns = String(columnCount);
    cache.set(grid, layout);
    fire("hackit:layout", { grid, previous: previous || null, layout });
  }
  function run() {
    pending = false;
    if (layingOut) {
      request();
      return;
    }
    layingOut = true;
    try {
      for (const grid of doc.querySelectorAll(".wall-grid")) {
        if (!grids.has(grid)) {
          grids.add(grid);
          resizeObserver?.observe(grid);
          contentObserver.observe(grid, {
            childList: true,
            subtree: true,
            characterData: true,
          });
        }
        layoutGrid(grid);
      }
    } finally {
      layingOut = false;
    }
  }
  function request() {
    if (!pending) {
      pending = true;
      host.requestAnimationFrame(run);
    }
  }
  host.HackItMasonry = Object.freeze({ relayout: request });
  const resizeObserver =
    typeof ResizeObserver === "function" ? new ResizeObserver(request) : null;
  const contentObserver = new MutationObserver(request);
  new MutationObserver(request).observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ["class", "lang"],
  });
  host.addEventListener("resize", request, { passive: true });
  host.addEventListener("hackit:localechange", request);
  doc.addEventListener(
    "load",
    (event) => {
      if (event.target instanceof HTMLImageElement) request();
    },
    true,
  );
  doc.addEventListener(
    "error",
    (event) => {
      if (event.target instanceof HTMLImageElement) request();
    },
    true,
  );
  if (doc.fonts) {
    doc.fonts.ready.then(request);
    doc.fonts.addEventListener?.("loadingdone", request);
  }
  for (const image of doc.querySelectorAll(".wall-grid img"))
    if (image.complete && typeof image.decode === "function")
      image.decode().then(request, request);
  if (doc.readyState === "loading")
    doc.addEventListener("DOMContentLoaded", request, { once: true });
  else request();
})(typeof window !== "undefined" ? window : globalThis);
