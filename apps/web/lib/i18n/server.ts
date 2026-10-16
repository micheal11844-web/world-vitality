import {
  createTranslator,
  type MessageKey,
  type MessageVars,
  type Translator,
} from "@world-vitality/i18n";
import { getRequestLocale } from "./request-locale";

/** The translator for this request — for Server Components and Route Handlers. */
export async function getTranslator(): Promise<Translator> {
  return createTranslator(await getRequestLocale());
}

/**
 * One message in this request's language. For Server Actions, which
 * return error text: it's resolved only when an error actually happens,
 * so the happy path pays nothing for translation.
 */
export async function tServer(key: MessageKey, vars?: MessageVars): Promise<string> {
  return (await getTranslator()).t(key, vars);
}
