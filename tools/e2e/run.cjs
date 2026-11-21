#!/usr/bin/env node
// Browser checks for the web app: starts a stand-in for Supabase and the production build of the
// site with every outside service answered from canned data (harness/), runs the specs in a real
// Chromium, and stops everything again. Nothing here touches the network, a real database or a key.
//
//   node run.cjs                     run everything
//   node run.cjs landing globe       run only these specs (landing, ux, globe, help-chat)
//
// Needs: the site built (`cd apps/web && npx next build`) and Playwright's Chromium installed
// (`npm ci && npx playwright install chromium` in this folder). See README.md.
"use strict";
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const WEB = path.join(ROOT, "apps", "web");
const OUT = process.env.E2E_SHOTS || path.join(__dirname, ".out");
const PORT = Number(process.env.E2E_PORT || 3100);
const BASE_URL = `http://localhost:${PORT}`;
const SPEC_TIMEOUT_MS = 12 * 60 * 1000;

/** The outside assistant switched on, pointing at the fake Flow that harness/mock-fetch.cjs answers. */
const FLOW_ON = {
  FLOW_SUPPORT_ENABLED: "true",
  FLOW_SUPPORT_URL: "https://flow.test/api/chat",
  FLOW_SUPPORT_KEY: "testkey",
};

/** In order. Runs with the same `env` share one site process. */
const RUNS = [
  { name: "landing", spec: "landing", env: {} },
  { name: "ux", spec: "ux", env: {} },
  { name: "globe", spec: "globe", env: {} },
  { name: "help-chat off", spec: "help-chat", scenario: "off", env: {} },
  { name: "help-chat on", spec: "help-chat", scenario: "on", env: FLOW_ON },
  ...["fail", "slow", "price", "leak", "boss", "json"].map((scenario) => ({
    name: `help-chat ${scenario}`,
    spec: "help-chat",
    scenario,
    env: { ...FLOW_ON, MOCK_FLOW: scenario },
  })),
];

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(2);
}

function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () =>
        Date.now() > deadline
          ? reject(new Error(`${url} did not answer in time`))
          : setTimeout(attempt, 500),
      );
      req.setTimeout(3000, () => req.destroy());
    };
    attempt();
  });
}

/** Starts a long-running child in its own process group, output to a file. */
function startProcess(label, args, { cwd, env, logFile }) {
  const fd = fs.openSync(logFile, "w");
  const child = spawn(process.execPath, args, {
    cwd,
    env,
    stdio: ["ignore", fd, fd],
    detached: true,
  });
  child.exitedEarly = false;
  child.on("exit", () => {
    child.exitedEarly = true;
  });
  child.label = label;
  child.logFile = logFile;
  return child;
}

function stopProcess(child) {
  return new Promise((resolve) => {
    if (child.exitedEarly) return resolve();
    child.on("exit", () => resolve());
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      return resolve();
    }
    setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        /* already gone */
      }
      resolve();
    }, 5000);
  });
}

function runSpec(run, serverLog) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, "specs", `${run.spec}.cjs`)], {
      cwd: __dirname,
      stdio: "inherit",
      env: {
        ...process.env,
        BASE_URL,
        E2E_SHOTS: OUT,
        SERVER_LOG: serverLog,
        SCENARIO: run.scenario || "",
      },
    });
    const timer = setTimeout(() => {
      console.error(`TIMEOUT  ${run.name} took longer than ${SPEC_TIMEOUT_MS / 60000} minutes`);
      child.kill("SIGKILL");
    }, SPEC_TIMEOUT_MS);
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

async function main() {
  const wanted = process.argv.slice(2);
  const selected = RUNS.filter((r) => wanted.length === 0 || wanted.includes(r.spec));
  if (selected.length === 0)
    fail(`No spec matches ${wanted.join(", ")}. Specs: landing, ux, globe, help-chat.`);
  if (!fs.existsSync(path.join(WEB, ".next", "BUILD_ID"))) {
    fail("The site is not built yet. Build it first:  cd apps/web && npx next build");
  }
  try {
    require.resolve("playwright", { paths: [__dirname] });
  } catch {
    fail(
      "Playwright is not installed here. Run:  npm ci && npx playwright install chromium   (in tools/e2e)",
    );
  }
  fs.mkdirSync(OUT, { recursive: true });
  const nextBin = require.resolve("next/dist/bin/next", { paths: [WEB] });

  const supabase = startProcess(
    "mock supabase",
    [path.join(__dirname, "harness", "mock-supabase.cjs")],
    {
      cwd: __dirname,
      env: process.env,
      logFile: path.join(OUT, "mock-supabase.log"),
    },
  );
  const results = [];
  let site = null;
  let siteKey = null;
  let siteNo = 0;
  const stopSite = async () => {
    if (site) await stopProcess(site);
    site = null;
    siteKey = null;
  };
  try {
    await waitForHttp("http://127.0.0.1:54321/auth/v1/user", 20000);
    for (const run of selected) {
      const key = JSON.stringify(run.env);
      if (key !== siteKey) {
        await stopSite();
        siteNo++;
        site = startProcess(`site ${siteNo}`, [nextBin, "start", "-p", String(PORT)], {
          cwd: WEB,
          logFile: path.join(OUT, `site-${siteNo}.log`),
          env: {
            ...process.env,
            SUPABASE_URL: "http://127.0.0.1:54321",
            SUPABASE_SERVICE_ROLE_KEY: "test",
            SUPABASE_AUTH_REDIRECT_URL: `${BASE_URL}/auth/callback`,
            NASA_FIRMS_MAP_KEY: "testkey",
            NODE_OPTIONS: `--require ${path.join(__dirname, "harness", "mock-fetch.cjs")}`,
            ...run.env,
          },
        });
        siteKey = key;
        try {
          await waitForHttp(BASE_URL + "/", 90000);
        } catch (error) {
          console.error(`\nThe site did not start (${error.message}). Its output:\n`);
          console.error(fs.readFileSync(site.logFile, "utf8").slice(-3000));
          results.push({ name: run.name, passed: false });
          await stopSite();
          continue;
        }
      }
      console.log(`\n=== ${run.name} ===`);
      const passed = await runSpec(run, site.logFile);
      results.push({ name: run.name, passed });
    }
  } finally {
    await stopSite();
    await stopProcess(supabase);
  }

  console.log("\n--- Browser checks ---");
  for (const r of results) console.log(`${r.passed ? "PASS" : "FAIL"}  ${r.name}`);
  const failed = results.filter((r) => !r.passed).length;
  console.log(
    failed === 0
      ? "\nAll browser checks passed."
      : `\n${failed} of ${results.length} runs failed. Screenshots and server logs: ${OUT}`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
