import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./e2e/index.html");
});

test("should display the title", async ({ page }) => {
  const title = await page.textContent("h1");
  expect(title).toBe("Complex HTML Page");
});

test.skip("should select heading and serialize with Rangee", async ({
  page,
}) => {
  const heading = await page.waitForSelector("h1");
  await heading.selectText();
});
