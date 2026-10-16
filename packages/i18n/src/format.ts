import { localeDirection, type LocaleCode } from "./locales.js";

/**
 * A deliberately small message formatter — just what the catalogs need,
 * with no dependency and no eval:
 *
 * - `{name}` — substitutes a variable.
 * - `{count, plural, one {# item} other {# items}}` — picks a branch by
 *   the locale's plural rules (`Intl.PluralRules`), so Arabic gets its
 *   six categories and English its two. Branch keys are the CLDR
 *   categories (`zero one two few many other`) or an exact `=N`. `#`
 *   inside a branch is the number, formatted for the locale.
 *
 * Branch text may contain `{name}` variables but not another plural.
 * Literal braces aren't supported — no catalog string needs one. The
 * output is always a plain string (React escapes it); this never throws:
 * a missing variable leaves its `{placeholder}` visible, and a malformed
 * template is returned as written, so a catalog typo is visible and
 * harmless rather than a crash.
 */

export type MessageVars = Record<string, string | number>;

const PLURAL_KEYS = new Set(["zero", "one", "two", "few", "many", "other"]);

interface Token {
  type: "text" | "var" | "plural";
  value: string;
  /** For plurals: branch key → branch template. */
  branches?: Map<string, string>;
}

function findClosingBrace(text: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parsePluralBranches(body: string): Map<string, string> | null {
  const branches = new Map<string, string>();
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i] as string)) i += 1;
    if (i >= body.length) break;
    const keyStart = i;
    while (i < body.length && !/[\s{]/.test(body[i] as string)) i += 1;
    const key = body.slice(keyStart, i);
    while (i < body.length && /\s/.test(body[i] as string)) i += 1;
    if (body[i] !== "{") return null;
    const close = findClosingBrace(body, i);
    if (close === -1) return null;
    if (!PLURAL_KEYS.has(key) && !/^=\d+$/.test(key)) return null;
    branches.set(key, body.slice(i + 1, close));
    i = close + 1;
  }
  return branches.has("other") ? branches : null;
}

function tokenize(template: string): Token[] | null {
  const tokens: Token[] = [];
  let text = "";
  let i = 0;
  while (i < template.length) {
    const ch = template[i] as string;
    if (ch !== "{") {
      text += ch;
      i += 1;
      continue;
    }
    const close = findClosingBrace(template, i);
    if (close === -1) return null;
    const inner = template.slice(i + 1, close);
    if (text) tokens.push({ type: "text", value: text });
    text = "";

    const firstComma = inner.indexOf(",");
    if (firstComma === -1) {
      tokens.push({ type: "var", value: inner.trim() });
    } else {
      const name = inner.slice(0, firstComma).trim();
      const rest = inner.slice(firstComma + 1);
      const secondComma = rest.indexOf(",");
      if (secondComma === -1 || rest.slice(0, secondComma).trim() !== "plural") return null;
      const branches = parsePluralBranches(rest.slice(secondComma + 1));
      if (!branches) return null;
      tokens.push({ type: "plural", value: name, branches });
    }
    i = close + 1;
  }
  if (text) tokens.push({ type: "text", value: text });
  return tokens;
}

/**
 * In a right-to-left language a substituted *string* (a place name, a
 * search query, a user's own words) can be Latin or mixed-direction
 * text, and unisolated it makes the surrounding punctuation and
 * neighbouring words jump to the wrong side. Wrapping it in the Unicode
 * isolate pair FSI…PDI keeps it from interacting with the sentence.
 * Numbers need no isolation, and left-to-right languages none at all.
 */
const FSI = "\u2068";
const PDI = "\u2069";

const numberFormats = new Map<LocaleCode, Intl.NumberFormat>();

/** A number in the language's own numerals and grouping — the same rule the plural `#` follows. */
function numberText(value: number, locale: LocaleCode): string {
  let format = numberFormats.get(locale);
  if (!format) {
    format = new Intl.NumberFormat(locale);
    numberFormats.set(locale, format);
  }
  return format.format(value);
}

function valueText(value: string | number, locale: LocaleCode): string {
  if (typeof value === "number") return numberText(value, locale);
  if (localeDirection(locale) !== "rtl" || value === "") return value;
  return `${FSI}${value}${PDI}`;
}

function substituteVars(text: string, vars: MessageVars, locale: LocaleCode): string {
  return text.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (whole, name: string) =>
    name in vars ? valueText(vars[name] as string | number, locale) : whole,
  );
}

export function formatMessage(
  template: string,
  vars: MessageVars | undefined,
  locale: LocaleCode,
): string {
  const values = vars ?? {};
  const tokens = tokenize(template);
  if (!tokens) return template;

  return tokens
    .map((token) => {
      if (token.type === "text") return token.value;
      if (token.type === "var") {
        return token.value in values
          ? valueText(values[token.value] as string | number, locale)
          : `{${token.value}}`;
      }
      const raw = values[token.value];
      const count = typeof raw === "number" ? raw : Number(raw);
      if (raw === undefined || !Number.isFinite(count)) return `{${token.value}}`;
      const branches = token.branches as Map<string, string>;
      const exact = branches.get(`=${count}`);
      const category = new Intl.PluralRules(locale).select(count);
      const branch = exact ?? branches.get(category) ?? (branches.get("other") as string);
      const formattedCount = numberText(count, locale);
      return substituteVars(branch.replace(/#/g, formattedCount), values, locale);
    })
    .join("");
}

/**
 * Whether a template is well-formed for `formatMessage` (balanced
 * braces, plural branches with an `other`). The catalog tests use this
 * so a typo in any language fails the build instead of rendering as raw
 * braces for a reader.
 */
export function isValidTemplate(template: string): boolean {
  return tokenize(template) !== null;
}

/**
 * The variable names a template uses, sorted — including the counted
 * variable of a plural and any variable inside a branch. Two languages'
 * versions of one message must use the same set (a translation that
 * silently drops `{place}` is a bug), which the catalog tests enforce.
 */
export function templateVariables(template: string): string[] {
  const tokens = tokenize(template);
  if (!tokens) return [];
  const names = new Set<string>();
  for (const token of tokens) {
    if (token.type === "var") names.add(token.value);
    if (token.type === "plural") {
      names.add(token.value);
      for (const branch of (token.branches as Map<string, string>).values()) {
        for (const match of branch.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)) {
          names.add(match[1] as string);
        }
      }
    }
  }
  return [...names].sort();
}
