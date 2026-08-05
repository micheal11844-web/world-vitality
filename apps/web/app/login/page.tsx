"use client";

import { useState } from "react";
import { Button, Card, Input, Text } from "@world-vitality/ui-components";
import { requestMagicLinkAction } from "../../lib/actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | undefined>();

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
    </div>
  );
}
