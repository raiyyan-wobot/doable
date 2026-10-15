// Motion regression tests: overlays must never flicker.
//
// A closing overlay's opacity must only go down (an overshooting spring on
// opacity made it dip past 0 and swing back up, so a closing menu briefly
// reappeared). An opening overlay's opacity must only go up. Opacity is
// sampled on every animation frame inside the real webview.
import { browser, $, expect } from "@wdio/globals";

/**
 * Sample computed opacity of `selector` every frame until it's removed (or
 * `ms` passes), starting right after `trigger` runs. Returns the samples.
 */
function sampleOpacity(selector, ms) {
  return browser.execute(
    (sel, duration) =>
      new Promise((resolve) => {
        const element = document.querySelector(sel);
        const samples = [];
        const start = performance.now();
        const tick = () => {
          if (!element.isConnected || performance.now() - start > duration) return resolve(samples);
          samples.push(Number(getComputedStyle(element).opacity));
          requestAnimationFrame(tick);
        };
        tick();
      }),
    selector,
    ms,
  );
}

/** True if values never go up by more than rounding noise. */
const nonIncreasing = (values) => values.every((v, i) => i === 0 || v <= values[i - 1] + 0.001);
const nonDecreasing = (values) => values.every((v, i) => i === 0 || v >= values[i - 1] - 0.001);

async function clickWhenClickable(selector) {
  const element = await $(selector);
  await element.waitForClickable();
  await element.click();
}

describe("Motion: no flicker", () => {
  it("opening a second menu closes the first without it reappearing", async () => {
    await clickWhenClickable('button[aria-label^="Status:"]');
    await $('[role="menu"]').waitForDisplayed();
    await browser.pause(400); // fully open

    // Tag the open menu, then open another one: the tagged menu closes.
    await browser.execute(() => document.querySelector('[role="menu"]').setAttribute("data-test-first", ""));
    const samplesPromise = sampleOpacity("[data-test-first]", 1500);
    await $('button[aria-label^="Priority:"]').click();
    const samples = await samplesPromise;

    expect(samples.length).toBeGreaterThan(2);
    expect(nonIncreasing(samples)).toBe(true);
    await browser.keys("Escape");
    await $('[role="menu"]').waitForExist({ reverse: true });
  });

  it("dialogs fade in monotonically and fade out monotonically", async () => {
    await clickWhenClickable('button[aria-keyshortcuts="N"]');
    const opening = await sampleOpacity('[role="dialog"]', 600);
    expect(nonDecreasing(opening)).toBe(true);

    await browser.pause(300);
    const closingPromise = sampleOpacity('[role="dialog"]', 1500);
    await browser.keys("Escape");
    const closing = await closingPromise;
    expect(nonIncreasing(closing)).toBe(true);
    await $('[role="dialog"]').waitForExist({ reverse: true });
  });

  it("quickly toggling a menu leaves exactly one or zero menus, never a stuck one", async () => {
    for (let i = 0; i < 5; i++) {
      await $('button[aria-label^="Priority:"]').click();
    }
    // Odd number of clicks: one menu open. Then close it.
    await browser.pause(500);
    const open = await browser.execute(() => document.querySelectorAll('[role="menu"]').length);
    expect(open).toBe(1);
    await browser.keys("Escape");
    await $('[role="menu"]').waitForExist({ reverse: true });
  });
});
