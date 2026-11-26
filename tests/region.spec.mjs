import { expect, test } from "@playwright/test";

test("first entry suggests Taiwan from the network and keeps a manual global choice", async ({
  page,
}) => {
  await page.route("**/cdn-cgi/trace", (route) =>
    route.fulfill({ body: "loc=TW\n" }),
  );
  await page.goto("/en/");
  const dialog = page.getByRole("dialog", { name: "Choose your region" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("#region-recommended")).toBeVisible();
  await expect(page.locator("#region-title")).toBeFocused();
  await expect(page.locator("#region-taiwan")).toHaveAttribute(
    "href",
    "https://www.hackit.tw/en",
  );
  await dialog.getByRole("button", { name: /Global site/ }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(dialog).toBeHidden();
  await page.locator("[data-open-region]").click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator("[data-open-region]")).toBeFocused();
});

test("a saved Taiwan choice forwards repeat visits and can be changed", async ({
  page,
}) => {
  await page.route("**/cdn-cgi/trace", (route) => route.abort());
  await page.route("https://www.hackit.tw/**", (route) =>
    route.fulfill({ body: "Taiwan" }),
  );
  await page.goto("/zh-HK/");
  await expect(page.locator("#region-title")).toHaveText("選擇你的地區");
  await expect(page.locator("#region-recommended")).toBeHidden();
  await page.locator("#region-remember").check();
  await page.locator("#region-taiwan").click();
  await expect(page).toHaveURL("https://www.hackit.tw/zh-TW");
  await page.goBack();
  await expect(page.locator("#region-dialog")).toBeVisible();
  await page.goto("/en/");
  await expect(page).toHaveURL("https://www.hackit.tw/en");
  await page.goto("/en/?region=choose");
  await page.locator("#region-global").click();
  await page.goto("/en/");
  await expect(page.locator("#region-dialog")).toBeHidden();
});

test("visitors outside Taiwan see the global recommendation and can still select Taiwan", async ({
  page,
}) => {
  await page.route("**/cdn-cgi/trace", (route) =>
    route.fulfill({ body: "loc=JP\n" }),
  );
  await page.goto("/zh-CN/");
  await expect(
    page.locator("#region-global #region-recommended"),
  ).toBeVisible();
  await expect(page.locator("#region-taiwan")).toHaveAttribute(
    "href",
    "https://www.hackit.tw/zh-TW",
  );
});
