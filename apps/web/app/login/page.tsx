"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, Text } from "@world-vitality/ui-components";
import { requestMagicLinkAction } from "../../lib/actions";

/**
 * `useSearchParams()` opts a component out of static rendering and
 * requires an explicit Suspense boundary in the App Router — without
 * one, `next build` fails prerendering this page entirely. `LoginForm`
 * is the part that needs the boundary; `LoginPage` below just supplies
 * it, so the fallback (a plain, unstyled instant paint of the same
 * layout) is only visible for the brief moment before search params are
 * read client-side.
 */
const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  missing_token: "That sign-in link looks incomplete. Please request a new one.",
  verification_failed:
    "That sign-in link has expired or already been used. Please request a new one.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | undefined>();

  // Surfaces a failure from the /auth/callback redirect (e.g. an
  // expired or already-used sign-in link) — previously this silently
  // landed back on a blank login form with zero explanation.
  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError) {
      setStatus("error");
      setError(
        CALLBACK_ERROR_MESSAGES[callbackError] ??
          "Something went wrong. Please request a new sign-in link.",
      );
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const result = await requestMagicLinkAction(email);
    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  return (
    <Card style={{ maxWidth: "24rem", width: "100%" }}>
      <Text variant="sectionTitle" as="h1" style={{ marginBottom: "var(--wv-space-sm)" }}>
        Sign in to World Vitality
      </Text>
      {status === "sent" ? (
        <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
          Check your email — we sent a sign-in link to {email}.
        </Text>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" }}
        >
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={status === "error" ? error : undefined}
          />
          <Button type="submit" loading={status === "sending"}>
            Send sign-in link
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function LoginPage() {
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
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
