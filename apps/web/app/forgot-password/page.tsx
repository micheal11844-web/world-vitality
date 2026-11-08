"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, GuideCharacter, Input, Text } from "@world-vitality/ui-components";
import { requestPasswordResetAction } from "../../lib/actions";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { LanguageSwitcher } from "../../lib/i18n/language-switcher";

/**
 * Forgot Password (BUILD_PLAN Stage 13 follow-up). A **separate** flow
 * from the login page's magic-link sign-in, even though both send an
 * emailed link — see `AuthService.requestPasswordReset`'s doc comment
 * for why they're kept distinct rather than one reused for both
 * purposes. This page only requests the email; setting the new
 * password happens on `/reset-password`, after the emailed link is
 * clicked and verified server-side by `/auth/callback`.
 *
 * Deliberately simpler than `/login`'s split-screen illustration
 * layout — a single centered card, no illustration panel. A real,
 * deliberate choice for a secondary utility page reached from one link,
 * not an oversight; matching login's full treatment wasn't judged worth
 * the added layout weight here.
 */
/** Keeps an email address in its own order inside right-to-left text. */
function isolate(value: string): string {
  return `\u2068${value}\u2069`;
}

export default function ForgotPasswordPage() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | undefined>();

  // An error from the server was written in the language of the moment; after a
  // language change it is cleared rather than left behind in the old one.
  const previousLocale = useRef(locale);
  useEffect(() => {
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    setError(undefined);
    setStatus((current) => (current === "error" ? "idle" : current));
  }, [locale]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const result = await requestPasswordResetAction(email);
    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--wv-bg)",
        padding: "var(--wv-space-md) var(--wv-space-lg) var(--wv-space-lg)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <LanguageSwitcher compact />
      </div>
      <div
        style={{
          margin: "auto",
          width: "100%",
          maxWidth: "26rem",
          padding: "var(--wv-space-md) 0",
        }}
      >
        <Card style={{ maxWidth: "26rem", width: "100%", boxSizing: "border-box" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "var(--wv-space-sm)",
            }}
          >
            <GuideCharacter
              mood={status === "sent" ? "happy" : status === "error" ? "concerned" : "idle"}
              size={96}
            />
          </div>
          <Text
            variant="sectionTitle"
            as="h1"
            style={{ marginBottom: "var(--wv-space-sm)", textAlign: "center" }}
          >
            {t("auth.forgot.title")}
          </Text>

          {status === "sent" ? (
            <>
              <Text
                variant="body"
                style={{ color: "var(--wv-text-secondary)", textAlign: "center" }}
              >
                {t("auth.forgot.sent", { email: isolate(email) })}
              </Text>
              <Text
                variant="caption"
                style={{ textAlign: "center", display: "block", marginTop: "var(--wv-space-md)" }}
              >
                <Link href="/login" style={{ color: "var(--wv-accent)" }}>
                  {t("auth.backToSignIn")}
                </Link>
              </Text>
            </>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" }}
            >
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                {t("auth.forgot.intro")}
              </Text>
              <Input
                label={t("auth.email")}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={status === "error" ? error : undefined}
              />
              <Button type="submit" loading={status === "sending"}>
                {t("auth.forgot.send")}
              </Button>
              <Text variant="caption" style={{ textAlign: "center" }}>
                <Link href="/login" style={{ color: "var(--wv-text-secondary)" }}>
                  {t("auth.backToSignIn")}
                </Link>
              </Text>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
