"use client";

import { useEffect, useRef, useState } from "react";
import {
  ERROR_TEXTS,
  errorLocaleFromBrowser,
  type ErrorLocale,
} from "@world-vitality/i18n/error-texts";
import { MessageScreen } from "../lib/errors/message-screen";

/**
 * What a visitor sees when a page fails while it is being built or loaded (a data source that
 * hiccups, a database that does not answer), in place of Next's bare "Application error" screen:
 * it says plainly that the fault is ours, offers "Try again" (re-runs the page) and a way home,
 * and shows the error's reference code so a support message can quote it. Written in the
 * visitor's language from the device's saved choice or the browser's; see `packages/i18n/src/error-texts.ts` for
 * why it does not use the message catalogs.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<ErrorLocale>("en");
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setLocale(errorLocaleFromBrowser(document.cookie, navigator.languages ?? [navigator.language]));
    // A screen reader announces the new content when focus lands on its heading.
    heading.current?.focus();
  }, []);

  const text = ERROR_TEXTS[locale];
  return (
    <MessageScreen
      lang={locale}
      dir={text.dir}
      title={text.errorTitle}
      body={text.errorBody}
      reference={error.digest ? text.reference(error.digest) : undefined}
      headingRef={heading}
      actions={[
        { label: text.retry, onClick: reset, primary: true },
        { label: text.home, href: "/" },
      ]}
    />
  );
}
