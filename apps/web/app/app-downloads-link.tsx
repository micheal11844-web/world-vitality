"use client";

import { useEffect, useState } from "react";
import { DOWNLOADS_URL } from "../lib/downloads-url";
import { useOptionalI18n } from "../lib/i18n/i18n-provider";
import { isNativeShellUserAgent } from "../lib/pwa/native-shell";

/**
 * "Prefer an app?" with a link to the downloads website, for the pages a
 * visitor sees before signing in (the landing page and the sign-in page).
 *
 * Not shown inside the desktop or phone app: someone already running it has
 * no use for the link. That is only known in the browser, so the link
 * appears after the page has loaded rather than flashing in and out. If the
 * downloads site has nothing published yet it says so itself.
 */
export function AppDownloadsLink() {
  // Translated where the page is (the landing page); English on a page that is not yet.
  const i18n = useOptionalI18n();
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!isNativeShellUserAgent(navigator.userAgent));
  }, []);
  if (!show) return null;
  return (
    <span
      style={{
        color: "var(--wv-text-secondary)",
        fontFamily: "var(--wv-font-sans)",
        fontSize: "var(--wv-text-sm, 0.875rem)",
      }}
    >
      {i18n ? i18n.t("landing.appsPrompt") : "Prefer an app?"}{" "}
      <a
        href={DOWNLOADS_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--wv-accent)", textDecoration: "underline" }}
      >
        {i18n ? i18n.t("landing.appsLink") : "Get the desktop or Android app"}
      </a>
    </span>
  );
}
