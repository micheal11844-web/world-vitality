import Link from "next/link";
import { getTranslator } from "../../lib/i18n/server";

/**
 * Presentation of the Dashboard's urgent-item banner (see
 * `CriticalNotice` for when it appears). Split out so it can be
 * rendered and inspected without a signed-in session.
 *
 * Visual language: the heavy critical border, tinted ground and the "!"
 * CRITICAL label, which the design reserves for the critical tier alone.
 * Wording is the agency's own title with a calm pointer to the full
 * text — no extra urgency copy added.
 *
 * Translation: the chrome around the alert (the "Critical" label, the
 * link) follows the reader's language, but the agency's own title and
 * text are **never translated** — they are marked `lang="en"` (and
 * left-to-right) so a screen reader pronounces them correctly and an
 * RTL page doesn't reorder an English sentence. A wrong or softened
 * translation of an emergency instruction is worse than English.
 */
export async function CriticalBanner({
  title,
  body,
  othersCount,
}: {
  title: string;
  body: string | null;
  /** How many *other* unread critical notifications exist. */
  othersCount: number;
}) {
  const { t, locale, dir } = await getTranslator();
  // Only mark the alert text as a different language when the page isn't English.
  const alertLang = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);
  return (
    <section
      aria-label={t("dashboard.critical.region")}
      style={{
        border: "2px solid var(--wv-critical)",
        backgroundColor: "var(--wv-color-critical-50)",
        borderRadius: "var(--wv-radius-md)",
        padding: "var(--wv-space-md)",
        marginBottom: "var(--wv-space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--wv-space-xs)",
        fontFamily: "var(--wv-font-sans)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          // Letter-spacing breaks the joined letterforms of Arabic script.
          letterSpacing: dir === "rtl" ? 0 : "0.06em",
          textTransform: "uppercase",
          color: "var(--wv-critical)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "1.125rem",
            height: "1.125rem",
            borderRadius: "999px",
            backgroundColor: "var(--wv-critical)",
            color: "#ffffff",
            lineHeight: 1,
          }}
        >
          !
        </span>
        {t("dashboard.critical.label")}
      </span>
      <strong {...alertLang} style={{ color: "var(--wv-text-primary)" }}>
        {title}
      </strong>
      {body && (
        <span {...alertLang} style={{ color: "var(--wv-text-primary)" }}>
          {body}
        </span>
      )}
      <span>
        <Link href="/notifications" style={{ color: "var(--wv-critical)", fontWeight: 600 }}>
          {othersCount > 0
            ? t("dashboard.critical.openMore", { count: othersCount })
            : t("dashboard.critical.openFull")}
        </Link>
      </span>
    </section>
  );
}
