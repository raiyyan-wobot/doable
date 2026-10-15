// Accessibility, readability and responsive checks against the real app.
//
// - axe-core (bundled locally, injected into the webview) audits WCAG 2.1 A/AA:
//   rendered color contrast, names/labels, ARIA usage.
// - A readability check: no visible text below M3's smallest style (11px).
// - Responsive: the layout switches at the M3 window size classes.
// Screenshots land in e2e/screenshots/a11y-*.png.
import { browser, $, $$, expect } from "@wdio/globals";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE_SOURCE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const MIN_FONT_PX = 11; // M3 label-small

const shot = (name) => browser.saveScreenshot(`./e2e/screenshots/a11y-${name}.png`);

/** Seed tasks through the real Rust commands, then reload so the UI shows them. */
async function seedTasks() {
  await browser.execute(async () => {
    const invoke = window.__TAURI_INTERNALS__.invoke;
    const today = new Date();
    const iso = (offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const tasks = [
      { title: "Renew passport", description: "Bring two photos", priority: "high", dueDate: iso(-2), tags: ["errands"] },
      { title: "Finish quarterly report", description: "", priority: "medium", dueDate: iso(0), tags: ["work"] },
      { title: "Read chapter 5", description: "Take notes on replication", priority: "low", dueDate: null, tags: ["books"] },
    ];
    for (const input of tasks) await invoke("create_task", { input });
  });
  await browser.refresh();
  await $$('[data-testid="task-item"]')[0].waitForDisplayed();
}

/** Run axe on the current page; returns violations as readable strings. */
async function axeViolations() {
  // Wait for enter animations and color transitions to finish: mid-animation,
  // colors are blended and axe would measure contrast that users never see at rest.
  // (Return nothing: WebDriver can't serialize Animation objects.)
  await browser.execute(async () => {
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
  });
  await browser.execute(AXE_SOURCE);
  const violations = await browser.execute(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    return result.violations.map((v) => ({
      id: v.id,
      help: v.help,
      nodes: v.nodes.slice(0, 3).map((n) => `${n.target.join(" ")} — ${n.failureSummary?.split("\n").slice(1).join(" ")}`),
    }));
  });
  return violations.map((v) => `${v.id}: ${v.help}\n    ${v.nodes.join("\n    ")}`);
}

/** Visible text elements smaller than the minimum size. */
function tooSmallText(minPx) {
  return browser.execute((min) => {
    const found = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const element = node.parentElement;
      if (!node.textContent.trim() || !element) continue;
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      if (box.width === 0 || style.visibility === "hidden" || style.display === "none") continue;
      if (element.closest('[aria-hidden="true"]')) continue;
      const size = parseFloat(style.fontSize);
      if (size < min) found.push(`${size}px: "${node.textContent.trim().slice(0, 30)}"`);
    }
    return found;
  }, minPx);
}

/** Click once nothing covers the element (animations, page just reloaded). */
async function clickWhenClickable(selector) {
  const element = await $(selector);
  await element.waitForClickable();
  await element.click();
}

async function setTheme(mode) {
  await clickWhenClickable('button[aria-label="Appearance"]');
  const item = await $(`//*[@role="menuitemradio"][normalize-space()="${mode}"]`);
  await item.waitForClickable();
  await item.click();
  await $('[role="menu"]').waitForDisplayed({ reverse: true });
}

describe("Accessibility & readability", () => {
  before(async () => {
    await browser.setWindowSize(1100, 760);
    await seedTasks();
  });

  for (const mode of ["Light", "Dark"]) {
    describe(`${mode} theme`, () => {
      before(() => setTheme(mode));

      it("task list passes axe (WCAG 2.1 AA)", async () => {
        await browser.pause(300);
        await shot(`list-${mode.toLowerCase()}`);
        expect(await axeViolations()).toEqual([]);
      });

      it("editor dialog and date picker pass axe", async () => {
        await clickWhenClickable('button[aria-keyshortcuts="N"]');
        const dialog = await $('[role="dialog"]');
        await dialog.waitForDisplayed();
        expect(await axeViolations()).toEqual([]);

        const due = await dialog.$('button[aria-label^="Due date:"]');
        await due.waitForClickable();
        await due.click();
        await $('[aria-label="Choose date"]').waitForDisplayed();
        await browser.pause(300);
        await shot(`date-picker-${mode.toLowerCase()}`);
        expect(await axeViolations()).toEqual([]);

        await browser.keys("Escape"); // close the picker
        await $('[aria-label="Choose date"]').waitForDisplayed({ reverse: true });
        const cancel = await dialog.$('.//button[normalize-space()="Cancel"]');
        await cancel.waitForClickable();
        await cancel.click();
        await dialog.waitForDisplayed({ reverse: true });
      });

      it("menus pass axe", async () => {
        await clickWhenClickable('button[aria-label^="Priority:"]');
        await $('[role="menu"]').waitForDisplayed();
        expect(await axeViolations()).toEqual([]);
        await browser.keys("Escape");
        await $('[role="menu"]').waitForDisplayed({ reverse: true });
      });

      it(`no visible text is smaller than ${MIN_FONT_PX}px`, async () => {
        expect(await tooSmallText(MIN_FONT_PX)).toEqual([]);
      });
    });
  }
});

describe("Responsive layout", () => {
  after(() => browser.setWindowSize(1100, 760));

  it("compact (< 600px): no rail, drawer from the search bar", async () => {
    await browser.setWindowSize(420, 760);
    await $('nav[aria-label="Views"]').waitForDisplayed({ reverse: true });
    await shot("compact");
    await clickWhenClickable('button[aria-label="Open navigation"]');
    await $('[role="dialog"][aria-label="Navigation"]').waitForDisplayed();
    await browser.pause(400);
    await shot("compact-drawer");
    expect(await axeViolations()).toEqual([]);
    await browser.keys("Escape");
    await $('[role="dialog"][aria-label="Navigation"]').waitForDisplayed({ reverse: true });
  });

  it("medium (600–839px): collapsed rail", async () => {
    await browser.setWindowSize(720, 760);
    await $('nav[aria-label="Views"]').waitForDisplayed();
    await expect($('nav[aria-label="Tags"]')).not.toBeDisplayed();
    await shot("medium");
    expect(await axeViolations()).toEqual([]);
  });

  it("expanded (≥ 840px): full rail with tags", async () => {
    await browser.setWindowSize(1100, 760);
    await $('nav[aria-label="Tags"]').waitForDisplayed();
  });
});
