"use client";

import { useState, useTransition } from "react";
import {
  Button,
  Card,
  Input,
  Select,
  StateDisplay,
  Table,
  Text,
  type TableColumn,
} from "@world-vitality/ui-components";
import type { Role, WorkspaceMemberSummary } from "@world-vitality/identity-service";
import { inviteMemberAction, removeMemberAction } from "./team-actions";
import { UpgradeLink } from "../../../upgrade-link";

/** A real, scopable resource, reduced to just what the invite picker
 *  needs to display — `page.tsx` maps whichever workspace-specific
 *  type actually exists (Agriculture's `Field`, Insurance's
 *  `InsuranceProperty`) into this shape. Generalized here rather than
 *  left as Agriculture-only `Field[]` the moment Insurance became a
 *  genuine second consumer (BUILD_PLAN "STAGE — INSURANCE FOLLOW-UP:
 *  INSURED PROPERTIES") — exactly the Engineering Blueprint 4.5
 *  trigger ("promote to shared/generic only once a genuine second
 *  consumer exists") this file's own prior version was written to wait
 *  for. The underlying database tables stay separate (a field and a
 *  property don't share a real schema) — only this UI-facing shape is
 *  shared. */
export interface ScopableResource {
  id: string;
  label: string;
}

export interface TeamClientProps {
  workspaceId: string;
  currentUserId: string;
  initialMembers: WorkspaceMemberSummary[];
  /**
   * Real resources to scope a `scoped_field_user` invite to — non-empty
   * for Agriculture (fields, BUILD_PLAN "STAGE — AGRICULTURE FIELDS")
   * and Insurance (insured properties, BUILD_PLAN "STAGE — INSURANCE
   * FOLLOW-UP: INSURED PROPERTIES"). Empty for every other workspace,
   * which simply means the picker below never renders there — no
   * fabricated resource concept invented for workspaces that don't have
   * one.
   */
  availableResources: ScopableResource[];
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
export function TeamClient({
  workspaceId,
  currentUserId,
  initialMembers,
  availableResources,
}: TeamClientProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("operational_user");
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setUpgrade(false);
    setFormSuccess(null);
    const scopedResourceIds =
      role === "scoped_field_user" && selectedResourceIds.length > 0
        ? selectedResourceIds
        : undefined;
    startTransition(async () => {
      const result = await inviteMemberAction(workspaceId, email, role, scopedResourceIds);
      if (result.ok) {
        setFormSuccess(`Invite sent to ${email}.`);
        setEmail("");
        setSelectedResourceIds([]);
      } else {
        setFormError(result.error ?? "Failed to send invite.");
        setUpgrade(Boolean(result.upgrade));
      }
    });
  }

  function toggleResource(resourceId: string) {
    setSelectedResourceIds((prev) =>
      prev.includes(resourceId) ? prev.filter((id) => id !== resourceId) : [...prev, resourceId],
    );
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
            {m.isOrganizationOwner ? "(you · owner)" : "(you)"}
          </Text>
        ) : m.isOrganizationOwner ? (
          <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
            (owner)
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
          style={{
            display: "flex",
            gap: "var(--wv-space-sm)",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: "1 1 16rem", maxWidth: "24rem" }}>
            <Input
              id="invite-email"
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Select
            id="invite-role"
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <Button type="submit" loading={isPending}>
            Send Invite
          </Button>
        </form>
        {role === "scoped_field_user" && availableResources.length > 0 && (
          <div style={{ marginTop: "var(--wv-space-sm)" }}>
            <Text
              variant="caption"
              style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}
            >
              Scope to specific resources (optional — leave unchecked for workspace-wide access):
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--wv-space-sm)" }}>
              {availableResources.map((resource) => (
                <label
                  key={resource.id}
                  style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-xs)" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedResourceIds.includes(resource.id)}
                    onChange={() => toggleResource(resource.id)}
                  />
                  <Text variant="caption">{resource.label}</Text>
                </label>
              ))}
            </div>
          </div>
        )}
        {formError && (
          <Text
            variant="caption"
            style={{
              display: "block",
              color: "var(--wv-critical)",
              marginTop: "var(--wv-space-sm)",
            }}
          >
            {formError}
            {upgrade && <UpgradeLink />}
          </Text>
        )}
        {formSuccess && (
          <Text
            variant="caption"
            style={{ display: "block", color: "var(--wv-accent)", marginTop: "var(--wv-space-sm)" }}
          >
            {formSuccess}
          </Text>
        )}
      </Card>

      {removeError && (
        <Text
          variant="caption"
          style={{
            display: "block",
            color: "var(--wv-critical)",
            marginBottom: "var(--wv-space-sm)",
          }}
        >
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
