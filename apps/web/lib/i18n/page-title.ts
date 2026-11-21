import type { Metadata } from "next";
import type { MessageKey } from "@world-vitality/i18n";
import { getTranslator } from "./server";

/** Ends every tab title, so a pinned tab or a history entry still says whose page it is. */
export const SITE_NAME = "World Vitality";

/**
 * The browser-tab title for a page, in the reader's language: its own name first, then the
 * section it sits in, then the site ("Map · Agriculture — World Vitality", the same "name —
 * World Vitality" shape the Search, Notifications and Terms pages already had). Most pages used
 * to share the one title "World Vitality", which made open tabs, history entries and a screen
 * reader's "page loaded" announcement indistinguishable.
 *
 * Use it from a route's `generateMetadata`. The names are catalog keys that the page's own
 * heading or the menu already use, so there is nothing extra to translate.
 */
export async function pageTitle(...keys: MessageKey[]): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: `${keys.map((key) => t(key)).join(" · ")} — ${SITE_NAME}` };
}
