import type { ReactNode } from "react";
import { CATALOGS, localeInfo } from "@world-vitality/i18n";
import { I18nProvider } from "./i18n-provider";
import { getRequestLocale } from "./request-locale";

/**
 * Marks a section of the app as translated: sets the language and
 * reading direction for everything inside it (`lang`, `dir`) and gives
 * client components their translator.
 *
 * Applied per route tree — Dashboard, Welcome, Settings, Notifications,
 * Search — rather than on `<html>`, on purpose. Pages that are not
 * translated yet (the workspaces, login, the landing page) stay fully
 * English *and say so to assistive technology*, instead of English text
 * sitting under `lang="es"` or being flipped right-to-left. As more
 * pages are translated they gain this wrapper, and once all of them
 * have it the attributes can move up to the root layout.
 *
 * `display: contents` so the wrapper adds no box of its own to the
 * layouts below it; `dir` and `lang` still inherit through it.
 */
export async function LocaleBoundary({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <div lang={locale} dir={localeInfo(locale).dir} style={{ display: "contents" }}>
      <I18nProvider locale={locale} messages={CATALOGS[locale]}>
        {children}
      </I18nProvider>
    </div>
  );
}
