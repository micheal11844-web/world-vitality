"use client";

import { useState, useTransition } from "react";
import { Button, Card, StateDisplay, Table, Text, type TableColumn } from "@world-vitality/ui-components";
import type { Role, WorkspaceMemberSummary } from "@world-vitality/identity-service";
import { inviteMemberAction, removeMemberAction } from "./team-actions";

export interface TeamClientProps {
  workspaceId: string;
  currentUserId: string;
  initialMembers: WorkspaceMemberSummary[];
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin_owner", label: "Admin/Owner" },
  { value: "operational_user", label: "Operational User" },
  { value: "scoped_field_user", label: "Scoped/Field User" },
  { value: "viewer_external", label: "Viewer/External" },
];

/**
 * Team management client component (BUILD_PLAN "STAGE — TEAM/INVITE
 * UI"). Optimistic-free by design: after any action, it re-fetches
 * nothing itself and instead relies on the server action's
 * `revalidatePath` (see `team-actions.ts`) to refresh `initialMembers`
 * on next render — simpler than maintaining a parallel client-side
 * copy of server state for a page used occasionally, not continuously.
 */
export function TeamClient({ workspaceId, currentUserId, initialMembers }: TeamClientProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("operational_user");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    startTransition(async () => {
      const result = await inviteMemberAction(workspaceId, email, role);
      if (result.ok) {
        setFormSuccess(`Invite sent to ${email}.`);
        setEmail("");
      } else {
        setFormError(result.error ?? "Failed to send invite.");
      }
    });
  }

  function handleRemove(userId: string) {
    setRemoveError(null);
    startTransition(async () => {
      const result = await removeMemberAction(workspaceId, userId);
      if (!result.ok) {
        setRemoveError(result.error ?? "Failed to remove member.");
      }
    });
  }

  const columns: TableColumn<WorkspaceMemberSummary>[] = [
    { key: "email", header: "Email", render: (m) => m.email },
    {
      key: "role",
      header: "Role",
      render: (m) => ROLE_OPTIONS.find((r) => r.value === m.role)?.label ?? m.role,
    },
    {
      key: "actions",
      header: "",
      render: (m) =>
        m.userId === currentUserId ? (
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            (you)
          </Text>
        ) : (
          <Button variant="destructive" onClick={() => handleRemove(m.userId)} disabled={isPending}>
            Remove
          </Button>
        ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: "var(--wv-space-lg)" }}>
        <Text variant="sectionTitle" as="h2" style={{ marginBottom: "var(--wv-space-sm)" }}>
          Invite someone
        </Text>
        <form
          onSubmit={handleInvite}
          style={{ display: "flex", gap: "var(--wv-space-sm)", flexWrap: "wrap", alignItems: "flex-end" }}
        >
          <div>
            <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
              <label htmlFor="invite-email">Email</label>
            </Text>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "var(--wv-space-xs) var(--wv-space-sm)",
                borderRadius: "var(--wv-radius-sm)",
                border: "1px solid var(--wv-border)",
                fontFamily: "var(--wv-font-sans)",
                fontSize: "0.9375rem",
                minWidth: "16rem",
              }}
            />
          </div>
          <div>
            <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
              <label htmlFor="invite-role">Role</label>
            </Text>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              style={{
                padding: "var(--wv-space-xs) var(--wv-space-sm)",
                borderRadius: "var(--wv-radius-sm)",
                border: "1px solid var(--wv-border)",
                fontFamily: "var(--wv-font-sans)",
                fontSize: "0.9375rem",
              }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={isPending}>
            Send Invite
          </Button>
        </form>
        {formError && (
          <Text variant="caption" style={{ display: "block", color: "var(--wv-critical)", marginTop: "var(--wv-space-sm)" }}>
            {formError}
          </Text>
        )}
        {formSuccess && (
          <Text variant="caption" style={{ display: "block", color: "var(--wv-accent)", marginTop: "var(--wv-space-sm)" }}>
            {formSuccess}
          </Text>
        )}
      </Card>

      {removeError && (
        <Text variant="caption" style={{ display: "block", color: "var(--wv-critical)", marginBottom: "var(--wv-space-sm)" }}>
          {removeError}
        </Text>
      )}

      {initialMembers.length === 0 ? (
        <StateDisplay
          status="empty"
          title="No members yet"
          description="Invite someone above to get started."
        />
      ) : (
        <Table columns={columns} rows={initialMembers} getRowKey={(m) => m.userId} />
      )}
    </div>
  );
}
