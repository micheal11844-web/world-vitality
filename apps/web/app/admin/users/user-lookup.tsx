"use client";

import { useState, useTransition, type CSSProperties, type FormEvent } from "react";
import { Button, Card, Input, Text } from "@world-vitality/ui-components";
import { lookupUserAction } from "../../../lib/admin/admin-actions";
import type { LookupActionResult, LookupUserView } from "../../../lib/admin/admin-types";

const stack = { display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" } as const;

const rowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(8rem, 12rem) 1fr",
  gap: "var(--wv-space-sm)",
  padding: "var(--wv-space-xs) 0",
  borderBottom: "1px solid var(--wv-border)",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={rowStyle}>
      <dt style={{ color: "var(--wv-text-secondary)", fontSize: "0.875rem" }}>{label}</dt>
      <dd style={{ margin: 0, overflowWrap: "anywhere" }}>{children}</dd>
    </div>
  );
}

const yesNo = (value: boolean | null) =>
  value === null ? "Unknown (sign-in system unreachable)" : value ? "Yes" : "No";

function UserDetails({ user }: { user: LookupUserView }) {
  return (
    <Card>
      <div style={stack}>
        <Text variant="sectionTitle" as="h2">
          {user.displayName || user.email || "Account"}
        </Text>
        <dl style={{ margin: 0, fontFamily: "var(--wv-font-sans)" }}>
          <Row label="Email">{user.email ?? "—"}</Row>
          <Row label="Email confirmed">{yesNo(user.emailConfirmed)}</Row>
          <Row label="Joined">{user.createdAt ?? "—"}</Row>
          <Row label="Last signed in">{user.lastSignInAt ?? "Never, or unknown"}</Row>
          <Row label="Onboarding">{user.onboarded ? "Finished or skipped" : "Not yet"}</Row>
          <Row label="Language">{user.language ?? "Not chosen"}</Row>
          <Row label="User id">
            <code style={{ fontSize: "0.8125rem" }}>{user.userId}</code>
          </Row>
        </dl>
        <section
          aria-labelledby="memberships-heading"
          style={{ display: "grid", gap: "var(--wv-space-sm)" }}
        >
          <Text variant="body" as="h3" id="memberships-heading" style={{ fontWeight: 600 }}>
            Workspace memberships
          </Text>
          {user.memberships.length === 0 ? (
            <Text variant="body">None.</Text>
          ) : (
            <ul
              style={{
                margin: 0,
                paddingInlineStart: "1.25rem",
                fontFamily: "var(--wv-font-sans)",
              }}
            >
              {user.memberships.map((m) => (
                <li key={`${m.workspace}-${m.role}`}>
                  {m.workspace} — {m.role}
                  {m.scoped ? " (limited to chosen fields)" : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Card>
  );
}

function Outcome({ result }: { result: LookupActionResult }) {
  switch (result.status) {
    case "found":
      return <UserDetails user={result.user} />;
    case "not_found":
      return (
        <Text variant="body" role="status">
          No account matches that. The search was still recorded.
        </Text>
      );
    case "invalid":
      return (
        <Text variant="body" role="alert">
          {result.message}
        </Text>
      );
    case "denied":
      return (
        <Text variant="body" role="alert">
          That is not available to you. Reload the page and sign in again if this looks wrong.
        </Text>
      );
    case "error":
      return (
        <Text variant="body" role="alert">
          {result.message}
        </Text>
      );
  }
}

export function UserLookup() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      setResult(await lookupUserAction(query));
    });
  }

  return (
    <div style={{ ...stack, maxWidth: "44rem" }}>
      <Text variant="pageTitle" as="h1">
        User lookup
      </Text>
      <Text variant="body">
        Find one account to help its owner. Every search is recorded in the audit log with your name
        and the account it found. Only what support needs to help is shown here: no home place, no
        notifications, nothing from inside a workspace.
      </Text>
      <form onSubmit={submit} style={stack} autoComplete="off">
        <Input
          label="Full email address or user id"
          type="text"
          name="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          helperText="Exact matches only — partial searches are not supported."
          maxLength={320}
          spellCheck={false}
          autoCapitalize="off"
          required
        />
        <div>
          <Button type="submit" loading={pending} disabled={!query.trim()}>
            Look up
          </Button>
        </div>
      </form>
      <div aria-live="polite">{result && <Outcome result={result} />}</div>
    </div>
  );
}
