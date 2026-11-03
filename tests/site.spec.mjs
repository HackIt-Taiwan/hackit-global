import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const locales = ["zh-TW", "zh-HK", "zh-CN", "en"];
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__securityViolations = [];
    document.addEventListener("securitypolicyviolation", (event) =>
      window.__securityViolations.push(event.violatedDirective),
    );
  });
});

async function ready(page, path = "/en/") {
  await page.goto(path);
  await expect(page.locator("html")).not.toHaveClass(/booting/);
  await expect(page.locator("html")).not.toHaveClass(/entry-failed/);
}
async function noPolicyViolations(page) {
  expect(await page.evaluate(() => window.__securityViolations)).toEqual([]);
}

test("four localized routes hydrate with complete content and canonical metadata", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const locale of locales) {
    await ready(page, "/" + locale + "/");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveClass(/animated/);
    await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
      "href",
      "https://www.hackit.global/" + locale + "/",
    );
    await expect(page.locator(".reading-view .mission-paragraph")).toHaveCount(
      9,
    );
    await expect(
      page.locator(".reading-view .wall-quote[data-quote-index]"),
    ).toHaveCount(16);
    await expect(page.locator(".reading-view .wall-photo")).toHaveCount(42);
    await expect(page.locator(".ssr-story-full")).toHaveCount(3);
    await expect(page.locator("#site-language")).toBeInViewport();
    if (locale === "en") {
      await expect(page.locator(".wall-scene .wall-header h2")).toHaveText(
        "More than projects. Stories that stay.",
      );
      const phraseRectangles = await page
        .locator(".mission-scene h2 span")
        .evaluate((element) => {
          const node = element.firstChild;
          const start = node.textContent.indexOf("hands‑on.");
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, start + "hands‑on.".length);
          return range.getClientRects().length;
        });
      expect(phraseRectangles).toBe(1);
    }
    await noPolicyViolations(page);
  }
  expect(errors).toEqual([]);
});

test("manual locale persists while an explicit URL retains precedence", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#site-language").selectOption("zh-HK");
  await expect(page).toHaveURL(/\/zh-HK\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-HK");
  expect(await page.evaluate(() => localStorage.getItem("hackit-locale"))).toBe(
    "zh-HK",
  );
  await ready(page, "/");
  await expect(page).toHaveURL(/\/zh-HK\/$/);
  await ready(page, "/en/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
    "href",
    "https://www.hackit.global/en/",
  );
  await noPolicyViolations(page);
});

test("map controls remain operable and only the Taiwan panel opens", async ({
  page,
}) => {
  await ready(page);
  await page.locator("[data-view=world]").click();
  await expect(page.locator("[data-view=world]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("[data-view=asia]").click();
  await expect(page.locator("[data-view=asia]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator(".map-activation").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#taiwan-panel")).toBeVisible();
  await expect(page.locator("#taiwan-panel a")).toHaveAttribute(
    "href",
    "https://hackit.tw",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#taiwan-panel")).toBeHidden();
  await expect(page.locator(".map-activation")).toBeFocused();
  await noPolicyViolations(page);
});

test("keyboard dialogs preserve complete story text, Escape and focus return", async ({
  page,
}) => {
  await ready(page, "/en/#overview");
  const trigger = page.locator(".reading-view .join-open");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#join-dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => document.activeElement.closest("#join-dialog") !== null,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#join-dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
  const story = page.locator(".reading-view .story-read-more").first();
  await story.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#story-dialog")).toBeVisible();
  expect(
    (await page.locator("#story-dialog-body").textContent()).length,
  ).toBeGreaterThan(300);
  await page.keyboard.press("Escape");
  await expect(page.locator("#story-dialog")).toBeHidden();
  await expect(story).toBeFocused();
  await noPolicyViolations(page);
});

test("Taiwan popover reverses motion without losing the latest intent or focus", async ({
  page,
}) => {
  await ready(page);
  const trigger = page.locator(".map-activation"),
    panel = page.locator("#taiwan-panel");
  await page.locator(".map-activation circle").click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const continuity = await panel.evaluate((element) => {
    const motion = element.getAnimations()[0];
    motion.pause();
    motion.currentTime = 90;
    const before = Number(getComputedStyle(element).opacity),
      button = document.querySelector(".map-activation");
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return { before, after: Number(getComputedStyle(element).opacity) };
  });
  expect(continuity.before).toBeGreaterThan(0);
  expect(continuity.before).toBeLessThan(1);
  expect(Math.abs(continuity.after - continuity.before)).toBeLessThan(0.1);
  await expect
    .poll(() => panel.evaluate((element) => element.getAnimations().length))
    .toBe(0);
  await expect(panel).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await panel.locator("button").click();
  await expect(trigger).toBeFocused();
  await expect(panel).toHaveJSProperty("inert", true);
  await expect(panel).toBeHidden();
  await page.keyboard.press("Space");
  await expect(panel.locator("a")).toBeFocused();
  const world = page.locator("[data-view=world]");
  await world.focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeHidden();
  await expect(world).toBeFocused();
  await page.locator("[data-view=asia]").click();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(panel).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await noPolicyViolations(page);
});

test("Taiwan popover is readable in every locale and fits a short viewport", async ({
  page,
  browserName,
}) => {
  test.setTimeout(90_000);
  const panel = page.locator("#taiwan-panel"),
    trigger = page.locator(".map-activation");
  for (const locale of locales) {
    await ready(page, "/" + locale + "/");
    await trigger.focus();
    await page.keyboard.press("Space");
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("role", "region");
    await expect(panel.locator("a")).toBeFocused();
    await expect
      .poll(() => panel.evaluate((element) => element.getAnimations().length))
      .toBe(0);
    expect(
      (
        await new AxeBuilder({ page })
          .setLegacyMode()
          .include("#taiwan-panel")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  }
  await page.setViewportSize({ width: 568, height: 320 });
  await ready(page);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => panel.evaluate((element) => element.getAnimations().length))
    .toBe(0);
  const bounds = await panel.boundingBox(),
    viewport = await page.evaluate(() => ({
      width: visualViewport.width,
      height: visualViewport.height,
    }));
  expect(bounds.x).toBeGreaterThanOrEqual(15);
  expect(bounds.y).toBeGreaterThanOrEqual(15);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width - 15);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - 15);
  const link = panel.locator("a");
  await link.evaluate((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      element.dataset.clicked = "true";
    });
  });
  await link.click({ position: { x: 20, y: 23 } });
  await expect(link).toHaveAttribute("data-clicked", "true");
  await panel.locator("button").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(panel).toBeHidden();
  await expect(panel).not.toHaveAttribute(
    "data-panel-motion",
    /opening|closing/,
  );
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveClass(/animated/);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await page.setViewportSize({ width: 220, height: 640 });
  await ready(page);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => panel.evaluate((element) => element.getAnimations().length))
    .toBe(0);
  const narrow = await panel.boundingBox();
  expect(narrow.x).toBeGreaterThanOrEqual(15);
  expect(narrow.x + narrow.width).toBeLessThanOrEqual(205);
  await panel.locator("button").click();
  await expect(panel).toBeHidden();
  if (browserName === "chromium") {
    await page.setViewportSize({ width: 390, height: 844 });
    await ready(page);
    const session = await page.context().newCDPSession(page);
    try {
      await session.send("Emulation.setPageScaleFactor", {
        pageScaleFactor: 2,
      });
      await expect
        .poll(() => page.evaluate(() => visualViewport.scale))
        .toBe(2);
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect
        .poll(() => panel.evaluate((element) => element.getAnimations().length))
        .toBe(0);
      const zoomed = await panel.boundingBox(),
        visible = await page.evaluate(() => ({
          left: visualViewport.offsetLeft,
          width: visualViewport.width,
        }));
      expect(zoomed.x).toBeGreaterThanOrEqual(visible.left + 15);
      expect(zoomed.x + zoomed.width).toBeLessThanOrEqual(
        visible.left + visible.width - 15,
      );
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
    } finally {
      await session.send("Emulation.setPageScaleFactor", {
        pageScaleFactor: 1,
      });
      await session.detach();
    }
  }
  await noPolicyViolations(page);
});

