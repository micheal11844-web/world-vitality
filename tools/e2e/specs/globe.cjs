// The Globe page, in a real browser with software WebGL: it fills the window once the 3D view has
// drawn, the corner buttons bring things back, Escape peels off one layer at a time, and the
// events list (the way in for a keyboard or screen-reader user) opens the same panel as a dot and
// hands keyboard focus back. Run on a desktop window in English and on a phone in Arabic.
"use strict";
const { launch, BASE, SHOTS, signedIn } = require("../harness/browser.cjs");
const { checker } = require("../harness/check.cjs");

const VARIANTS = [
  { name: "desktop-en", locale: "en-US", context: { viewport: { width: 1280, height: 800 } } },
  {
    name: "phone-ar",
    locale: "ar",
    context: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
  },
];

async function runVariant(browser, variant, ok) {
  const label = `${variant.name}: `;
  const check = (name, cond, extra) => ok(label + name, cond, extra);
  const arabic = variant.locale.startsWith("ar");
  const ctx = await browser.newContext({ ...variant.context, locale: variant.locale });
  await ctx.addCookies(signedIn());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text().slice(0, 240));
  });

  const root = page.locator('[data-testid="globe-root"]');
  const mode = () => root.getAttribute("data-immersive");
  const byId = (id) => page.locator(`[data-testid="${id}"]`);
  const focusedId = () =>
    page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? null);
  const shown = (sel) =>
    page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return getComputedStyle(el).display !== "none" && r.width > 0 && r.height > 0;
    }, sel);
  const canvasInfo = () =>
    page.evaluate(() => {
      const c = document.querySelector(".cesium-widget canvas");
      const r = c.getBoundingClientRect();
      return {
        cssW: Math.round(r.width),
        cssH: Math.round(r.height),
        bufW: c.width,
        bufH: c.height,
        dpr: window.devicePixelRatio,
      };
    });
  const vp = page.viewportSize();
  // The globe draws at CSS-pixel resolution on purpose, so the buffer matches the CSS size or the device size.
  const bufOk = (c) =>
    [1, c.dpr].some(
      (k) => Math.abs(c.bufW - c.cssW * k) <= 2 && Math.abs(c.bufH - c.cssH * k) <= 2,
    );
  const fillsWindow = (c) => c.cssW >= vp.width - 1 && c.cssH >= vp.height - 1;
  // The page layout changes at once, but the 3D engine resizes its drawing buffer on its next
  // frame, which is slow without a graphics card (a shared CI runner). So wait for the canvas to
  // settle instead of reading it at a fixed moment; a canvas that never settles still fails.
  const settledCanvas = async (ready, timeoutMs = 20000) => {
    const deadline = Date.now() + timeoutMs;
    let c = await canvasInfo();
    while (!ready(c) && Date.now() < deadline) {
      await page.waitForTimeout(250);
      c = await canvasInfo();
    }
    return c;
  };

  // ---- before the 3D view has drawn, the page is its normal self ----
  await page.goto(BASE + "/globe", { waitUntil: "commit" });
  await root.waitFor({ timeout: 60000 });
  check("before the 3D globe draws, the page is not in full view", (await mode()) === "false");

  // ---- full view by itself once the first frame is drawn ----
  // (Wait for the state itself: the preview can read as "detached" simply because it has not mounted yet.)
  await page.waitForSelector('[data-testid="globe-root"][data-immersive="true"]', {
    timeout: 150000,
  });
  await page.waitForTimeout(1500);
  check("the page entered full view by itself", (await mode()) === "true");
  check("header is gone", !(await shown("header")));
  check("sidebar / drawer is gone", !(await shown(".wv-shell-drawer")));
  check("AI rail is gone", !(await shown(".wv-shell-ai")));
  check("bottom bar is gone", !(await shown(".wv-shell-bottomnav")));
  check("help character is gone", !(await shown(".wv-shell-guide")));
  check(
    "page title and status text above the map are gone",
    (await page.locator("h1").count()) === 0 && (await byId("globe-watch-status").count()) === 0,
  );
  const c1 = await settledCanvas((c) => fillsWindow(c) && bufOk(c));
  check(
    `the globe fills the whole window (${c1.cssW}x${c1.cssH} of ${vp.width}x${vp.height})`,
    fillsWindow(c1),
  );
  check(`the 3D canvas buffer matches (${c1.bufW}x${c1.bufH} at ${c1.dpr}x)`, bufOk(c1));
  check(
    "no page scrollbars in full view",
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= window.innerWidth &&
        document.documentElement.scrollHeight <= window.innerHeight,
    ),
  );
  const toggle = byId("globe-full-toggle");
  const infoBtn = byId("globe-full-info");
  const browserBtn = byId("globe-browser-full");
  check("corner button: Legend and status", await infoBtn.isVisible());
  check("corner button: Show menus", await toggle.isVisible());
  check("corner button: Full screen", await browserBtn.isVisible());
  for (const [name, loc] of [
    ["Show menus", toggle],
    ["Legend and status", infoBtn],
    ["Full screen", browserBtn],
  ]) {
    const b = await loc.boundingBox();
    check(
      `"${name}" is at least 44px tall and inside the window`,
      b.height >= 43.5 && b.x >= 0 && b.x + b.width <= vp.width && b.y >= 0,
      `${Math.round(b.width)}x${Math.round(b.height)} at ${Math.round(b.x)},${Math.round(b.y)}`,
    );
  }
  await page.screenshot({ path: `${SHOTS}/globe-${variant.name}-1-full-view.png` });

  // ---- the Legend and status card, and Escape closing it first ----
  const card = byId("globe-full-info-card");
  await infoBtn.click();
  check("Legend and status opens a card", await card.isVisible());
  check("the button says it is expanded", (await infoBtn.getAttribute("aria-expanded")) === "true");
  const cb = await card.boundingBox();
  check(
    "the card stays inside the window",
    cb.x >= 0 && cb.x + cb.width <= vp.width && cb.y + cb.height <= vp.height,
    `${Math.round(cb.x)},${Math.round(cb.y)} ${Math.round(cb.width)}x${Math.round(cb.height)}`,
  );
  const col = await card.evaluate((el) => {
    const t = el.querySelector("[role=status]");
    return t ? getComputedStyle(t).color : null;
  });
  check(
    "status text is light on the dark card",
    !col || /rgba?\(255, 255, 255/.test(col),
    String(col),
  );
  await page.keyboard.press("Escape");
  check(
    "Escape closes the card first and stays in full view",
    !(await card.isVisible()) && (await mode()) === "true",
  );

  // ---- the events list, by keyboard only ----
  await infoBtn.focus();
  await page.keyboard.press("Enter");
  const list = byId("globe-event-list");
  check("the events list is in the legend card", await list.isVisible());
  const summaryText = await list.locator("summary").innerText();
  check(
    "it is collapsed at first and says how many events there are",
    (await list.getAttribute("open")) === null && /\d/.test(summaryText),
    summaryText,
  );
  await list.locator("summary").focus();
  await page.keyboard.press("Enter");
  check("Enter on the summary opens it", (await list.getAttribute("open")) !== null);
  const floodBtns = list.locator('[data-testid="globe-list-flood"]');
  const fireBtns = list.locator('[data-testid="globe-list-fire"]');
  const nFlood = await floodBtns.count();
  const nFire = await fireBtns.count();
  check(
    `flood events (${nFlood}) and heat detections (${nFire}) are both listed`,
    nFlood >= 1 && nFire >= 1,
  );
  const floodLabels = await floodBtns.allInnerTexts();
  check(
    "flood buttons name a place and an alert level",
    floodLabels.every((l) => /·/.test(l) && l.trim().length > 8),
    JSON.stringify(floodLabels),
  );
  const firstFire = (await fireBtns.first().innerText()).trim();
  check("a heat button names the position and the detections", /\d/.test(firstFire), firstFire);
  const cardBox = await card.boundingBox();
  check(
    "the card still fits the window with the list open",
    cardBox.y + cardBox.height <= vp.height + 1 &&
      cardBox.x >= 0 &&
      cardBox.x + cardBox.width <= vp.width + 1,
    `${Math.round(cardBox.x)},${Math.round(cardBox.y)} ${Math.round(cardBox.width)}x${Math.round(cardBox.height)}`,
  );

  // Open a flood with the keyboard.
  const panel = byId("globe-panel");
  await floodBtns.first().focus();
  await page.keyboard.press("Enter");
  await panel.waitFor({ timeout: 10000 });
  const panelText = (await panel.innerText()).slice(0, 200);
  check(
    "Enter on a flood button opens the flood details panel",
    /flood/i.test(panelText) || arabic,
    panelText.replace(/\n/g, " | "),
  );
  check(
    "keyboard focus moved into the panel",
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest('[data-testid="globe-panel"]')),
    ),
  );
  check("the legend card stepped aside", !(await card.isVisible().catch(() => false)));
  await page.screenshot({ path: `${SHOTS}/globe-${variant.name}-2-panel.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  check(
    "Escape closes the panel and stays in full view",
    !(await panel.isVisible().catch(() => false)) && (await mode()) === "true",
  );
  check(
    "focus is back on the Legend and status button, not lost",
    (await focusedId()) === "globe-full-info",
    String(await focusedId()),
  );

  // A heat detection from the list, closed with the panel's own Close button.
  await page.keyboard.press("Enter"); // reopens the card from the focused button
  await list.waitFor();
  if ((await list.getAttribute("open")) === null) await list.locator("summary").click();
  await fireBtns.first().click();
  await panel.waitFor({ timeout: 10000 });
  const heatText = (await panel.innerText()).slice(0, 120);
  check(
    "a heat detection opens its panel too",
    /heat|calor|chaleur|حرار/i.test(heatText),
    heatText.replace(/\n/g, " | "),
  );
  await panel
    .getByRole("button", { name: /^(Close|Cerrar|Fermer|Fechar|إغلاق)$/ })
    .first()
    .click();
  await page.waitForTimeout(600);
  check(
    "closing with the Close button also returns focus",
    (await focusedId()) === "globe-full-info",
    String(await focusedId()),
  );

  // ---- Escape with nothing open brings the menus back ----
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  check("Escape with nothing open brings the menus back", (await mode()) === "false");
  check("header is back", await shown("header"));
  check("page title is back", (await page.locator("h1").count()) === 1);
  const c2 = await settledCanvas((c) => c.cssH < vp.height - 40 && bufOk(c));
  check(
    `the globe shrank to fit the normal page (${c2.cssW}x${c2.cssH})`,
    c2.cssH < vp.height - 40,
  );
  check("the 3D canvas buffer followed", bufOk(c2), `buffer ${c2.bufW}x${c2.bufH}`);
  await page.screenshot({ path: `${SHOTS}/globe-${variant.name}-3-normal.png` });
  await page.waitForTimeout(2500);
  check("it does not push the person back into full view by itself", (await mode()) === "false");

  // ---- the same list on the normal page ----
  const pageList = byId("globe-event-list");
  check(
    "with the menus back, the list is on the page under the status lines",
    await pageList.isVisible(),
  );
  if ((await pageList.getAttribute("open")) === null) await pageList.locator("summary").click();
  await pageList.locator('[data-testid="globe-list-flood"]').first().click();
  await panel.waitFor({ timeout: 10000 });
  check("it opens the panel there too", await panel.isVisible());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  check(
    "and focus returns to the list button that was used",
    (await focusedId()) === "globe-list-flood",
    String(await focusedId()),
  );

  // ---- the Full view button goes back in ----
  await toggle.click();
  await page.waitForTimeout(800);
  check("the Full view button re-enters full view", (await mode()) === "true");
  const c3 = await settledCanvas((c) => fillsWindow(c) && bufOk(c));
  check(
    "and the globe fills the window again",
    fillsWindow(c3) && bufOk(c3),
    `${c3.cssW}x${c3.cssH}`,
  );

  // ---- the browser's own full screen (needs a real tap) ----
  const before = await page.evaluate(() => document.fullscreenElement !== null);
  await browserBtn.click();
  await page.waitForTimeout(1200);
  const fs = await page.evaluate(() => ({
    on: document.fullscreenElement !== null,
    id: document.fullscreenElement?.getAttribute("data-testid") ?? null,
  }));
  check(
    "Full screen puts the globe in the browser's full screen",
    !before && fs.on && fs.id === "globe-root",
    JSON.stringify(fs),
  );
  check(
    "the button now offers to leave it",
    (await browserBtn.getAttribute("aria-pressed")) === "true",
  );
  await browserBtn.click();
  await page.waitForTimeout(1000);
  check(
    "and leaves it again",
    !(await page.evaluate(() => document.fullscreenElement !== null)) &&
      (await browserBtn.getAttribute("aria-pressed")) === "false",
  );

  // ---- focus order: nothing hidden behind the globe can be reached ----
  const focusables = await page.evaluate(() =>
    [...document.querySelectorAll("a[href],button,input,select,textarea,[tabindex]")]
      .filter((e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden")
      .map((e) => ({
        id: e.getAttribute("data-testid") || e.tagName,
        inChrome: Boolean(e.closest("[data-app-shell-chrome]")),
      })),
  );
  check(
    "nothing from the hidden menus can take focus in full view",
    focusables.every((f) => !f.inChrome),
    JSON.stringify(focusables.filter((f) => f.inChrome)),
  );
  check(
    "the globe's own controls can",
    focusables.some((f) => f.id === "globe-full-toggle"),
  );

  const cspErrors = errors.filter((e) => /Content Security Policy|Refused to/i.test(e));
  check("no CSP violations", cspErrors.length === 0, cspErrors.join(" | "));
  check("no page errors", !errors.some((e) => e.startsWith("pageerror")), errors.join(" | "));
  await ctx.close();
}

(async () => {
  const { ok, finish } = checker("globe");
  const only = process.env.GLOBE_VARIANT;
  const browser = await launch({ webgl: true });
  for (const variant of VARIANTS) {
    if (only && variant.name !== only) continue;
    await runVariant(browser, variant, ok);
  }
  await browser.close();
  process.exit(finish());
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
