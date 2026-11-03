(() => {
  "use strict";
  const root = document.documentElement,
    story = document.querySelector(".story"),
    stage = document.querySelector(".stage");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const nativeScrollMedia = matchMedia("(max-width: 699px), (pointer: coarse)");
  const isCompactMotion = () => nativeScrollMedia.matches;
  const desktopFocusMedia = matchMedia(
    "(min-width: 900px) and (pointer: fine)",
  );
  root.classList.toggle("animated", !reduce.matches);
  root.style.setProperty(
    "--visual-height",
    (window.visualViewport?.height || window.innerHeight) + "px",
  );
  const mapScene = document.querySelector(".map-scene"),
    mapButton = document.querySelector(".map-activation"),
    panel = document.querySelector("#taiwan-panel");
  const mission = document.querySelector(".mission-scene"),
    join = document.querySelector(".join-scene"),
    photoHeading = document.querySelector(".photo-heading");
  const tiles = [...document.querySelectorAll(".morph-tile")];
  const wall = document.querySelector(".wall-scene"),
    wallGrid = wall.querySelector(".wall-grid");
  const clamp = (x) => Math.max(0, Math.min(1, x)),
    mix = (a, b, t) => a + (b - a) * t,
    smooth = (a, b, x) => {
      const t = clamp((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
  let scheduled = false,
    ready = false,
    renderedProgress = null;
  let panelOpen = false,
    panelAnimation = null,
    panelRevision = 0;
  function placePanel() {
    if (!panelOpen) return;
    panel.style.setProperty("--panel-shift-x", "0px");
    panel.style.setProperty("--panel-shift-y", "0px");
    const viewport = window.visualViewport,
      scene = stage.getBoundingClientRect(),
      left = Math.max(scene.left, viewport?.offsetLeft || 0) + 16,
      top = Math.max(scene.top, viewport?.offsetTop || 0) + 16,
      right =
        Math.min(
          scene.right,
          (viewport?.offsetLeft || 0) + (viewport?.width || innerWidth),
        ) - 16,
      bottom =
        Math.min(
          scene.bottom,
          (viewport?.offsetTop || 0) + (viewport?.height || innerHeight),
        ) - 16;
    const scale = panel.getBoundingClientRect().width / panel.offsetWidth || 1;
    panel.style.setProperty(
      "--panel-max-width",
      Math.max(0, right - left) / scale + "px",
    );
    panel.style.setProperty(
      "--panel-max-height",
      Math.max(0, bottom - top) / scale + "px",
    );
    const bounds = panel.getBoundingClientRect(),
      x = Math.max(left - bounds.left, Math.min(0, right - bounds.right)),
      y = Math.max(top - bounds.top, Math.min(0, bottom - bounds.bottom));
    panel.style.setProperty("--panel-shift-x", x / scale + "px");
    panel.style.setProperty("--panel-shift-y", y / scale + "px");
  }
  function setPanel(open, { immediate = false, restoreFocus = false } = {}) {
    if (
      open &&
      (mapScene.inert ||
        reduce.matches ||
        root.classList.contains("reading-mode"))
    )
      return;
    if (open === panelOpen && !immediate) return;
    const revision = ++panelRevision,
      wasHidden = panel.hidden,
      current = !wasHidden && panelAnimation ? getComputedStyle(panel) : null,
      from = current
        ? { opacity: current.opacity, transform: current.transform }
        : null;
    panelAnimation?.cancel();
    panelAnimation = null;
    panelOpen = open;
    mapButton.setAttribute("aria-expanded", String(open));
    panel.inert = !open;
    if (restoreFocus && !mapScene.inert)
      mapButton.focus({ preventScroll: true });
    if (open) {
      panel.hidden = false;
      placePanel();
    }
    if (
      immediate ||
      reduce.matches ||
      typeof panel.animate !== "function" ||
      (!open && wasHidden)
    ) {
      panel.hidden = !open;
      delete panel.dataset.panelMotion;
      return;
    }
    panel.dataset.panelMotion = open ? "opening" : "closing";
    const animation = panel.animate(
      [
        from || {
          opacity: open ? "0" : "1",
          transform: open ? "translateY(8px)" : "none",
        },
        {
          opacity: open ? "1" : "0",
          transform: open ? "none" : "translateY(4px)",
        },
      ],
      {
        duration: open ? 220 : 140,
        easing: open ? "cubic-bezier(.22,1,.36,1)" : "cubic-bezier(.4,0,1,1)",
        fill: "both",
      },
    );
    panelAnimation = animation;
    const finish = () => {
      if (revision !== panelRevision) return;
      panel.hidden = !panelOpen;
      panelAnimation = null;
      delete panel.dataset.panelMotion;
      animation.cancel();
    };
    animation.finished.then(finish, finish);
  }
  window.addEventListener("resize", placePanel);
  window.visualViewport?.addEventListener("resize", placePanel);
  window.visualViewport?.addEventListener("scroll", placePanel, {
    passive: true,
  });
  mapButton.addEventListener("click", () => setPanel(!panelOpen));
  mapButton.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setPanel(!panelOpen);
      if (panelOpen) panel.querySelector("a").focus({ preventScroll: true });
    }
  });
  panel.querySelector("button").addEventListener("click", () => {
    setPanel(false, { restoreFocus: true });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panelOpen) {
      e.preventDefault();
      setPanel(false, { restoreFocus: true });
    }
  });
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".country-panel") &&
      !e.target.closest(".map-activation")
    )
      setPanel(false);
  });
  const samples = [];
  function sampleImage(img) {
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 64;
    const cx = c.getContext("2d", { willReadFrequently: true });
    cx.drawImage(img, 0, 0, 96, 64);
    return cx.getImageData(0, 0, 96, 64).data;
  }
  function paintAscii(index, w, h, morph, canvasOverride) {
    const canvas = canvasOverride || tiles[index].querySelector("canvas"),
      ctx = canvas.getContext("2d");
    canvas.width = Math.max(1, Math.round(w));
    canvas.height = Math.max(1, Math.round(h));
    ctx.clearRect(0, 0, w, h);
    const data = samples[index];
    if (!data) return;
    const cell = window.innerWidth < 700 ? 7 : 9,
      cols = Math.ceil(w / cell),
      rows = Math.ceil(h / (cell * 1.2));
    ctx.font = `${cell}px monospace`;
    ctx.textBaseline = "top";
    const img = tiles[index].querySelector("img"),
      scale = Math.max(w / img.naturalWidth, h / img.naturalHeight),
      cw = w / scale,
      ch = h / scale,
      cx = (img.naturalWidth - cw) / 2,
      cy = (img.naturalHeight - ch) / 2;
    const glyphs = " .:+*";
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const sx = Math.max(
            0,
            Math.min(
              95,
              Math.floor(((cx + (x / cols) * cw) / img.naturalWidth) * 96),
            ),
          ),
          sy = Math.max(
            0,
            Math.min(
              63,
              Math.floor(((cy + (y / rows) * ch) / img.naturalHeight) * 64),
            ),
          ),
          at = (sy * 96 + sx) * 4;
        const raw =
          (data[at] * 0.21 + data[at + 1] * 0.72 + data[at + 2] * 0.07) / 255;
        const lum = Number.isFinite(raw) ? clamp(raw) : 0.5;
        const u = x / cols,
          v = y / rows,
          along = index % 2 ? v : u,
          across = index % 2 ? u : v,
          curve = 0.5 + 0.25 * Math.sin(along * Math.PI * 1.4 + index * 0.9),
          thickness = 0.1 + 0.055 * Math.sin(along * Math.PI),
          distance = Math.abs(across - curve),
          edge = clamp(1 - distance / thickness),
          taper = Math.pow(Math.sin(Math.PI * clamp(along)), 0.7),
          contour = edge * taper,
          mask = mix(contour, 1, morph);
        if (mask < 0.04) continue;
        const char =
          glyphs[
            Math.max(
              0,
              Math.min(glyphs.length - 1, 1 + Math.floor((1 - lum) * 4)),
            )
          ] || ".";
        ctx.fillStyle = `rgba(70,76,85,${mask * (0.45 + (1 - lum) * 0.5)})`;
        ctx.fillText(char, x * cell, y * cell * 1.2);
      }
  }
  // Pixel-based story timing: wall travel grows with real content, not a fixed vh guess.
  // V11 cached render geometry: layout reads occur only on explicit refresh.
  const brandNode = document.querySelector(".brand"),
    wallHeaderNode = wall.querySelector(".wall-header");
  let renderCache = null,
    lastTimelineSignature = "",
    viewportRefreshPending = false;
  const renderedValues = new Map();
  function changed(key, value, write) {
    if (renderedValues.get(key) === value) return;
    renderedValues.set(key, value);
    write();
  }
  function refreshRenderCache() {
    const W = stage.clientWidth,
      H = stage.clientHeight,
      baseWallX = wall.offsetLeft + wallGrid.offsetLeft,
      baseWallY = wall.offsetTop + wallGrid.offsetTop;
    const cardRefs = [...wallGrid.children].map((element) => ({
      element,
      img: element.querySelector("img"),
      caption: element.querySelector("figcaption"),
      x: baseWallX + element.offsetLeft,
      y: baseWallY + element.offsetTop,
      height: element.offsetHeight,
    }));
    const first = cardRefs
      .filter((x) => x.element.matches(".wall-photo"))
      .slice(0, 4);
    const ends = first.map((x) => [
      x.x / W,
      (x.y + x.img.offsetTop) / H,
      x.img.clientWidth / W,
      x.img.clientHeight / H,
    ]);
    const paragraphs = [...mission.querySelectorAll(".mission-body p")].map(
      (element, index) => ({
        element,
        index,
        y: mission.offsetTop + element.offsetTop,
        height: element.offsetHeight,
      }),
    );
    renderCache = {
      W,
      H,
      storyTop: story.offsetTop,
      cardRefs,
      first,
      ends,
      paragraphs,
    };
    if (ready)
      for (let i = 0; i < tiles.length; i++) {
        const el = tiles[i],
          w = Math.max(1, ends[i][2] * W),
          h = Math.max(1, ends[i][3] * H),
          key = Math.round(w) + ":" + Math.round(h) + ":" + (W < 700);
        if (el.dataset.textureSize !== key) {
          let full = el.querySelector(".ascii-full");
          if (!full) {
            full = document.createElement("canvas");
            full.className = "ascii-full";
            full.setAttribute("aria-hidden", "true");
            el.append(full);
          }
          const contour = el.querySelector("canvas");
          paintAscii(i, w, h, 0, contour);
          paintAscii(i, w, h, 1, full);
          el.style.width = w + "px";
          el.style.height = h + "px";
          el.style.transformOrigin = "0 0";
          el.style.setProperty("--caption-space", "0px");
          el.style.setProperty("--image-radius", "0px");
          el.querySelector("img").style.opacity = 0;
          el.querySelector("figcaption").style.display = "none";
          el.dataset.textureSize = key;
        }
      }
    renderCache.texturesReady = ready;
    renderCache.tileRefs = tiles.map((el) => ({
      el,
      contour: el.querySelector("canvas"),
      full: el.querySelector(".ascii-full"),
    }));
    renderedValues.clear();
  }
  function queueViewportRefresh() {
    if (viewportRefreshPending) return;
    viewportRefreshPending = true;
    requestAnimationFrame(() => {
      viewportRefreshPending = false;
      const vv = window.visualViewport,
        h = vv?.height || innerHeight,
        w = innerWidth,
        top = vv?.offsetTop || 0;
      if (vv && vv.scale !== 1) {
        schedule();
        return;
      }
      if (
        renderCache &&
        Math.abs(h - (renderCache.visualHeight || renderCache.H)) < 2 &&
        w === renderCache.viewportWidth &&
        Math.abs(top - (renderCache.visualTop || 0)) < 2
      ) {
        schedule();
        return;
      }
      root.style.setProperty("--visual-height", h + "px");
      window.HackItMasonry?.relayout();
      refreshTimeline();
      if (renderCache) {
        renderCache.visualHeight = h;
        renderCache.viewportWidth = w;
        renderCache.visualTop = top;
      }
      schedule();
    });
  }

  let timeline = { lead: 0, pan: 0, tail: 0, total: 0 },
    readingAnchor = null,
    layoutBusy = false,
    pendingAnchor = null,
    anchorRelease = 0;
  function timelineStops() {
    return [
      [0, 0],
      [timeline.lead, 0.25],
      [timeline.lead + timeline.pan, 0.67],
      [timeline.lead + timeline.pan + timeline.wallHold, 0.69],
      [
        timeline.lead + timeline.pan + timeline.wallHold + timeline.bridge,
        0.79,
      ],
      [
        timeline.lead +
          timeline.pan +
          timeline.wallHold +
          timeline.bridge +
          timeline.missionTravel,
        0.87,
      ],
      [timeline.total, 1],
    ];
  }
  function physicalToPhase(y) {
    if (!timeline.total) return 0;
    const stops = timelineStops();
    for (let i = 1; i < stops.length; i++) {
      const [x1, p1] = stops[i - 1],
        [x2, p2] = stops[i];
      if (y <= x2)
        return p1 + clamp((y - x1) / Math.max(1, x2 - x1)) * (p2 - p1);
    }
    return 1;
  }
  function phaseToPhysical(p) {
    const stops = timelineStops();
    for (let i = 1; i < stops.length; i++) {
      const [x1, p1] = stops[i - 1],
        [x2, p2] = stops[i];
      if (p <= p2) return x1 + clamp((p - p1) / (p2 - p1)) * (x2 - x1);
    }
    return timeline.total;
  }
  function rememberReadingAnchor(p) {
    if (layoutBusy || pendingAnchor || !renderCache) return;
    const H = renderCache.H,
      aim = H * 0.32;
    let entries = null,
      shift = 0,
      section = null;
    if (p >= 0.25 && p <= 0.67) {
      entries = renderCache.cardRefs;
      shift = -timeline.pan * clamp((p - 0.25) / 0.42);
    } else if (p >= 0.79 && p <= 0.87) {
      entries = renderCache.paragraphs;
      section = "mission";
      shift = -timeline.missionPan * clamp((p - 0.79) / 0.08);
    }
    let match = null,
      best = Infinity;
    if (entries)
      for (const entry of entries) {
        const top = entry.y + shift;
        if (top + entry.height <= 0 || top >= H) continue;
        const distance = Math.abs(top - aim);
        if (distance < best) {
          best = distance;
          match = { element: entry.element, top, p };
          if (section) {
            match.section = section;
            match.index = entry.index;
          }
        }
      }
    readingAnchor = match || { p };
  }
  function readableViewport() {
    const vv = window.visualViewport,
      H = Math.min(stage.clientHeight, vv?.height || window.innerHeight),
      offset = vv?.offsetTop || 0,
      style = getComputedStyle(root),
      safeTop = parseFloat(style.getPropertyValue("--safe-top")) || 0,
      safeBottom = parseFloat(style.getPropertyValue("--safe-bottom")) || 0;
    return {
      top: offset + (isCompactMotion() ? Math.max(76, safeTop + 60) : 0),
      bottom:
        offset + H - Math.max(isCompactMotion() ? 52 : 32, safeBottom + 28),
    };
  }
  function refreshTimeline() {
    if (reduce.matches || root.classList.contains("reading-mode")) return;
    layoutBusy = true;
    const bounds = readableViewport(),
      H = stage.clientHeight,
      old = pendingAnchor || readingAnchor,
      p = old?.p ?? renderedProgress ?? 0;
    const lastCardBottom = Math.max(
      0,
      ...[...wallGrid.children].map(
        (el) => el.offsetTop + el.getBoundingClientRect().height,
      ),
    );
    const wallBottom = wall.offsetTop + wallGrid.offsetTop + lastCardBottom;
    const signature = [
      stage.clientWidth,
      H,
      bounds.top,
      bounds.bottom,
      wallBottom,
      mission.offsetTop,
      mission.scrollHeight,
      isCompactMotion(),
    ].join(":");
    if (
      signature === lastTimelineSignature &&
      renderCache?.texturesReady &&
      !pendingAnchor
    ) {
      layoutBusy = false;
      return;
    }
    lastTimelineSignature = signature;
    refreshRenderCache();
    timeline = {
      lead: H * (isCompactMotion() ? 1 : 3),
      pan: Math.max(0, Math.ceil(wallBottom - bounds.bottom)),
      wallHold: 120,
      bridge: H * (isCompactMotion() ? 0.65 : 1.2),
      missionPan: Math.max(
        0,
        Math.ceil(mission.offsetTop + mission.scrollHeight - bounds.bottom),
      ),
      outro: H * (isCompactMotion() ? 0.65 : 1.2),
      readTop: bounds.top,
      readBottom: bounds.bottom,
    };
    timeline.missionTravel = Math.max(timeline.missionPan, H * 0.45);
    timeline.total =
      timeline.lead +
      timeline.pan +
      timeline.wallHold +
      timeline.bridge +
      timeline.missionTravel +
      timeline.outro;
    story.style.height = timeline.total + H + "px";
    let y = phaseToPhysical(p);
    if (
      old?.element &&
      (old.mobile || (p >= 0.25 && p <= 0.67)) &&
      old.element.isConnected
    ) {
      const cardTop =
        wall.offsetTop + wallGrid.offsetTop + old.element.offsetTop;
      y =
        timeline.lead + Math.max(0, Math.min(timeline.pan, cardTop - old.top));
    }
    if (old?.section === "mission") {
      const paragraph = mission.querySelectorAll(".mission-body p")[old.index];
      if (paragraph) {
        const top = mission.offsetTop + paragraph.offsetTop;
        y =
          timeline.lead +
          timeline.pan +
          timeline.wallHold +
          timeline.bridge +
          Math.max(0, Math.min(timeline.missionPan, top - old.top));
      }
    }
    if (renderedProgress === null && window.scrollY > 0 && !old)
      y = window.scrollY - story.offsetTop;
    const next = physicalToPhase(y);
    renderedProgress = next;
    if (Math.abs(window.scrollY - (story.offsetTop + y)) > 0.5)
      window.scrollTo({ top: story.offsetTop + y, behavior: "instant" });
    layoutBusy = false;
    schedule();
  }
  window.addEventListener("hackit:beforelayout", (e) => {
    if (e.detail?.grid === wallGrid && !pendingAnchor && readingAnchor)
      pendingAnchor = { ...readingAnchor };
  });
  window.addEventListener("hackit:layout", (e) => {
    if (e.detail?.grid === wallGrid) {
      refreshTimeline();
      const token = ++anchorRelease;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (token === anchorRelease) {
            pendingAnchor = null;
            rememberReadingAnchor(renderedProgress ?? 0);
            schedule();
          }
        }),
      );
    }
  });
  window.addEventListener("hackit:beforecontentchange", () => {
    if (renderedProgress !== null) {
      rememberReadingAnchor(renderedProgress);
      pendingAnchor = readingAnchor ? { ...readingAnchor } : null;
      const token = ++anchorRelease;
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (token === anchorRelease) {
              pendingAnchor = null;
              rememberReadingAnchor(renderedProgress ?? 0);
              schedule();
            }
          }),
        ),
      );
    }
  });
  function update() {
    scheduled = false;
    if (
      !ready ||
      reduce.matches ||
      root.classList.contains("reading-mode") ||
      !renderCache
    )
      return;
    const { W, H, ends, first, cardRefs, tileRefs } = renderCache,
      mobile = W < 700;
    const p = physicalToPhase(
      Math.max(0, window.scrollY - renderCache.storyTop),
    );
    renderedProgress = p;
    const morph = smooth(0.07, 0.15, p),
      reveal = smooth(0.15, 0.21, p);
    const focus = desktopFocusMedia.matches ? 1 - currentWorldness : 0,
      frameWidth = Math.min(0.94 * W, (0.78 * H * 330) / 260) / W,
      frameLeft = (1 - frameWidth) / 2;
    const starts = mobile
      ? [
          [0.3, 0.12, 0.56, 0.1],
          [0.9, 0.26, 0.1, 0.46],
          [0.15, 0.86, 0.7, 0.09],
          [0, 0.26, 0.1, 0.46],
        ]
      : [
          [0.33, 0.02, 0.48, 0.16],
          [0.88, 0.2, 0.12, 0.59],
          [0.22, 0.82, 0.58, 0.16],
          [0, 0.25, 0.12, 0.55],
        ];
    if (focus > 0) {
      const framed = [
        [frameLeft + 0.1 * frameWidth, 0.07, 0.7 * frameWidth, 0.12],
        [frameLeft + frameWidth - 0.025, 0.22, 0.07, 0.52],
        [frameLeft + 0.1 * frameWidth, 0.83, 0.72 * frameWidth, 0.1],
        [frameLeft - 0.045, 0.22, 0.07, 0.52],
      ];
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
          starts[i][j] = mix(starts[i][j], framed[i][j], focus);
    }
    changed("ascii", morph + ":" + reveal + ":" + focus, () => {
      for (let i = 0; i < tileRefs.length; i++) {
        const { el, contour, full } = tileRefs[i],
          a = starts[i],
          b = ends[i];
        el.style.visibility = reveal >= 1 ? "hidden" : "visible";
        if (reveal >= 1) continue;
        const x = mix(a[0], b[0], morph) * W,
          y = mix(a[1], b[1], morph) * H,
          sx = mix(a[2], b[2], morph) / b[2],
          sy = mix(a[3], b[3], morph) / b[3];
        el.style.transform = `translate3d(${x}px,${y}px,0) scale(${sx},${sy})`;
        el.style.opacity = 1 - reveal;
        contour.style.opacity = 1 - morph;
        if (full) full.style.opacity = morph;
      }
    });
    changed("photos", reveal, () => {
      for (const card of cardRefs) {
        const isFirst = first.includes(card);
        card.element.style.opacity = isFirst ? 1 : reveal;
        if (isFirst) {
          card.img.style.opacity = reveal;
          card.caption.style.opacity = reveal;
        }
      }
    });
    const headerOpacity = smooth(0.18, 0.21, p);
    changed(
      "wallHeader",
      headerOpacity,
      () => (wallHeaderNode.style.opacity = headerOpacity),
    );
    const mo = 1 - smooth(0.07, 0.16, p);
    changed("map", mo + ":" + morph, () => {
      mapScene.style.opacity = mo;
      mapScene.style.transform = `scale(${1 - 0.06 * morph})`;
      if (mo < 0.1 && document.activeElement?.closest(".locale-control"))
        document.activeElement.blur();
      mapScene.inert = mo < 0.1;
      mapScene.setAttribute("aria-hidden", String(mo < 0.1));
      if (mo < 0.1 && !panel.hidden) setPanel(false, { immediate: true });
    });
    const headingOpacity = smooth(0.28, 0.36, p) * (1 - smooth(0.45, 0.53, p));
    changed(
      "photoHeading",
      headingOpacity,
      () => (photoHeading.style.opacity = headingOpacity),
    );
    const brandExit = smooth(0.06, 0.115, p) * (1 - smooth(0.93, 0.97, p));
    changed("brand", brandExit, () => {
      brandNode.style.opacity = 1;
      brandNode.style.transform = `translate3d(0,${-brandExit * 180}px,0)`;
    });
    const wallOut = smooth(0.69, 0.735, p),
      wallY = -timeline.pan * clamp((p - 0.25) / 0.42) - wallOut * 60;
    changed(
      "wallY",
      wallY,
      () => (wall.style.transform = `translate3d(0,${wallY}px,0)`),
    );
    changed("wallExit", wallOut, () => {
      wall.style.opacity = 1 - wallOut;
      wall.style.pointerEvents = wallOut < 0.5 ? "auto" : "none";
    });
    const wallHidden = p < 0.2 || wallOut > 0.5;
    changed("wallA11y", wallHidden, () => {
      wall.inert = wallHidden;
      wall.setAttribute("aria-hidden", String(wallHidden));
    });
    const enter = smooth(0.73, 0.79, p),
      leave = smooth(0.87, 0.92, p),
      mi = enter * (1 - leave),
      missionY =
        (1 - enter) * H * 0.65 -
        timeline.missionPan * clamp((p - 0.79) / 0.08) -
        leave * H * 0.65;
    changed(
      "missionY",
      missionY,
      () => (mission.style.transform = `translate3d(0,${missionY}px,0)`),
    );
    changed("missionShown", mi > 0.001, () => {
      mission.style.opacity = 1;
      mission.style.visibility = mi > 0.001 ? "visible" : "hidden";
      mission.style.clipPath = "none";
    });
    changed("missionA11y", mi < 0.4, () => {
      mission.inert = mi < 0.4;
      mission.setAttribute("aria-hidden", String(mi < 0.4));
    });
    const readingMask = p > 0.21 && p < 0.93 ? 1 : 0;
    changed("mask", readingMask, () =>
      stage.style.setProperty("--reading-mask", String(readingMask)),
    );
    const ji = smooth(0.91, 0.965, p);
    changed("join", ji, () => {
      join.style.opacity = 1;
      join.style.visibility = ji > 0.001 ? "visible" : "hidden";
      join.style.clipPath = `inset(${(1 - ji) * 100}% 0 0 0)`;
      join.style.transform = `translate3d(0,${(1 - ji) * 40}px,0)`;
      join.style.pointerEvents = ji > 0.5 ? "auto" : "none";
      join.inert = ji < 0.5;
      join.setAttribute("aria-hidden", String(ji < 0.5));
    });
    rememberReadingAnchor(p);
  }
  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  }
  function setMotion() {
    if (reduce.matches) setPanel(false, { immediate: true });
    root.classList.toggle("animated", !reduce.matches && ready);
    window.HackItI18n?.placeLanguageControl();
    if (ready && !reduce.matches)
      requestAnimationFrame(() => {
        refreshTimeline();
        if (!root.classList.contains("reading-mode"))
          selectMapView(
            document.querySelector("[data-view][aria-pressed=true]").dataset
              .view,
            true,
          );
      });
    schedule();
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.visualViewport?.addEventListener("resize", queueViewportRefresh);
  window.visualViewport?.addEventListener("scroll", schedule, {
    passive: true,
  });
  window.addEventListener("resize", queueViewportRefresh);
  reduce.addEventListener("change", setMotion);
  nativeScrollMedia.addEventListener("change", () => {
    requestAnimationFrame(() => {
      window.HackItMasonry?.relayout();
      refreshTimeline();
      schedule();
    });
  });
  let missionMeasuredHeight = 0;
  new ResizeObserver(() => {
    const height = mission.scrollHeight;
    if (Math.abs(height - missionMeasuredHeight) > 0.5) {
      missionMeasuredHeight = height;
      requestAnimationFrame(refreshTimeline);
    }
  }).observe(mission);
  // Photograph downloads never gate the first usable hero paint.
  Promise.all(
    tiles.map((t) =>
      t
        .querySelector("img")
        .decode()
        .catch(() => {}),
    ),
  )
    .then(() => {
      tiles.forEach((t, i) => {
        try {
          samples[i] = sampleImage(t.querySelector("img"));
        } catch {}
        delete t.dataset.size;
        delete t.dataset.textureSize;
      });
      if (renderCache) renderCache.texturesReady = false;
      refreshTimeline();
      schedule();
    })
    .catch(() => {});
  requestAnimationFrame(() => {
    ready = true;
    setMotion();
    refreshTimeline();
    window.HackItMasonry?.relayout();
    requestAnimationFrame(() => window.HackItEntry?.ready());
  });
  document.querySelector("#skip-story").addEventListener("click", (e) => {
    e.preventDefault();
    setPanel(false, { immediate: true });
    root.classList.add("reading-mode");
    window.HackItI18n?.placeLanguageControl();
    document.querySelector("#overview").focus();
    document.querySelector("#overview").scrollIntoView();
  });
  // V12: one race-safe native-dialog motion path for buttons, backdrop and Escape.
  const dialogMotionStates = new WeakMap();
  const animatedDialogs = [
    document.getElementById("join-dialog"),
    document.getElementById("story-dialog"),
  ];
  function clearDialogMotion(dialog, state) {
    state.token++;
    state.animation?.cancel();
    state.animation = null;
    delete dialog.dataset.dialogMotion;
    dialog.style.removeProperty("--dialog-backdrop-from");
  }
  function finishDialogClose(dialog, state) {
    clearDialogMotion(dialog, state);
    if (dialog.open) dialog.close();
  }
  function openDialog(dialog) {
    const state = dialogMotionStates.get(dialog) || {
      token: 0,
      animation: null,
    };
    dialogMotionStates.set(dialog, state);
    const wasOpen = dialog.open,
      from = wasOpen ? getComputedStyle(dialog) : null,
      opacity = from?.opacity || "0",
      transform = from?.transform || "translateY(6px) scale(.985)",
      backdrop = wasOpen ? getComputedStyle(dialog, "::backdrop").opacity : "0";
    clearDialogMotion(dialog, state);
    if (!wasOpen) dialog.showModal();
    if (reduce.matches || typeof dialog.animate !== "function") return;
    const token = state.token;
    dialog.style.setProperty("--dialog-backdrop-from", backdrop);
    dialog.dataset.dialogMotion = "opening";
    state.animation = dialog.animate(
      [
        { opacity, transform },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 180, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" },
    );
    state.animation.finished
      .then(() => {
        if (state.token === token) clearDialogMotion(dialog, state);
      })
      .catch(() => {});
  }
  function closeDialog(dialog) {
    if (!dialog.open) return;
    const state = dialogMotionStates.get(dialog) || {
      token: 0,
      animation: null,
    };
    dialogMotionStates.set(dialog, state);
    if (dialog.dataset.dialogMotion === "closing") return;
    if (reduce.matches || typeof dialog.animate !== "function") {
      finishDialogClose(dialog, state);
      return;
    }
    const from = getComputedStyle(dialog),
      opacity = from.opacity,
      transform = from.transform,
      backdrop = getComputedStyle(dialog, "::backdrop").opacity;
    clearDialogMotion(dialog, state);
    const token = state.token;
    dialog.style.setProperty("--dialog-backdrop-from", backdrop);
    dialog.dataset.dialogMotion = "closing";
    state.animation = dialog.animate(
      [
        { opacity, transform },
        { opacity: 0, transform: "translateY(6px) scale(.985)" },
      ],
      { duration: 140, easing: "cubic-bezier(.4,0,1,1)", fill: "both" },
    );
    state.animation.finished
      .then(() => {
        if (state.token === token) finishDialogClose(dialog, state);
      })
      .catch(() => {});
  }
  for (const dialog of animatedDialogs) {
    dialog
      .querySelector(".dialog-close")
      .addEventListener("click", () => closeDialog(dialog));
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });
    dialog.addEventListener("click", (event) => {
      // Keyboard activation of a child link has no pointer coordinates.
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        closeDialog(dialog);
    });
    dialog.addEventListener("close", () => {
      const state = dialogMotionStates.get(dialog);
      if (state && !dialog.open) clearDialogMotion(dialog, state);
    });
  }
  reduce.addEventListener("change", () => {
    if (!reduce.matches) return;
    for (const dialog of animatedDialogs) {
      const state = dialogMotionStates.get(dialog);
      if (!state) continue;
      if (dialog.dataset.dialogMotion === "closing")
        finishDialogClose(dialog, state);
      else clearDialogMotion(dialog, state);
    }
  });
  document
    .querySelectorAll(".join-open")
    .forEach((button) =>
      button.addEventListener("click", () =>
        openDialog(document.getElementById("join-dialog")),
      ),
    );
  const storyDialog = document.getElementById("story-dialog");
  document.querySelectorAll(".story-read-more").forEach((button) =>
    button.addEventListener("click", () => {
      if (window.HackItI18n?.renderStory(Number(button.dataset.storyIndex))) {
        openDialog(storyDialog);
        storyDialog.scrollTop = 0;
      }
    }),
  );

  // Explicit wrap also keeps keyboard navigation inside embedded previews.
  for (const dialog of document.querySelectorAll("dialog"))
    dialog.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const nodes = [
        ...dialog.querySelectorAll(
          'button,a[href],input,select,textarea,[tabindex="0"]',
        ),
      ].filter((n) => !n.disabled && n.getClientRects().length);
      if (!nodes.length) return;
      // Keep the full sequence inside the modal, including browsers whose native
      // Tab preference skips links. Programmatic focus remains predictable.
      const current = nodes.indexOf(document.activeElement);
      const next =
        current < 0
          ? e.shiftKey
            ? nodes.length - 1
            : 0
          : (current + (e.shiftKey ? -1 : 1) + nodes.length) % nodes.length;
      e.preventDefault();
      nodes[next].focus();
    });

  const mapSvg = document.querySelector(".map-stage svg");
  const mapViewport = mapSvg.parentElement,
    mapStage = mapViewport.parentElement;
  function mapComposition() {
    const mobile = innerWidth < 700,
      w = mobile ? currentWorldness : 0,
      H = stage.clientHeight,
      worldHeight = Math.max(
        1,
        Math.min(H - 210, (innerWidth * 1.6 * 730) / 1440 + 24),
      );
    mapStage.style.setProperty("--world-progress", String(w));
    const focus = desktopFocusMedia.matches ? 1 - currentWorldness : 0;
    mapViewport.style.maskImage = focus > 0 ? "" : "none";
    mapViewport.style.webkitMaskImage = focus > 0 ? "" : "none";
    mapViewport.style.setProperty("--focus-edge-x", 6 * focus + "%");
    mapViewport.style.setProperty("--focus-edge-top", 8 * focus + "%");
    mapViewport.style.setProperty("--focus-edge-bottom", 9 * focus + "%");
    mapViewport.style.width =
      focus > 0
        ? mix(
            mapStage.clientWidth,
            Math.min(mapStage.clientWidth, (H * 0.78 * 330) / 260),
            focus,
          ) + "px"
        : "";
    if (mobile) {
      mapStage.style.top =
        mix(94, Math.max(110, (H - worldHeight) / 2 - 24), w) + "px";
      mapStage.style.height = mix(Math.max(1, H - 182), worldHeight, w) + "px";
      mapStage.style.bottom = "auto";
    } else {
      mapStage.style.top = "";
      mapStage.style.height = "";
      mapStage.style.bottom = "";
    }
    mapViewport.tabIndex = w > 0.9 ? 0 : -1;
    mapViewport.style.overflowX = w > 0.05 ? "auto" : "clip";
    mapSvg.style.width = 100 + 60 * w + "%";
    if (w > 0)
      mapViewport.scrollLeft =
        (mapViewport.scrollWidth - mapViewport.clientWidth) * w;
    else mapViewport.scrollLeft = 0;
  }
  mapViewport.addEventListener("keydown", (e) => {
    if (
      e.target !== mapViewport ||
      currentWorldness < 0.9 ||
      !["ArrowLeft", "ArrowRight"].includes(e.key)
    )
      return;
    e.preventDefault();
    mapViewport.scrollBy({
      left: (e.key === "ArrowLeft" ? -1 : 1) * mapViewport.clientWidth * 0.55,
      behavior: reduce.matches ? "instant" : "smooth",
    });
  });
  const mapViews = {
    asia: innerWidth < 700 ? [1110, 145, 160, 210] : [1040, 110, 330, 260],
    world: [0, 0, 1440, 730],
  };
  let currentView = [...mapViews.asia],
    zoomFrame = 0,
    currentWorldness = 0;
  mapSvg.setAttribute("viewBox", currentView.join(" "));
  mapSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  function styleMapLabel() {
    // The static reading view hides the animated map and has no geometry to measure.
    if (!stage.clientHeight || !mapStage.clientWidth) return;
    mapComposition();
    const scale = Math.max(
        0.001,
        Math.min(
          mapSvg.clientWidth / currentView[2],
          mapSvg.clientHeight / currentView[3],
        ),
      ),
      text = mapSvg.querySelector(".taiwan-label text"),
      line = mapSvg.querySelector(".taiwan-label path"),
      w = innerWidth < 700 ? currentWorldness : 0;
    const x = mix(1214, 1100, w),
      y = mix(250, 217, w);
    text.style.fontSize = Math.max(7, 12 / scale) + "px";
    text.style.paintOrder = "stroke";
    text.style.stroke = "#fafafa";
    text.style.strokeWidth = 1 / scale + "px";
    text.setAttribute("x", String(x));
    text.setAttribute("y", String(y));
    text.setAttribute("text-anchor", w > 0.5 ? "end" : "start");
    line.setAttribute(
      "d",
      `M1185 240L${mix(1194, 1155, w)} ${mix(247, 214, w)}L${mix(1212, 1105, w)} ${mix(247, 214, w)}`,
    );
    mapSvg.querySelector(".map-activation circle").style.r =
      Math.max(9, 24 / scale) + "px";
    mapSvg.style.setProperty(
      "--map-mask-size",
      50 + 50 * currentWorldness + "%",
    );
  }
  function selectMapView(name, immediate = false) {
    cancelAnimationFrame(zoomFrame);
    mapViews.asia =
      innerWidth < 700 ? [1110, 145, 160, 210] : [1040, 110, 330, 260];
    const from = [...currentView],
      to = mapViews[name],
      fromWorld = currentWorldness,
      toWorld = name === "world" ? 1 : 0,
      start = performance.now(),
      settled =
        currentWorldness === toWorld &&
        from.every((value, index) => Math.abs(value - to[index]) < 0.001),
      scrollRange = mapViewport.scrollWidth - mapViewport.clientWidth,
      scrollRatio =
        immediate && fromWorld === 1 && scrollRange > 0
          ? mapViewport.scrollLeft / scrollRange
          : null,
      label = mapSvg.querySelector(".taiwan-label");
    document
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.view === name)),
      );
    if (!immediate) setPanel(false);
    function tick(now) {
      const t =
          immediate || settled || reduce.matches
            ? 1
            : Math.min(1, (now - start) / 720),
        e = t * t * (3 - 2 * t),
        width = Math.exp(mix(Math.log(from[2]), Math.log(to[2]), e)),
        height = Math.exp(mix(Math.log(from[3]), Math.log(to[3]), e)),
        cx = mix(from[0] + from[2] / 2, to[0] + to[2] / 2, e),
        cy = mix(from[1] + from[3] / 2, to[1] + to[3] / 2, e);
      currentView = [cx - width / 2, cy - height / 2, width, height];
      currentWorldness = mix(fromWorld, toWorld, e);
      mapSvg.setAttribute("viewBox", currentView.join(" "));
      label.style.opacity = String(1 - Math.sin(Math.PI * t) * 0.85);
      styleMapLabel();
      if (scrollRatio !== null)
        mapViewport.scrollLeft =
          (mapViewport.scrollWidth - mapViewport.clientWidth) * scrollRatio;
      if (desktopFocusMedia.matches) schedule();
      if (t < 1) zoomFrame = requestAnimationFrame(tick);
    }
    if (immediate || settled || reduce.matches) tick(start);
    else zoomFrame = requestAnimationFrame(tick);
  }
  document
    .querySelectorAll("[data-view]")
    .forEach((b) =>
      b.addEventListener("click", () => selectMapView(b.dataset.view)),
    );
  styleMapLabel();
  let mapResizeFrame = 0;
  window.addEventListener("resize", () => {
    if (mapResizeFrame) return;
    mapResizeFrame = requestAnimationFrame(() => {
      mapResizeFrame = 0;
      selectMapView(
        document.querySelector("[data-view][aria-pressed=true]").dataset.view,
        true,
      );
    });
  });
})();
