import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDate, formatRelativeTime } from "../relative-time.js";

const now = new Date("2026-10-14T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

test("English relative times", () => {
  assert.equal(formatRelativeTime(ago(5_000), now, "en"), "now");
  assert.equal(formatRelativeTime(ago(5 * 60_000), now, "en"), "5 minutes ago");
  assert.equal(formatRelativeTime(ago(3 * 3_600_000), now, "en"), "3 hours ago");
  assert.equal(formatRelativeTime(ago(24 * 3_600_000), now, "en"), "yesterday");
  assert.equal(formatRelativeTime(ago(4 * 24 * 3_600_000), now, "en"), "4 days ago");
});

test("the same moment reads in the reader's language", () => {
  assert.match(formatRelativeTime(ago(5 * 60_000), now, "es"), /5 minutos/);
  assert.match(formatRelativeTime(ago(5 * 60_000), now, "fr"), /5 minutes/);
  assert.match(formatRelativeTime(ago(3 * 3_600_000), now, "pt"), /3 horas/);
  const ar = formatRelativeTime(ago(5 * 60_000), now, "ar");
  assert.ok(ar.length > 0 && !/ago/.test(ar), `Arabic should not be English: ${ar}`);
});

test("a timestamp in the future is treated as now, never as 'in 5 minutes'", () => {
  const future = new Date(now.getTime() + 5 * 60_000).toISOString();
  assert.equal(formatRelativeTime(future, now, "en"), "now");
});

test("an unparseable timestamp gives an empty string", () => {
  assert.equal(formatRelativeTime("not a date", now, "en"), "");
});

test("formatDate follows the language, and tolerates bad input", () => {
  assert.equal(
    formatDate("2026-10-14T12:00:00Z", "en", { dateStyle: "long", timeZone: "UTC" }),
    "October 14, 2026",
  );
  assert.match(
    formatDate("2026-10-14T12:00:00Z", "es", { dateStyle: "long", timeZone: "UTC" }),
    /octubre/,
  );
  assert.equal(formatDate("garbage", "en"), "");
});
