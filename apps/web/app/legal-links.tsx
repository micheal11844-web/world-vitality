"use client";

import Link from "next/link";
import { useOptionalI18n } from "../lib/i18n/i18n-provider";

/**
 * "Terms of Service · Privacy Policy" links, optionally under the sentence
 * that says signing in or creating an account means agreeing to them
 * (`agree`), centred by default or start-aligned with `align="start"`. Translated inside a `LocaleBoundary`, English elsewhere, like the
 * other small shared links.
 */
export function LegalLinks({
  agree = false,
  align = "center",
}: {
  agree?: boolean;
  /** `center` under a form (the default); `start` where the rest of the page is start-aligned. */
  align?: "center" | "start";
}) {
  const i18n = useOptionalI18n();
  const t = (key: Parameters<NonNullable<typeof i18n>["t"]>[0], fallback: string) =>
    i18n ? i18n.t(key) : fallback;
  const linkStyle = { color: "var(--wv-accent)", textDecoration: "underline" } as const;
  return (
    <p
      data-testid="legal-links"
      style={{
        margin: 0,
        color: "var(--wv-text-secondary)",
        fontFamily: "var(--wv-font-sans)",
        fontSize: "var(--wv-text-sm, 0.875rem)",
        lineHeight: 1.6,
        textAlign: align,
      }}
    >
      {agree ? (
        <>
          {t(
            "legal.signupAgree",
            "By signing in or creating an account, you agree to the Terms of Service and the Privacy Policy.",
          )}
          <br />
        </>
      ) : null}
      <Link href="/terms" className="wv-tap" style={linkStyle}>
        {t("legal.terms.title", "Terms of Service")}
      </Link>
      {" · "}
      <Link href="/privacy" className="wv-tap" style={linkStyle}>
        {t("legal.privacy.title", "Privacy Policy")}
      </Link>
    </p>
  );
}
