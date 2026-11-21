"use client";

import { useEffect, useRef, useState } from "react";
import {
  ERROR_TEXTS,
  errorLocaleFromBrowser,
  type ErrorLocale,
} from "@world-vitality/i18n/error-texts";
import { MessageScreen } from "../lib/errors/message-screen";

/**
 * The last resort: the failure was in the root layout itself, so this replaces the whole page
 * (it brings its own `<html>` and `<body>`). Same words as `error.tsx`; the theme stylesheet
 * may not have loaded, which is why the screen's colours all carry fallbacks.
 */
export default function GlobalError({
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
    heading.current?.focus();
  }, []);

  const text = ERROR_TEXTS[locale];
  return (
    <html lang={locale} dir={text.dir}>
      <body style={{ margin: 0 }}>
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
      </body>
    </html>
  );
}
