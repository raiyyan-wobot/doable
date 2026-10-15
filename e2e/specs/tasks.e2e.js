// User journeys against the real app (real Rust backend, real disk).
// Screenshots land in e2e/screenshots/ for visual review.
import { browser, $, expect } from "@wdio/globals";
import { readFileSync } from "node:fs";
import path from "node:path";

const shot = (name) => browser.saveScreenshot(`./e2e/screenshots/${name}.png`);

/** Visible task titles, top to bottom. Read in one script call, so a row
 *  re-rendering mid-read can't leave us holding a stale element. */
function taskTitles() {
  return browser.execute(() =>
    [...document.querySelectorAll('[data-testid="task-item"] p:first-of-type')].map((p) => p.textContent),
  );
}

/** Read the save file Rust wrote. */
function savedTasks() {
  const file = path.join(process.env.DOABLE_DATA_DIR, "tasks.json");
  return JSON.parse(readFileSync(file, "utf8")).tasks;
}

/** The floating "New task" button (it declares its N shortcut). */
const NEW_TASK_FAB = 'button[aria-keyshortcuts="N"]';

/** XPath for the input a <label> points at (TextField links them with for/id). */
const fieldByLabel = (label) => `//input[@id=//label[normalize-space()="${label}"]/@for]`;

/** Click once nothing covers the element (e.g. a dialog scrim still fading out). */
async function clickWhenClickable(selectorOrElement) {
  const element = typeof selectorOrElement === "string" ? await $(selectorOrElement) : await selectorOrElement;
  await element.waitForClickable();
  await element.click();
}

async function createTask({ title, tags = "" }) {
  await clickWhenClickable(NEW_TASK_FAB);
  const dialog = await $('[role="dialog"]');
  await dialog.waitForDisplayed();
  await dialog.$(fieldByLabel("Title")).setValue(title);
  if (tags) await dialog.$(fieldByLabel("Tags")).setValue(tags);
  await dialog.$('//button[normalize-space()="Add task"]').click();
  await dialog.waitForDisplayed({ reverse: true });
}

describe("Doable", () => {
  it("starts empty", async () => {
    await expect($("h2=No tasks yet")).toBeDisplayed();
    await shot("01-empty");
  });

  it("creates tasks and saves them to disk", async () => {
    await createTask({ title: "Renew passport", tags: "errands" });
    await createTask({ title: "Finish quarterly report", tags: "work" });
    await createTask({ title: "Call the plumber", tags: "home, errands" });

    await browser.waitUntil(async () => (await taskTitles()).length === 3);
    expect(await taskTitles()).toEqual(["Call the plumber", "Finish quarterly report", "Renew passport"]);

    const saved = savedTasks();
    expect(saved.map((t) => t.title).sort()).toEqual(
      ["Call the plumber", "Finish quarterly report", "Renew passport"],
    );
    expect(saved.find((t) => t.title === "Call the plumber").tags).toEqual(["errands", "home"]);
    await shot("02-list");
  });

  it("opens the editor dialog", async () => {
    await clickWhenClickable(NEW_TASK_FAB);
    await $('[role="dialog"]').waitForDisplayed();
    await browser.pause(500); // let the enter animation settle for the screenshot
    await shot("03-editor");
    await browser.keys("Escape");
    await $('[role="dialog"]').waitForDisplayed({ reverse: true });
  });

  it("sets a due date with the date picker", async () => {
    await clickWhenClickable(NEW_TASK_FAB);
    const dialog = await $('[role="dialog"]');
    await dialog.waitForDisplayed();
    await dialog.$(fieldByLabel("Title")).setValue("Book dentist");
    await clickWhenClickable(dialog.$('button[aria-label^="Due date:"]'));
    const picker = await $('[aria-label="Choose date"]');
    await picker.waitForDisplayed();
    await browser.pause(400);
    await shot("03b-date-picker");
    // Relative XPath (".//"): a leading "//" would search the whole page.
    await clickWhenClickable(picker.$('.//button[normalize-space()="Today"]'));
    await clickWhenClickable(dialog.$('.//button[normalize-space()="Add task"]'));
    await dialog.waitForDisplayed({ reverse: true });

    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await browser.waitUntil(() => savedTasks().some((t) => t.title === "Book dentist"));
    expect(savedTasks().find((t) => t.title === "Book dentist").dueDate).toBe(iso);
  });

  it("searches", async () => {
    const search = await $('input[type="search"]');
    await search.setValue("plumb");
    await browser.waitUntil(async () => (await taskTitles()).length === 1);
    expect(await taskTitles()).toEqual(["Call the plumber"]);
    // Clear like a user would. (WebKit's clearValue doesn't fire `input`.)
    await $('button[aria-label="Clear search"]').click();
    await browser.waitUntil(async () => (await taskTitles()).length === 4);
  });

  it("completing a task moves it to Completed", async () => {
    // Click the visible box, like a user. Kobalte keeps the real <input>
    // visually hidden (for screen readers), so WebDriver can't click it.
    await clickWhenClickable(`//input[@aria-label='Mark "Renew passport" as done']/following-sibling::*[1]`);
    await browser.waitUntil(async () => (await taskTitles()).length === 3);

    await clickWhenClickable('//nav[@aria-label="Views"]//button[contains(., "Completed")]');
    await browser.waitUntil(async () => (await taskTitles()).join() === "Renew passport");
    expect(savedTasks().find((t) => t.title === "Renew passport").completed).toBe(true);
    await shot("04-completed");
  });

  it("filters by tag from the rail, within the current view", async () => {
    // Still in Completed: the tag narrows that view.
    await clickWhenClickable('//nav[@aria-label="Tags"]//button[contains(., "errands")]');
    await browser.waitUntil(async () => (await taskTitles()).join() === "Renew passport");
    await browser.waitUntil(async () => (await $("h1").getProperty("textContent")) === "#errands");

    // Switch status to Active with the chip menu: the tag stays applied.
    await clickWhenClickable('button[aria-label^="Status:"]');
    await clickWhenClickable('//*[@role="menuitemradio"][normalize-space()="Active"]');
    await $('[role="menu"]').waitForExist({ reverse: true });
    await browser.waitUntil(async () => (await taskTitles()).join() === "Call the plumber");
    await shot("05-tag");
  });

  it("opens the filter and appearance menus", async () => {
    await clickWhenClickable('//nav[@aria-label="Views"]//button[contains(., "Active")]');
    await clickWhenClickable('button[aria-label^="Priority:"]');
    await $('[role="menu"]').waitForDisplayed();
    await browser.pause(400);
    await shot("06-filter-menu");
    await browser.keys("Escape");
    await $('[role="menu"]').waitForExist({ reverse: true });

    await clickWhenClickable('button[aria-label="Appearance"]');
    await $('[role="menu"]').waitForDisplayed();
    await browser.pause(400);
    await shot("07-appearance-menu");
    await browser.keys("Escape");
  });
});
