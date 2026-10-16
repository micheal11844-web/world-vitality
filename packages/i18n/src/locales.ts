/**
 * Supported languages and how one is chosen for a request.
 *
 * Constitution (Accessibility Principles): "Support multiple languages
 * and literacy levels from the architecture level up, not as a
 * translation layer bolted onto a finished English product." So the
 * language is a first-class input to every render — resolved once per
 * request here, carried on `<html lang dir>`, and every user-facing
 * string comes from a catalog keyed by a typed message id — rather than
 * English literals with a translation pass on top.
 *
 * **Review status is part of the data.** English is the source. The
 * others were drafted by an AI model and have *not* been reviewed by a
 * native speaker; they're marked `draft` and the language picker says
 * so. Flipping a language to `reviewed` is a deliberate, human step.
 */

export type LocaleCode = "en" | "es" | "fr" | "pt" | "ar";

export type TextDirection = "ltr" | "rtl";

export type ReviewStatus = "source" | "draft" | "reviewed";

export interface LocaleInfo {
  code: LocaleCode;
  /** The name in English, e.g. "Spanish". */
  englishName: string;
  /** The name in its own language and script — what the picker shows. */
  nativeName: string;
  dir: TextDirection;
  review: ReviewStatus;
}

export const LOCALES: readonly LocaleInfo[] = [
  { code: "en", englishName: "English", nativeName: "English", dir: "ltr", review: "source" },
  { code: "es", englishName: "Spanish", nativeName: "Español", dir: "ltr", review: "draft" },
  { code: "fr", englishName: "French", nativeName: "Français", dir: "ltr", review: "draft" },
  { code: "pt", englishName: "Portuguese", nativeName: "Português", dir: "ltr", review: "draft" },
  { code: "ar", englishName: "Arabic", nativeName: "العربية", dir: "rtl", review: "draft" },
];

export const DEFAULT_LOCALE: LocaleCode = "en";

/** Name of the cookie holding an explicit language choice on this device. */
export const LOCALE_COOKIE = "wv_lang";

export function isLocaleCode(value: unknown): value is LocaleCode {
  return typeof value === "string" && LOCALES.some((l) => l.code === value);
}

export function localeInfo(code: LocaleCode): LocaleInfo {
  return LOCALES.find((l) => l.code === code) ?? (LOCALES[0] as LocaleInfo);
}

export function localeDirection(code: LocaleCode): TextDirection {
  return localeInfo(code).dir;
}

/**
 * Parses an `Accept-Language` header into language tags, best first.
 * Entries with `q=0` ("not acceptable") are dropped; ties keep header
 * order. Malformed entries are skipped rather than throwing.
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  const entries: { tag: string; q: number; order: number }[] = [];
  header.split(",").forEach((part, order) => {
    const [rawTag, ...params] = part.trim().split(";");
    const tag = (rawTag ?? "").trim();
    if (!tag || tag === "*") return;
    let q = 1;
    for (const param of params) {
      const [name, value] = param.trim().split("=");
      if (name?.trim().toLowerCase() === "q") {
        const parsed = Number.parseFloat(value ?? "");
        q = Number.isFinite(parsed) ? parsed : 0;
      }
    }
    if (q <= 0) return;
    entries.push({ tag, q, order });
  });
  return entries.sort((a, b) => b.q - a.q || a.order - b.order).map((e) => e.tag);
}

/**
 * Maps one language tag to a supported locale by its primary subtag:
 * `es-MX` and `ES` → `es`, `pt-BR` → `pt`, `ar-EG` → `ar`. Unsupported
 * languages return `null` — never a near-miss guess.
 */
export function matchLocale(tag: string | null | undefined): LocaleCode | null {
  if (!tag) return null;
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0];
  return isLocaleCode(primary) ? primary : null;
}

/**
 * Picks the language for a request: the signed-in account's saved
 * choice, then an explicit choice on this device (cookie), then the
 * browser's `Accept-Language`, then English. An invalid value at any
 * step is skipped, not trusted.
 *
 * The account comes first so a choice made on one device follows the
 * person to another; the cookie is what a signed-out visitor has, and
 * what a signed-in person who never chose has left over. Changing the
 * language writes both, so they agree.
 */
export function negotiateLocale(input: {
  cookie?: string | null;
  preference?: string | null;
  acceptLanguage?: string | null;
}): LocaleCode {
  if (isLocaleCode(input.preference)) return input.preference;
  if (isLocaleCode(input.cookie)) return input.cookie;
  for (const tag of parseAcceptLanguage(input.acceptLanguage)) {
    const match = matchLocale(tag);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}
