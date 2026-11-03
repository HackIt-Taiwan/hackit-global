(() => {
  const r = document.documentElement;
  let css = false,
    app = false,
    done = false;
  const hash = location.hash;
  r.classList.add("booting");
  if (hash && hash !== "#story") r.classList.add("reading-mode");
  function finish(failed) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    if (failed) {
      r.classList.remove("animated");
      r.classList.add("reading-mode", "entry-failed");
    }
    r.classList.add("entry-leaving");
    r.classList.remove("booting");
    setTimeout(() => {
      r.classList.remove("entry-leaving");
      document.querySelector(".entry-cover")?.remove();
    }, 260);
  }
  const timer = setTimeout(() => finish(true), 3500);
  window.HackItEntry = {
    css() {
      css = true;
      if (app) requestAnimationFrame(() => finish(false));
    },
    ready() {
      app = true;
      if (css) requestAnimationFrame(() => finish(false));
    },
    fail() {
      finish(true);
    },
    get failed() {
      return r.classList.contains("entry-failed");
    },
  };
})();
// Resource load listeners are registered before the main stylesheet and scripts.
// This keeps executable code out of HTML attributes under script-src-attr 'none'.
document.addEventListener(
  "load",
  (event) => {
    if (
      event.target instanceof HTMLLinkElement &&
      event.target.matches("[data-entry-style]")
    ) {
      window.HackItEntry?.css();
    }
  },
  true,
);
document.addEventListener(
  "error",
  (event) => {
    const target = event.target;
    if (
      (target instanceof HTMLLinkElement &&
        target.matches("[data-entry-style]")) ||
      (target instanceof HTMLScriptElement &&
        /\/(?:app|masonry|i18n)(?:\.[a-f0-9]{12})?\.js(?:\?|$)/.test(
          target.src,
        ))
    ) {
      window.HackItEntry?.fail();
    }
  },
  true,
);
