import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("index.html");
});

test("should display the title", async ({ page }) => {
  const title = await page.textContent("h1");
  expect(title).toBe("Complex HTML Page");
});

test("should select whole heading and serialize with Rangee", async ({
  page,
}) => {
  const heading = await page.waitForSelector("h1");
  await heading.selectText();
  const button = await page.waitForSelector("#get");
  await button.click();
  const highlights = await page.waitForSelector("mark");
  expect(await highlights.textContent()).toBe("Complex HTML Page");
});

test("should select text across few elements and serialize with Rangee", async ({
  page,
}) => {
  await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const li = document.querySelector("li");

    if (h1 && li) {
      // Create a range object to specify the text to select
      const range = document.createRange();

      // Set the start and end points of the selection (adjust the offsets)
      range.setStart(h1.firstChild!, 1); // Start at the first character
      range.setEnd(li.lastChild!.firstChild!, 3); // End after the 5th character

      // Remove any existing selections
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, []);
  const button = await page.waitForSelector("#get");
  await button.click();
  const expectedTexts = [
    "omplex HTML Page",
    "Header section with some text.",
    "Sec",
    "highlighted text",
  ];
  const received = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll("mark")).map((el) => el.textContent),
    []
  );
  expect(received).toStrictEqual(expectedTexts);
});
