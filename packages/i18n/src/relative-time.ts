import type { LocaleCode } from "./locales.js";

/**
 * "5 minutes ago" in the reader's language, from an ISO timestamp.
 * Uses `Intl.RelativeTimeFormat` (with `numeric: "auto"`, so "1 day ago"
 * reads "yesterday" where the language has a word for it) — the browser
 * and Node own the grammar, so there are no per-language strings to
 * keep in the catalogs. Returns "" for an unparseable timestamp and
 * treats anything in the future as "now" (a clock-skew guard — an
 * alert never claims to be from the future).
 */
export function formatRelativeTime(iso: string, now: Date, locale: LocaleCode): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const seconds = Math.max(0, Math.round((now.getTime() - then) / 1000));
  if (seconds < 45) return rtf.format(0, "second");
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

/** A calendar date in the reader's language and conventions. */
export function formatDate(
  value: string | number | Date,
  locale: LocaleCode,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, options).format(date);
}
