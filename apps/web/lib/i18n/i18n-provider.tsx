"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  buildChromeStrings,
  buildTranslator,
  type LocaleCode,
  type Messages,
  type Translator,
} from "@world-vitality/i18n";
import { UiStringsProvider } from "@world-vitality/ui-components";
import { rememberLanguage } from "../pwa/remember-language";

const I18nContext = createContext<Translator | null>(null);

/**
 * Gives client components the reader's language. The server hands over
 * only the *active* language's catalog, so a visitor never downloads the
 * other four. The same translator also feeds the shared app chrome
 * (header, sidebar, search, bell, AI panel) through `UiStringsProvider`.
 */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: LocaleCode;
  messages: Messages;
  children: ReactNode;
}) {
  const translator = useMemo(() => buildTranslator(locale, messages), [locale, messages]);
  const chrome = useMemo(() => buildChromeStrings(translator), [translator]);
  // The offline page is shown in the language last used here.
  useEffect(() => rememberLanguage(locale), [locale]);
  return (
    <I18nContext.Provider value={translator}>
      <UiStringsProvider value={chrome}>{children}</UiStringsProvider>
    </I18nContext.Provider>
  );
}

/**
 * The current language's translator, or `null` outside a `LocaleBoundary`.
 * For a component shared between a translated page and one that is not
 * translated yet (a workspace shell serves both a workspace's home page and
 * its map page): it translates when it can and stays English when it cannot,
 * instead of throwing.
 */
export function useOptionalI18n(): Translator | null {
  return useContext(I18nContext);
}

/** The current language's translator. Must be used under a `LocaleBoundary`. */
export function useI18n(): Translator {
  const translator = useContext(I18nContext);
  if (!translator) {
    throw new Error("useI18n() was called outside a <LocaleBoundary>.");
  }
  return translator;
}
