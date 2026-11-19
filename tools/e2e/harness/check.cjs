// Tiny PASS/FAIL reporter shared by the specs. Each spec prints one line per check and exits
// non-zero when any failed, so the runner (and CI) can tell.
"use strict";

function checker(label) {
  let failed = 0;
  let total = 0;
  const ok = (name, cond, extra = "") => {
    total++;
    if (!cond) failed++;
    const detail = !cond && extra !== "" ? "  " + String(extra).slice(0, 600) : "";
    console.log(`${cond ? "PASS" : "FAIL"}  [${label}] ${name}${detail}`);
  };
  /** Prints the verdict and returns the process exit code. */
  const finish = () => {
    console.log(
      failed === 0
        ? `ALL PASS [${label}] (${total} checks)`
        : `${failed} FAILED [${label}] of ${total} checks`,
    );
    return failed === 0 ? 0 : 1;
  };
  return { ok, finish };
}

module.exports = { checker };
