(() => {
  const dialog = document.getElementById("region-dialog");
  if (typeof dialog?.showModal !== "function") return;

  const remember = document.getElementById("region-remember");
  const taiwan = document.getElementById("region-taiwan");
  const key = "hackit-region";
  let saved;
  let staying;
  try {
    saved = localStorage.getItem(key);
    staying = sessionStorage.getItem(key) === "global";
  } catch {
    // Browsing and choosing a region also work with storage disabled.
  }

  let opener;
  let detectionStarted = false;
  function openChooser() {
    if (dialog.open) return;
    dialog.showModal();
    if (detectionStarted) return;
    detectionStarted = true;
    // Cloudflare serves this on our own hostname. Only the country code affects the suggestion.
    fetch("/cdn-cgi/trace", {
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout?.(2500),
    })
      .then((response) => response.ok && response.text())
      .then((trace) => {
        const country = /^loc=([A-Z]{2})\r?$/m.exec(trace)?.[1];
        if (!country || country === "XX") return;
        const suggested =
          country === "TW" ? taiwan : document.getElementById("region-global");
        const badge = document.getElementById("region-recommended");
        suggested.insertBefore(badge, suggested.querySelector(".region-arrow"));
        suggested.classList.add("suggested");
        badge.hidden = false;
      })
      .catch(() => {});
  }

  function choose(region) {
    try {
      if (remember.checked) localStorage.setItem(key, region);
      else localStorage.removeItem(key);
      if (region === "global") sessionStorage.setItem(key, region);
      else sessionStorage.removeItem(key);
    } catch {}
  }

  function stay() {
    choose("global");
    dialog.close();
    opener?.focus({ preventScroll: true });
  }

  document.getElementById("region-global").addEventListener("click", stay);
  taiwan.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
      return;
    choose("tw");
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    stay();
  });
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-region]");
    if (trigger) {
      opener = trigger;
      openChooser();
    }
  });
  remember.checked = saved === "global" || saved === "tw";
  const url = new URL(location.href);
  const chooseAgain = url.searchParams.get("region") === "choose";
  const returning =
    performance.getEntriesByType("navigation")[0]?.type === "back_forward";
  const fromTaiwan = document.referrer && new URL(document.referrer).hostname;
  if (
    saved === "tw" &&
    !chooseAgain &&
    !staying &&
    !returning &&
    !url.hash &&
    fromTaiwan !== "www.hackit.tw" &&
    fromTaiwan !== "hackit.tw"
  ) {
    location.replace(taiwan.href);
  } else if (chooseAgain || (!staying && saved !== "global")) {
    openChooser();
  }
})();
