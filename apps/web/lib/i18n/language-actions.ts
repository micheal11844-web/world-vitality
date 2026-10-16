"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocaleCode } from "@world-vitality/i18n";
import { getAccountService } from "../account";
import { getSessionUserId } from "../get-session-user-id";
import { logApplication } from "../logger";
import { tServer } from "./server";

export interface LanguageActionResult {
  ok: boolean;
  error?: string;
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Changes the display language. The code is validated against the
 * supported list (never trusted), written to the device cookie — all a
 * signed-out visitor has — and, when signed in, to the account so the
 * choice follows the person to other devices.
 *
 * If saving to the account fails the cookie still stands, so the
 * language does change on this device; the error says the account
 * didn't keep it rather than pretending it all worked.
 */
export async function setLanguageAction(code: string): Promise<LanguageActionResult> {
  if (!isLocaleCode(code)) return { ok: false, error: await tServer("settings.language.failed") };

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, code, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Not sensitive and harmless to read; no reason to hide it from scripts.
    httpOnly: false,
  });

  const userId = await getSessionUserId();
  if (userId) {
    try {
      await getAccountService().saveLanguage(userId, code);
    } catch (err) {
      logApplication.error("language_save_failed", err);
      return { ok: false, error: await tServer("settings.language.failed") };
    }
  }
  return { ok: true };
}
