"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Text, GuideCharacter } from "@world-vitality/ui-components";
import { requestPasswordResetAction } from "../../lib/actions";

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
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | undefined>();

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
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--wv-bg)",
        padding: "var(--wv-space-lg)",
      }}
    >
      <Card style={{ maxWidth: "26rem", width: "100%" }}>
        <div
          style={{ display: "flex", justifyContent: "center", marginBottom: "var(--wv-space-sm)" }}
        >
          <GuideCharacter
            mood={status === "sent" ? "happy" : status === "error" ? "concerned" : "idle"}
          />
        </div>
        <Text
          variant="sectionTitle"
          as="h1"
          style={{ marginBottom: "var(--wv-space-sm)", textAlign: "center" }}
        >
          Reset your password
        </Text>

        {status === "sent" ? (
          <>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)", textAlign: "center" }}>
              Check your email — if an account exists for {email}, we've sent a link to reset your
              password.
            </Text>
            <Text
              variant="caption"
              style={{ textAlign: "center", display: "block", marginTop: "var(--wv-space-md)" }}
            >
              <Link href="/login" style={{ color: "var(--wv-accent)" }}>
                Back to sign in
              </Link>
            </Text>
          </>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" }}
          >
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              Enter the email address on your account and we'll send you a link to set a new
              password.
            </Text>
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={status === "error" ? error : undefined}
            />
            <Button type="submit" loading={status === "sending"}>
              Send reset link
            </Button>
            <Text variant="caption" style={{ textAlign: "center" }}>
              <Link href="/login" style={{ color: "var(--wv-text-secondary)" }}>
                Back to sign in
              </Link>
            </Text>
          </form>
        )}
      </Card>
    </div>
  );
}
