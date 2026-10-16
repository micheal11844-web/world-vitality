import { formatMessage, type MessageVars } from "./format.js";
import { localeDirection, type LocaleCode, type TextDirection } from "./locales.js";
import { formatDate, formatRelativeTime } from "./relative-time.js";
import type { MessageKey, Messages } from "./messages/en.js";

/**
 * An own-property read: a key built from data (`"constructor"`,
 * `"__proto__"`) must not resolve to something inherited from `Object`.
 */
function own(
  catalog: Readonly<Partial<Record<MessageKey, string>>>,
  key: MessageKey,
): string | undefined {
  return Object.prototype.hasOwnProperty.call(catalog, key) ? catalog[key] : undefined;
}

export type Translate = (key: MessageKey, vars?: MessageVars) => string;

export interface Translator {
  locale: LocaleCode;
  dir: TextDirection;
  /** Looks a message up and formats it. Falls back language → English → the key itself. */
  t: Translate;
  /** "5 minutes ago" in this language. */
  relativeTime: (iso: string, now?: Date) => string;
  /** A calendar date in this language. */
  date: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  /** A number in this language's numerals and grouping. */
  number: (value: number) => string;
}

/**
 * Builds a translator from ONE catalog (plus an optional fallback).
 *
 * This lives apart from `createTranslator` on purpose: it imports no
 * catalog, so a browser bundle that only needs this — the host app
 * hands the active language's catalog to its client provider — doesn't
 * drag all five languages along.
 */
export function buildTranslator(
  locale: LocaleCode,
  catalog: Readonly<Partial<Record<MessageKey, string>>>,
  fallback?: Readonly<Partial<Record<MessageKey, string>>>,
): Translator {
  const t: Translate = (key, vars) => {
    const template = own(catalog, key) || (fallback && own(fallback, key)) || key;
    return formatMessage(template, vars, locale);
  };
  const numberFormat = new Intl.NumberFormat(locale);
  return {
    locale,
    dir: localeDirection(locale),
    t,
    relativeTime: (iso, now = new Date()) => formatRelativeTime(iso, now, locale),
    date: (value, options) => formatDate(value, locale, options),
    number: (value) => numberFormat.format(value),
  };
}

/**
 * `t(key)` for a key built from data (`workspace.${id}.name`), with a
 * fallback when there's no such message. `t` returns the key itself
 * when it can't find one (that is its documented last resort), so a
 * result equal to the key means "unknown". This deliberately doesn't
 * consult the English catalog: a browser bundle that only needs this
 * stays free of every catalog but the active one.
 */
export function translateOr(t: Translate, key: string, fallback: string): string {
  const result = t(key as MessageKey);
  return result === key ? fallback : result;
}

export type { Messages };