test("hero, reading view and join dialog pass automated WCAG checks", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await ready(page);
  expect(
    (
      await new AxeBuilder({ page })
        .setLegacyMode()
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.locator("#skip-story").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#overview")).toBeFocused();
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");
  expect(
    (
      await new AxeBuilder({ page })
        .setLegacyMode()
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.locator(".reading-view .join-open").click();
  await expect(page.locator("#join-dialog")).not.toHaveAttribute(
    "data-dialog-motion",
    /opening|closing/,
  );
  expect(
    (
      await new AxeBuilder({ page })
        .setLegacyMode()
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("reduced motion remains readable and restoring animation rebuilds map geometry", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await expect(page.locator("html")).not.toHaveClass(/animated/);
  await expect(page.locator(".reading-view .reading-logo")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveClass(/animated/);
  await expect(page.locator(".map-activation")).toBeInViewport();
  const bounds = await page.locator(".map-viewport svg").boundingBox();
  expect(bounds.width).toBeGreaterThan(0);
  expect(bounds.height).toBeGreaterThan(0);
  await noPolicyViolations(page);
});

test("scroll animation stays enabled through the complete story on each viewport", async ({
  page,
}) => {
  await ready(page);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const fraction of [0.15, 0.4, 0.65, 0.85, 1]) {
    await page.evaluate((value) => {
      const story = document.querySelector(".story");
      scrollTo(0, story.offsetTop + (story.offsetHeight - innerHeight) * value);
    }, fraction);
    await page.waitForTimeout(120);
    await expect(page.locator("html")).toHaveClass(/animated/);
  }
  await expect(page.locator(".join-scene .join-open")).toBeInViewport();
  expect(errors).toEqual([]);
  await noPolicyViolations(page);
});

test("no JavaScript keeps localized mission, wall and native stories accessible", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + "/en/");
    await expect(page.locator(".reading-view")).toBeVisible();
    await expect(page.locator(".reading-view .mission-paragraph")).toHaveCount(
      9,
    );
    await expect(
      page.locator(".reading-view .wall-quote[data-quote-index]"),
    ).toHaveCount(16);
    await expect(page.locator("noscript a[hreflang]")).toHaveCount(4);
    await page.locator(".ssr-story-full").first().locator("summary").click();
    await expect(page.locator(".ssr-story-full").first()).toHaveAttribute(
      "open",
      "",
    );
    expect(
      (await page.locator(".ssr-story-full").first().innerText()).length,
    ).toBeGreaterThan(300);
  } finally {
    await context.close();
  }
});
