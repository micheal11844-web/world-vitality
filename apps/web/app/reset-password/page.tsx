"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  Input,
  Text,
  GuideCharacter,
  PasswordStrengthMeter,
} from "@world-vitality/ui-components";
import { updatePasswordAction } from "../../lib/actions";

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setError("Passwords don't match.");
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
          <GuideCharacter mood={status === "error" ? "concerned" : "idle"} />
        </div>
        <Text
          variant="sectionTitle"
          as="h1"
          style={{ marginBottom: "var(--wv-space-lg)", textAlign: "center" }}
        >
          Set a new password
        </Text>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" }}
        >
          <div>
            <Input
              label="New password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={status === "error" ? error : undefined}
            />
            <PasswordStrengthMeter password={password} />
          </div>
          <Input
            label="Confirm new password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" loading={status === "saving"}>
            Update password
          </Button>
          {status === "error" && error?.includes("expired") && (
            <Text variant="caption" style={{ textAlign: "center" }}>
              <Link href="/forgot-password" style={{ color: "var(--wv-accent)" }}>
                Request a new reset link
              </Link>
            </Text>
          )}
        </form>
      </Card>
    </div>
  );
}
