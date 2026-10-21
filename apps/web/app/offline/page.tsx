import type { Metadata } from "next";
import { DEFAULT_LOCALE, createTranslator, isLocaleCode, localeInfo } from "@world-vitality/i18n";

export const metadata: Metadata = {
  title: "Offline — World Vitality",
  robots: { index: false },
};

/**
 * What the service worker shows when a page can't be reached and nothing is
 * saved for it (`public/sw.js`). It is saved once per language at install
 * (`/offline?lang=es` …) and the worker picks one from the browser's
 * language — which is why the language comes from the URL here, not from the
 * account or a cookie: this page has to be the same for everyone and cost
 * nothing to build.
 *
 * Deliberately plain: text first, no images, no scripts it depends on —
 * "Try again" is a link to the page's own address (`href=""`), not a
 * button that needs JavaScript, because the point of this page is that
 * very little is available. Everything it needs is in the HTML.
 */
export default async function OfflinePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { lang } = await searchParams;
  const requested = Array.isArray(lang) ? lang[0] : lang;
  const locale = isLocaleCode(requested) ? requested : DEFAULT_LOCALE;
  const { t } = createTranslator(locale);

  const action = {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "2.75rem",
    padding: "0 var(--wv-space-lg)",
    borderRadius: "var(--wv-radius-sm)",
    fontFamily: "var(--wv-font-sans)",
    fontSize: "1rem",
    textDecoration: "none",
  } as const;

  return (
    <main
      lang={locale}
      dir={localeInfo(locale).dir}
      style={{
        maxWidth: "34rem",
        margin: "0 auto",
        padding: "var(--wv-space-xl) var(--wv-space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--wv-space-md)",
        fontFamily: "var(--wv-font-sans)",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 500 }}>{t("offline.title")}</h1>
      <p style={{ margin: 0, lineHeight: 1.6, color: "var(--wv-text-secondary)" }}>
        {t("offline.body")}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--wv-space-sm)" }}>
        {/* An empty href is the page's own address: it works with no script at
            all, which is the whole point of this page. */}
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a
          href=""
          style={{
            ...action,
            backgroundColor: "var(--wv-accent)",
            color: "var(--wv-bg)",
            border: "1px solid var(--wv-accent)",
          }}
        >
          {t("offline.retry")}
        </a>
        <a
          href="/dashboard"
          style={{
            ...action,
            border: "1px solid var(--wv-border)",
            color: "var(--wv-text-primary)",
            backgroundColor: "var(--wv-surface)",
          }}
        >
          {t("offline.dashboard")}
        </a>
      </div>
      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--wv-text-secondary)" }}>
        {t("offline.privacy")}
      </p>
    </main>
  );
}
