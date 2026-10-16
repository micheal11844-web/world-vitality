import { DEFAULT_LOCALE, type LocaleCode } from "./locales.js";
import { ar } from "./messages/ar.js";
import { en, type Messages } from "./messages/en.js";
import { es } from "./messages/es.js";
import { fr } from "./messages/fr.js";
import { pt } from "./messages/pt.js";
import {
  buildTranslator,
  translateOr,
  type Translate,
  type Translator,
} from "./translator-core.js";

export { buildTranslator, translateOr, type Translate, type Translator };

/** Every catalog, by language. English is the source of truth. */
export const CATALOGS: Readonly<Record<LocaleCode, Messages>> = { en, es, fr, pt, ar };

/**
 * Builds the translator for one language, with English as the fallback:
 * a string that is somehow empty in a language shows in English
 * (readable) rather than blank, and a key missing everywhere shows as
 * the key, which is loud in review. The typed catalogs make the missing
 * case a compile error in practice; this is the belt to that pair of
 * braces.
 */
export function createTranslator(locale: LocaleCode): Translator {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  return buildTranslator(locale, catalog, CATALOGS[DEFAULT_LOCALE]);
}
