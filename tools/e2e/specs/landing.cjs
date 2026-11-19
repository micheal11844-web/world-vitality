// The landing page: every language, the language picker, the native-app prompt, and the spacing
// of the small links under the two buttons (a gap, one row each, one shared start edge).
"use strict";
const { launch, BASE, SHOTS } = require("../harness/browser.cjs");
const { checker } = require("../harness/check.cjs");

const EXPECT = {
  en: {
    tag: "Real-time environmental intelligence, interpreted plainly.",
    explore: "Explore the planet",
    signIn: "Sign in",
    dir: "ltr",
    apps: "Prefer an app?",
  },
  es: {
    tag: "Inteligencia ambiental en tiempo real, explicada con claridad.",
    explore: "Explorar el planeta",
    signIn: "Iniciar sesión",
    dir: "ltr",
    apps: "¿Prefieres una app?",
  },
  fr: {
    tag: "L’intelligence environnementale en temps réel, expliquée simplement.",
    explore: "Explorer la planète",
    signIn: "Se connecter",
    dir: "ltr",
    apps: "Vous préférez une application ?",
  },
  pt: {
    tag: "Inteligência ambiental em tempo real, explicada com clareza.",
    explore: "Explorar o planeta",
    signIn: "Entrar",
    dir: "ltr",
    apps: "Prefere um app?",
  },
  ar: {
    tag: "رؤى بيئية فورية، مشروحة بوضوح.",
    explore: "استكشف الكوكب",
    signIn: "تسجيل الدخول",
    dir: "rtl",
    apps: "تفضّل تطبيقًا؟",
  },
};

(async () => {
  const { ok, finish } = checker("landing");
  const browser = await launch();

  // 1) Each language, chosen with the device cookie.
  for (const [code, e] of Object.entries(EXPECT)) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 640 } });
    await ctx.addCookies([{ name: "wv_lang", value: code, url: BASE }]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const body = await page.locator("main").innerText();
    ok(`${code}: tagline`, body.includes(e.tag), body);
    ok(
      `${code}: explore button`,
      (await page.getByRole("link", { name: e.explore }).count()) === 1,
    );
    ok(`${code}: sign-in button`, (await page.getByRole("link", { name: e.signIn }).count()) === 1);
    const dir = await page
      .locator("main")
      .evaluate((el) => el.closest("[dir]").getAttribute("dir"));
    const lang = await page
      .locator("main")
      .evaluate((el) => el.closest("[lang]").getAttribute("lang"));
    ok(`${code}: dir=${e.dir} lang=${code}`, dir === e.dir && lang === code, `${dir}/${lang}`);
    ok(
      `${code}: apps prompt after load`,
      (await page.locator("main").innerText()).includes(e.apps),
    );
    const sel = page.locator("main select");
    ok(`${code}: picker shows this language`, (await sel.inputValue()) === code);
    // The picker sits at the inline-end corner: right in LTR, left in RTL.
    const box = await sel.boundingBox();
    ok(
      `${code}: picker in the ${e.dir === "rtl" ? "left" : "right"} corner`,
      e.dir === "rtl" ? box.x < 500 : box.x > 500,
      JSON.stringify(box),
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    ok(`${code}: no horizontal overflow`, overflow <= 0, String(overflow));
    await ctx.close();
  }

  // 2) No cookie: the browser's Accept-Language decides; the picker then saves a choice.
  {
    const ctx = await browser.newContext({
      locale: "fr-FR",
      extraHTTPHeaders: { "Accept-Language": "fr-FR,fr;q=0.9" },
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    ok(
      "accept-language fr picks French",
      (await page.locator("main").innerText()).includes("Explorer la planète"),
    );
    await page.locator("main select").selectOption("es");
    await page.waitForFunction(
      () => document.body.innerText.includes("Explorar el planeta"),
      null,
      { timeout: 15000 },
    );
    ok("picker switches to Spanish without signing in", true);
    const cookie = (await ctx.cookies()).find((c) => c.name === "wv_lang");
    ok(
      "choice saved in the wv_lang cookie",
      Boolean(cookie) && cookie.value === "es",
      JSON.stringify(cookie),
    );
    await page.reload({ waitUntil: "networkidle" });
    ok(
      "choice survives a reload (cookie beats Accept-Language)",
      (await page.locator("main").innerText()).includes("Explorar el planeta"),
    );
    await page.getByRole("link", { name: "Iniciar sesión" }).click();
    await page.waitForURL("**/login");
    ok("sign-in link goes to /login", true);
    await ctx.close();
  }

  // 3) Inside the native shell the downloads prompt stays hidden.
  {
    const ctx = await browser.newContext({
      userAgent: "Mozilla/5.0 WorldVitalityDesktop/0.1.0 Electron/30",
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    ok(
      "downloads prompt hidden in a native shell UA",
      !(await page.locator("main").innerText()).includes("Prefer an app?"),
    );
    await ctx.close();
  }

  // 4) The small links under the buttons: a gap, one row each, one shared start edge.
  for (const [name, lang, w, h, scale] of [
    ["desktop-en", "en", 1366, 590, 1],
    ["phone-en", "en", 360, 740, 2],
    ["phone-ar", "ar", 360, 740, 2],
    ["desktop-ar", "ar", 1366, 590, 1],
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: scale,
    });
    await ctx.addCookies([{ name: "wv_lang", value: lang, url: BASE }]);
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForSelector('main a[target="_blank"]'); // the downloads link appears after load
    const m = await page.evaluate(() => {
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      };
      const main = document.querySelector("main");
      const rtl = getComputedStyle(main).direction === "rtl";
      const sources = main.querySelector('a[href="/sources"]');
      const rows = [...sources.parentElement.children].map(rect); // downloads prompt, Sources, Terms and Privacy
      const buttons = [
        main.querySelector('a[href="/explore"]'),
        main.querySelector('a[href="/login"]'),
      ].map(rect);
      return {
        rtl,
        rows,
        buttonsBottom: Math.max(...buttons.map((b) => b.bottom)),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    const edge = (r) => (m.rtl ? r.right : r.left);
    ok(`${name}: the three small-print rows are there`, m.rows.length === 3, String(m.rows.length));
    const gap = m.rows[0].top - m.buttonsBottom;
    ok(`${name}: a gap of at least 24px under the buttons`, gap >= 24, `${Math.round(gap)}px`);
    let stacked = true;
    for (let i = 1; i < m.rows.length; i++)
      if (m.rows[i].top < m.rows[i - 1].bottom) stacked = false;
    ok(
      `${name}: one row per line, none sharing a line`,
      stacked,
      JSON.stringify(m.rows.map((r) => [Math.round(r.top), Math.round(r.bottom)])),
    );
    const edges = m.rows.map(edge);
    ok(
      `${name}: all rows start on one shared edge`,
      Math.max(...edges) - Math.min(...edges) <= 1,
      JSON.stringify(edges.map(Math.round)),
    );
    ok(`${name}: no horizontal overflow`, m.overflow <= 0, String(m.overflow));
    await page.screenshot({ path: `${SHOTS}/landing-${name}.png` });
    await ctx.close();
  }

  await browser.close();
  process.exit(finish());
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
