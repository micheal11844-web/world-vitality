import { cache } from "react";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, negotiateLocale, type LocaleCode } from "@world-vitality/i18n";
import { SESSION_COOKIE } from "../constants";
import { getMyPreferences } from "../preferences";

/**
 * The language for this request (BUILD_PLAN "STAGE — MULTI-LANGUAGE"),
 * resolved once and shared by every server component that asks:
 *
 * 1. the signed-in account's saved language (so a choice follows the
 *    person to another device),
 * 2. the explicit choice on this device (`wv_lang` cookie — all a
 *    signed-out visitor has),
 * 3. the browser's `Accept-Language`,
 * 4. English.
 *
 * The account is only consulted when a session cookie exists, so a
 * signed-out visitor never costs a database or auth call. A failed
 * preferences lookup (`null`) simply falls through to the next source —
 * a preferences outage can't take translation, let alone the page, down.
 */
export const getRequestLocale = cache(async (): Promise<LocaleCode> => {
  const cookieStore = await cookies();
  const headerList = await headers();

  let preference: string | null = null;
  if (cookieStore.has(SESSION_COOKIE)) {
    const prefs = await getMyPreferences();
    preference = prefs?.language ?? null;
  }

  return negotiateLocale({
    preference,
    cookie: cookieStore.get(LOCALE_COOKIE)?.value ?? null,
    acceptLanguage: headerList.get("accept-language"),
  });
});
