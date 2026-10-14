import Link from "next/link";

/**
 * Presentation of the Dashboard's urgent-item banner (see
 * `CriticalNotice` for when it appears). Split out so it can be
 * rendered and inspected without a signed-in session.
 *
 * Visual language: the heavy critical border, tinted ground and the "!"
 * CRITICAL label, which the design reserves for the critical tier alone.
 * Wording is the agency's own title with a calm pointer to the full
 * text — no extra urgency copy added.
 */
export function CriticalBanner({
  title,
  body,
  othersCount,
}: {
  title: string;
  body: string | null;
  /** How many *other* unread critical notifications exist. */
  othersCount: number;
}) {
  return (
    <section
      aria-label="Critical alert"
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
          letterSpacing: "0.06em",
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
        CRITICAL
      </span>
      <strong style={{ color: "var(--wv-text-primary)" }}>{title}</strong>
      {body && <span style={{ color: "var(--wv-text-primary)" }}>{body}</span>}
      <span>
        <Link href="/notifications" style={{ color: "var(--wv-critical)", fontWeight: 600 }}>
          {othersCount > 0
            ? `Open Notifications — ${othersCount} more critical`
            : "Open Notifications for the full text"}
        </Link>
      </span>
    </section>
  );
}
