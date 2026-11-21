// The everyday-polish checks: tab titles, the 404 and error pages, Help on a phone, touch-target
// sizes, the Explore examples and closed AI rail, the Disaster Monitoring Globe card, and the
// landmarks that make pages navigable. Everything here is something a person notices on a phone.
"use strict";
const { chromium, devices } = require("playwright");
const { BASE, SHOTS, launch, signedIn } = require("../harness/browser.cjs");
const { checker } = require("../harness/check.cjs");

const PHONE = devices["Pixel 7"];

(async () => {
  const { ok, finish } = checker("ux");
  const browser = await chromium.launch();
  const lang = (code) => ({ name: "wv_lang", value: code, url: BASE });

  // 1) Every page names itself in the tab, in the reader's language, ending with the site name.
  // (Billing is left out: the test site runs with billing off, where it is the 404 page checked below.)
  for (const [code, routes] of [
    [
      "en",
      [
        ["/login", "Sign in — World Vitality"],
        ["/forgot-password", "Reset your password — World Vitality"],
        ["/explore", "Explore Your Planet — World Vitality"],
        ["/globe", "The Globe — World Vitality"],
        ["/workspaces", "Workspaces — World Vitality"],
        ["/workspaces/weather/map", "Map · Weather & Climate — World Vitality"],
        ["/settings", "Settings — World Vitality"],
      ],
    ],
    [
      "es",
      [
        ["/login", "Iniciar sesión — World Vitality"],
        ["/workspaces/weather", "Tiempo y clima — World Vitality"],
        ["/globe", "El globo — World Vitality"],
      ],
    ],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    await ctx.addCookies([...signedIn(), lang(code)]);
    const page = await ctx.newPage();
    for (const [route, title] of routes) {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
      const actual = await page.title();
      ok(`title ${code} ${route}`, actual === title, `${actual} (wanted ${title})`);
    }
    await ctx.close();
  }

  // 2) "Page not found": a way onward, in each language, right-to-left for Arabic.
  const NOT_FOUND = {
    en: ["We can’t find that page", "Go to the home page", "Explore the planet", "ltr"],
    es: ["No encontramos esa página", "Ir a la página de inicio", "Explorar el planeta", "ltr"],
    fr: ["Cette page est introuvable", "Aller à la page d’accueil", "Explorer la planète", "ltr"],
    pt: ["Não encontramos essa página", "Ir para a página inicial", "Explorar o planeta", "ltr"],
    ar: ["لم نعثر على هذه الصفحة", "الذهاب إلى الصفحة الرئيسية", "استكشف الكوكب", "rtl"],
  };
  for (const [code, [heading, home, explore, dir]] of Object.entries(NOT_FOUND)) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 700 } });
    await ctx.addCookies([lang(code)]);
    const page = await ctx.newPage();
    const response = await page.goto(BASE + "/no-such-page", { waitUntil: "networkidle" });
    ok(`404 ${code}: status 404`, response.status() === 404, String(response.status()));
    ok(
      `404 ${code}: heading in the language`,
      (await page.locator("h1").innerText()) === heading,
      await page.locator("h1").innerText(),
    );
    const links = await page
      .locator("main a")
      .evaluateAll((as) => as.map((a) => [a.textContent.trim(), a.getAttribute("href")]));
    ok(
      `404 ${code}: home and Explore`,
      JSON.stringify(links) ===
        JSON.stringify([
          [home, "/"],
          [explore, "/explore"],
        ]),
      JSON.stringify(links),
    );
    const d = await page.evaluate(() =>
      document.querySelector("main").closest("[dir]").getAttribute("dir"),
    );
    ok(`404 ${code}: dir=${dir}`, d === dir, d);
    ok(
      `404 ${code}: tab title`,
      (await page.title()) === `${heading} — World Vitality`,
      await page.title(),
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    ok(`404 ${code}: no horizontal overflow`, overflow <= 0, String(overflow));
    if (code === "en" || code === "ar")
      await page.screenshot({ path: `${SHOTS}/ux-404-${code}.png` });
    await ctx.close();
  }
  {
    // Signed in, "home" is the dashboard.
    const ctx = await browser.newContext();
    await ctx.addCookies(signedIn());
    const page = await ctx.newPage();
    await page.goto(BASE + "/no-such-page", { waitUntil: "networkidle" });
    ok(
      "404 signed in: home goes to the dashboard",
      (await page.locator("main a").first().getAttribute("href")) === "/dashboard",
    );
    await ctx.close();
  }

  // 3) The error page (a page that fails while loading): plain words, focus on the heading, two
  // ways out, a reference to quote. The stand-in Supabase answers the Agriculture page with
  // several rows where it expects one, which makes that page throw.
  {
    const ctx = await browser.newContext({ ...PHONE });
    await ctx.addCookies([...signedIn(), lang("fr")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/workspaces/agriculture", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const heading = await page.locator("h1").first().innerText();
    ok(
      "error page: heading in French",
      heading === "Un problème est survenu de notre côté",
      heading,
    );
    const buttons = await page.locator("main button, main a").allInnerTexts();
    ok(
      "error page: Try again and Home",
      buttons[0] === "Réessayer" && buttons[1] === "Aller à la page d’accueil",
      JSON.stringify(buttons),
    );
    ok(
      "error page: focus is on the heading",
      await page.evaluate(() => document.activeElement?.tagName === "H1"),
    );
    ok(
      "error page: a reference to quote",
      /Référence : \S+/.test(await page.locator("main").innerText()),
    );
    await ctx.close();
  }

  // 4) Help on a phone: a button in the header, the floating character gone, the chat opens
  // from it and focus comes back to it.
  {
    const ctx = await browser.newContext({ ...PHONE });
    await ctx.addCookies([...signedIn(), lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/workspaces/weather", { waitUntil: "networkidle" });
    const help = page.locator("header .wv-shell-help-btn");
    ok(
      "phone: Help button is in the header",
      (await help.count()) === 1 && (await help.isVisible()),
    );
    const box = await help.boundingBox();
    ok(
      "phone: Help button is at least 44px",
      box.width >= 44 && box.height >= 44,
      JSON.stringify(box),
    );
    ok(
      "phone: the floating character is gone",
      !(await page.locator(".wv-shell-guide").isVisible()),
    );
    ok(
      "phone: exactly one Help button is reachable",
      (await page.getByRole("button", { name: "Open the help chat" }).count()) === 1,
    );
    await help.click();
    await page.getByRole("dialog").waitFor({ timeout: 10000 });
    ok("phone: the Help button opens the chat", true);
    ok("phone: Help button reports it open", (await help.getAttribute("aria-expanded")) === "true");
    await page.screenshot({ path: `${SHOTS}/ux-phone-help-open.png` });
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached", timeout: 10000 });
    ok(
      "phone: Escape closes it and focus returns to the header button",
      await page.evaluate(() => document.activeElement?.classList.contains("wv-shell-help-btn")),
    );
    await ctx.close();
  }
  {
    // A wide screen keeps Orbi in the corner and no header button.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addCookies([...signedIn(), lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/workspaces/weather", { waitUntil: "networkidle" });
    ok(
      "desktop: no Help button in the header",
      !(await page.locator("header .wv-shell-help-btn").isVisible()),
    );
    ok(
      "desktop: Orbi is the Help button in the corner",
      await page
        .locator(".wv-shell-guide")
        .getByRole("button", { name: "Open the help chat" })
        .isVisible(),
    );
    await ctx.close();
  }

  // 5) Small links are 44px tall for a thumb, on the pages where people meet them.
  {
    const ctx = await browser.newContext({ ...PHONE });
    await ctx.addCookies([lang("en")]);
    const page = await ctx.newPage();
    const tall = async (loc, name) => {
      const box = await loc.first().boundingBox();
      ok(
        `touch: ${name} is at least 44px tall`,
        Boolean(box) && box.height >= 43.5,
        JSON.stringify(box),
      );
    };
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForSelector('main a[target="_blank"]');
    await tall(page.locator('main a[href="/sources"]'), "landing Sources link");
    await tall(page.locator('main a[href="/terms"]'), "landing Terms link");
    await tall(page.locator('main a[href="/privacy"]'), "landing Privacy link");
    await tall(page.locator('main a[target="_blank"]'), "landing downloads link");
    await tall(page.locator("main select"), "landing language picker");
    await page.goto(BASE + "/login", { waitUntil: "networkidle" });
    await tall(page.getByRole("button", { name: "Create an account" }), "login Create an account");
    await tall(
      page.locator("label", { has: page.locator('input[type="checkbox"]') }),
      "login Remember me row",
    );
    await ctx.close();
  }

  // 5b) A page that scrolls but has nothing to focus is one Tab stop, so the arrow keys and Page
  // Down work for a keyboard user; a page with a link in it gets no extra stop.
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 } });
    await ctx.addCookies([...signedIn(), lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/workspaces/weather", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const scrolls = await page.evaluate(() => {
      const m = document.querySelector("main");
      return m.scrollHeight > m.clientHeight;
    });
    ok("keyboard scroll: the Weather page scrolls in a short window", scrolls);
    ok(
      "keyboard scroll: a page with a link in it adds no extra Tab stop",
      (await page.locator("main").getAttribute("tabindex")) === null,
    );
    // Take every link, button and field out of the page (as an all-text page would be).
    await page.evaluate(() => {
      const m = document.querySelector("main");
      m.querySelectorAll("a, button, input, select, textarea, summary, [tabindex]").forEach((e) =>
        e.remove(),
      );
    });
    await page.waitForFunction(
      () => document.querySelector("main").getAttribute("tabindex") === "0",
      null,
      { timeout: 5000 },
    );
    ok("keyboard scroll: with nothing to focus, the page area becomes one Tab stop", true);
    let reached = false;
    for (let i = 0; i < 150 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(
        () => document.activeElement === document.querySelector("main"),
      );
    }
    ok("keyboard scroll: Tab reaches it", reached);
    await page.keyboard.press("PageDown");
    await page.waitForTimeout(400);
    ok(
      "keyboard scroll: Page Down scrolls it",
      (await page.evaluate(() => document.querySelector("main").scrollTop)) > 0,
    );
    await page.screenshot({ path: `${SHOTS}/ux-main-focus.png` });
    await ctx.close();
  }

  // 5c) Small round marks and the map's buttons, on a touch screen: the header's brand link is
  // 44px tall; the map's zoom buttons are 44px; a tap just outside a map marker, the map's credits
  // button or a pin on the Globe's flat map still lands on it.
  {
    const ctx = await browser.newContext({ ...PHONE });
    await ctx.addCookies([...signedIn(), lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/workspaces/weather", { waitUntil: "networkidle" });
    const brand = await page.locator('header a[href="/dashboard"]').first().boundingBox();
    ok(
      "touch: the header's World Vitality link is 44px tall",
      brand.height >= 43.5,
      JSON.stringify(brand),
    );

    await page.goto(BASE + "/workspaces/disaster-monitoring/map", { waitUntil: "networkidle" });
    await page.waitForSelector(".maplibregl-marker", { timeout: 20000 });
    const zoomIn = await page.locator(".maplibregl-ctrl-zoom-in").boundingBox();
    ok(
      "touch: the map's zoom button is 44 x 44",
      zoomIn.width >= 43.5 && zoomIn.height >= 43.5,
      JSON.stringify(zoomIn),
    );
    const zoomOut = await page.locator(".maplibregl-ctrl-zoom-out").boundingBox();
    ok(
      "touch: the map's zoom-out button is 44 x 44",
      zoomOut.width >= 43.5 && zoomOut.height >= 43.5,
      JSON.stringify(zoomOut),
    );
    const hits = await page.evaluate(() => {
      const attrib = document
        .querySelector(".maplibregl-ctrl-attrib-button")
        .getBoundingClientRect();
      const marker = document.querySelector(".maplibregl-marker").getBoundingClientRect();
      const at = (x, y, cls) =>
        document.elementsFromPoint(x, y).some((e) => e.classList.contains(cls));
      return {
        // 8px above the 24px credits button, and 20px to the side of the marker's centre.
        attrib: at(attrib.x + attrib.width / 2, attrib.y - 8, "maplibregl-ctrl-attrib-button"),
        marker: at(
          marker.x + marker.width / 2 + 20,
          marker.y + marker.height / 2,
          "maplibregl-marker",
        ),
        farMarker: at(
          marker.x + marker.width / 2 + 40,
          marker.y + marker.height / 2,
          "maplibregl-marker",
        ),
      };
    });
    ok("touch: a tap just above the map's credits button reaches it", hits.attrib);
    ok("touch: a tap beside a map marker reaches it", hits.marker);
    ok("touch: a tap well away from a marker does not", !hits.farMarker);

    // The OpenStreetMap credit stays visible: a marker's panel, once open, sits above it.
    const creditsUncovered = () =>
      page.evaluate(() => {
        const b = document.querySelector(".maplibregl-ctrl-attrib-button").getBoundingClientRect();
        const top = document.elementsFromPoint(b.x + b.width / 2, b.y + b.height / 2)[0];
        return Boolean(top.closest(".maplibregl-ctrl-attrib"));
      });
    ok("map: the credits are not covered before a marker is chosen", await creditsUncovered());
    await page.locator(".maplibregl-marker").first().click();
    await page.waitForFunction(
      () => [...document.querySelectorAll("div")].some((d) => d.style.bottom === "2.25rem"),
      null,
      { timeout: 10000 },
    );
    ok(
      "map: with a marker's panel open the credits are still not covered",
      await creditsUncovered(),
    );

    // The "Sample reference sites" label does not sit under the credits on a phone.
    await page.goto(BASE + "/workspaces/research/map", { waitUntil: "networkidle" });
    await page.waitForSelector(".maplibregl-ctrl-attrib", { timeout: 20000 });
    const overlap = await page.evaluate(() => {
      const chip = [...document.querySelectorAll("span")].find((e) =>
        e.textContent.trim().startsWith("Sample reference sites"),
      );
      const a = document.querySelector(".maplibregl-ctrl-attrib").getBoundingClientRect();
      const c = chip.getBoundingClientRect();
      return c.right > a.left && c.left < a.right && c.bottom > a.top && c.top < a.bottom;
    });
    ok("map: the coverage label does not overlap the credits", !overlap);

    await ctx.close();
  }

  {
    // The Globe's flat map: pins are 7-20px dots. It stays on screen when the 3D globe cannot run
    // (no WebGL), which is also the only way to keep it still long enough to tap: otherwise the
    // 3D globe replaces it within a second or two.
    const noWebgl = await chromium.launch({
      args: [
        "--disable-gpu",
        "--disable-webgl",
        "--disable-3d-apis",
        "--disable-software-rasterizer",
      ],
    });
    const ctx = await noWebgl.newContext({ ...PHONE });
    await ctx.addCookies([...signedIn(), lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/globe", { waitUntil: "networkidle" });
    await page.waitForSelector("button.wv-hit-44", { timeout: 20000 });
    const target = await page.evaluate(() => {
      const pins = [...document.querySelectorAll("button.wv-hit-44")].map((b) => {
        const r = b.getBoundingClientRect();
        return { label: b.getAttribute("aria-label"), x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      // One with no other pin within 60px, so the tap can only mean this one.
      return pins.find((p) => pins.every((q) => q === p || Math.hypot(p.x - q.x, p.y - q.y) > 60));
    });
    ok("touch: the Globe's flat map has a pin to tap", Boolean(target));
    if (target) {
      const pressed = (label) =>
        page.evaluate(
          (l) =>
            [...document.querySelectorAll("button.wv-hit-44")]
              .find((b) => b.getAttribute("aria-label") === l)
              ?.getAttribute("aria-pressed"),
          label,
        );
      await page.touchscreen.tap(target.x + 40, target.y);
      await page.waitForTimeout(300);
      ok(
        "touch: a tap 40px from a Globe pin does not open it",
        (await pressed(target.label)) === "false",
      );
      await page.touchscreen.tap(target.x + 16, target.y);
      await page.waitForTimeout(300);
      ok("touch: a tap 16px from a Globe pin opens it", (await pressed(target.label)) === "true");
    }
    await ctx.close();
    await noWebgl.close();
  }

  // 5d) The 3D globe on a touch screen: a tap a fingertip's width from a heat-detection dot still
  // picks it, and a tap well away does not. The events list flies the camera straight down onto a
  // dot, which puts it in the middle of the canvas; that is where the taps go.
  {
    const gl = await launch({ webgl: true });
    const ctx = await gl.newContext({ ...PHONE, locale: "en-US" });
    await ctx.addCookies([...signedIn(), lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/globe", { waitUntil: "networkidle" });
    await page.waitForSelector(".cesium-widget canvas", { timeout: 60000 });
    await page.locator('[data-testid="globe-full-info"]').click();
    const list = page.locator('[data-testid="globe-event-list"]');
    await list.waitFor();
    if ((await list.getAttribute("open")) === null) await list.locator("summary").click();
    const panel = page.locator('[data-testid="globe-panel"]');
    const close = () =>
      panel
        .getByRole("button", { name: /^Close$/ })
        .first()
        .click();
    await list.locator('[data-testid="globe-list-fire"]').first().click();
    await panel.waitFor({ timeout: 10000 });
    await close();
    const box = await page.locator(".cesium-widget canvas").boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    // The camera is still flying for a few seconds: tap beside the centre until the dot is there.
    let picked = false;
    for (let i = 0; i < 25 && !picked; i++) {
      await page.waitForTimeout(1000);
      await page.touchscreen.tap(cx + 18, cy);
      await page.waitForTimeout(400);
      picked = await panel.isVisible().catch(() => false);
    }
    ok("touch: a tap 18px from a 3D heat-detection dot picks it", picked);
    if (picked) {
      await close();
      await page.waitForTimeout(500);
      await page.touchscreen.tap(cx + 70, cy);
      await page.waitForTimeout(800);
      ok("touch: a tap 70px from the dot does not", !(await panel.isVisible().catch(() => false)));
    }
    await ctx.close();
    await gl.close();
  }

  // 6) The sign-in page has one main landmark, and the logo is decoration (no doubled name).
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addCookies([lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/login", { waitUntil: "networkidle" });
    ok("login: exactly one main landmark", (await page.locator("main").count()) === 1);
    ok("login: the form is inside it", (await page.locator("main form").count()) === 1);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    ok(
      "landing: the logo is decoration (empty alt)",
      (await page.locator("main img").first().getAttribute("alt")) === "",
    );
    await ctx.close();
  }

  // 7) Explore: examples to try, and the AI rail waits for something to say.
  {
    const ctx = await browser.newContext({ ...PHONE });
    await ctx.addCookies([lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/explore", { waitUntil: "networkidle" });
    const group = page.getByRole("group", { name: "Or try one of these:" });
    const names = await group.getByRole("button").allInnerTexts();
    ok(
      "explore: five example places",
      JSON.stringify(names) === JSON.stringify(["Lagos", "Abuja", "Accra", "Nairobi", "London"]),
      JSON.stringify(names),
    );
    const fonts = await page.evaluate(() => {
      const chip = document.querySelector('[role="group"] button');
      const label = [...document.querySelectorAll("span, p")].find((e) =>
        e.textContent.trim().startsWith("Or try one of these"),
      );
      return [getComputedStyle(chip).fontFamily, getComputedStyle(label).fontFamily];
    });
    ok(
      "explore: chips use the same font as the text around them (not the browser's serif)",
      fonts[0] === fonts[1],
      JSON.stringify(fonts),
    );
    const chipBox = await group.getByRole("button").first().boundingBox();
    ok("explore: chips are 44px tall", chipBox.height >= 43.5, JSON.stringify(chipBox));
    const aiTab = page.getByRole("button", { name: "AI", exact: true });
    ok(
      "explore: the AI rail starts closed",
      (await aiTab.getAttribute("aria-pressed")) === "false",
    );
    await group.getByRole("button", { name: "Lagos" }).click();
    await page.waitForFunction(
      () =>
        document
          .querySelector('[aria-label="AI"], button')
          ?.ownerDocument.body.innerText.includes("Ibadan"),
      null,
      { timeout: 20000 },
    );
    ok(
      "explore: an example runs the search",
      (await page.getByLabel("Place name").inputValue()) === "Lagos",
    );
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("button")].some(
          (b) => b.textContent.trim() === "AI" && b.getAttribute("aria-pressed") === "true",
        ),
      null,
      { timeout: 20000 },
    );
    ok("explore: the AI rail opens when the first result arrives", true);
    await page.screenshot({ path: `${SHOTS}/ux-explore-phone.png` });
    await ctx.close();
  }

  // 8) Disaster Monitoring says what to do outside the U.S.: the Globe.
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addCookies([...signedIn(), lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/workspaces/disaster-monitoring", { waitUntil: "networkidle" });
    ok(
      "disaster monitoring: an 'Outside the U.S.?' card",
      (await page.getByRole("heading", { name: "Outside the U.S.?" }).count()) === 1,
    );
    const link = page.getByRole("link", { name: "Open the Globe" });
    ok(
      "disaster monitoring: it links to the Globe",
      (await link.getAttribute("href")) === "/globe",
    );
    await ctx.close();
  }
  {
    // …and in Arabic it reads right-to-left like the rest of the page.
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    await ctx.addCookies([...signedIn(), lang("ar")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/workspaces/disaster-monitoring", { waitUntil: "networkidle" });
    ok(
      "disaster monitoring (ar): the Globe link is there",
      (await page.locator('main a[href="/globe"]').count()) >= 1,
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    ok("disaster monitoring (ar): no horizontal overflow", overflow <= 0, String(overflow));
    await ctx.close();
  }

  // 9) The first screen after sign-up does not draw a focus box round its heading.
  {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    await ctx.addCookies([...signedIn(), lang("en")]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/welcome", { waitUntil: "networkidle" });
    const active = await page.evaluate(() => document.activeElement?.tagName);
    ok("welcome: nothing is focused on arrival", active === "BODY", active);
    await ctx.close();
  }

  await browser.close();
  process.exit(finish());
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
