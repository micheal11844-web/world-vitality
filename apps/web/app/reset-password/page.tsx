"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  GuideCharacter,
  Input,
  Text,
  PasswordStrengthMeter,
} from "@world-vitality/ui-components";
import { updatePasswordAction } from "../../lib/actions";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { LanguageSwitcher } from "../../lib/i18n/language-switcher";

/**
 * Reset Password (BUILD_PLAN Stage 13 follow-up). Only reachable with a
 * valid session cookie set by `/auth/callback`'s `type=recovery`
 * branch — there is no other way to land here with a working submit
 * (`updatePasswordAction` checks for that cookie itself, not just this
 * page). A person who navigates here directly without having clicked a
 * real reset link will get a real, honest error on submit ("Your
 * password reset link has expired"), not a silently-broken form.
 *
 * On success, `updatePasswordAction` signs the user out of this
 * recovery-derived session (see that action's doc comment for why) —
 * this page reflects that by sending them to `/login`, not
 * `/dashboard`, requiring a fresh sign-in with the new password.
 */
export default function ResetPasswordPage() {
  const { t, locale } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | undefined>();
  // The server says when the link has run out, so the page doesn't read its sentence.
  const [expired, setExpired] = useState(false);

  // An error was written in the language of the moment; after a language change it is
  // cleared rather than left behind in the old one.
  const previousLocale = useRef(locale);
  useEffect(() => {
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    setError(undefined);
    setStatus((current) => (current === "error" ? "idle" : current));
  }, [locale]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setExpired(false);
      setError(t("auth.err.mismatch"));
      return;
    }
    setStatus("saving");
    const result = await updatePasswordAction(password);
    if (result.ok) {
      // A full navigation, not router.push — same reasoning as the
      // login page's handlePasswordSubmit: the cookie change (here, a
      // cookie *deletion*) happened in a Server Action, and downstream
      // Server Components need to see that fresh, not a stale
      // client-cached view of it.
      window.location.href = "/login?reset=success";
    } else {
      setStatus("error");
      setError(result.error);
      setExpired(result.expired === true);
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
            <GuideCharacter mood={status === "error" ? "concerned" : "idle"} size={96} />
          </div>
          <Text
            variant="sectionTitle"
            as="h1"
            style={{ marginBottom: "var(--wv-space-lg)", textAlign: "center" }}
          >
            {t("auth.reset.title")}
          </Text>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" }}
          >
            <div>
              <Input
                label={t("auth.reset.newPassword")}
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={status === "error" ? error : undefined}
              />
              <PasswordStrengthMeter
                password={password}
                labels={[
                  t("auth.strength.veryWeak"),
                  t("auth.strength.weak"),
                  t("auth.strength.fair"),
                  t("auth.strength.strong"),
                  t("auth.strength.veryStrong"),
                ]}
                ariaLabel={(label) => t("auth.strength.aria", { label })}
                showHints={locale === "en"}
              />
            </div>
            <Input
              label={t("auth.reset.confirm")}
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" loading={status === "saving"}>
              {t("auth.reset.submit")}
            </Button>
            {status === "error" && expired && (
              <Text variant="caption" style={{ textAlign: "center" }}>
                <Link href="/forgot-password" style={{ color: "var(--wv-accent)" }}>
                  {t("auth.reset.requestNew")}
                </Link>
              </Text>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
