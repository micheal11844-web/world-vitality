"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Text, AppShell } from "@world-vitality/ui-components";
import { AppBrand } from "../app-brand";
import { buildWorkspaceSidebarItems } from "../workspaces/workspace-nav";
import { updateDisplayNameAction, deleteAccountAction } from "../../lib/account-actions";
import { MAX_DISPLAY_NAME_LENGTH, DELETE_CONFIRMATION_WORD } from "../../lib/account-constants";

export interface SettingsViewProps {
  email: string;
  initialDisplayName: string;
  memberSince: string;
  memberships: Array<{
    workspaceId: string;
    workspaceName: string;
    roleLabel: string;
    scoped: boolean;
  }>;
}

const sectionGap = { display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" } as const;

export function SettingsView({
  email,
  initialDisplayName,
  memberSince,
  memberships,
}: SettingsViewProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [nameError, setNameError] = useState<string | undefined>();

  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameStatus("saving");
    setNameError(undefined);
    const result = await updateDisplayNameAction(displayName);
    if (result.ok) {
      setNameStatus("saved");
    } else {
      setNameStatus("error");
      setNameError(result.error);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    setDeleteError(undefined);
    const result = await deleteAccountAction(confirmText);
    if (result.ok) {
      // Full navigation: the cookies were cleared by a Server Action.
      window.location.href = "/login?deleted=1";
    } else {
      setDeleting(false);
      setDeleteError(result.error);
    }
  }

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={[
        {
          key: "workspaces",
          label: "Workspaces",
          items: [
            { key: "home", label: "Home", href: "/dashboard" },
            ...buildWorkspaceSidebarItems(),
          ],
        },
        {
          key: "account",
          label: "Account",
          items: [{ key: "settings", label: "Settings", href: "/settings", active: true }],
        },
      ]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      <div style={{ ...sectionGap, maxWidth: "40rem" }}>
        <Text variant="pageTitle" as="h1">
          Settings
        </Text>

        <Card>
          <form onSubmit={saveName} style={sectionGap}>
            <Text variant="sectionTitle" as="h2">
              Profile
            </Text>
            <Input label="Email address" value={email} readOnly disabled />
            <Input
              label="Display name"
              value={displayName}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setNameStatus("idle");
              }}
              error={nameStatus === "error" ? nameError : undefined}
              helperText="Shown to teammates in your workspaces."
            />
            <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}>
              <Button type="submit" loading={nameStatus === "saving"}>
                Save name
              </Button>
              {nameStatus === "saved" && (
                <Text variant="caption" role="status" style={{ color: "var(--wv-text-secondary)" }}>
                  Saved.
                </Text>
              )}
            </div>
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              Member since {new Date(memberSince).toLocaleDateString()}.
            </Text>
          </form>
        </Card>

        <Card>
          <div style={sectionGap}>
            <Text variant="sectionTitle" as="h2">
              Your workspaces
            </Text>
            {memberships.length === 0 ? (
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                You aren&apos;t a member of any workspace yet.
              </Text>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "1.25rem", fontFamily: "var(--wv-font-sans)" }}>
                {memberships.map((m) => (
                  <li key={m.workspaceId}>
                    <Link href={`/workspaces/${m.workspaceId}`}>{m.workspaceName}</Link> —{" "}
                    {m.roleLabel}
                    {m.scoped ? " (limited to specific items)" : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <div style={sectionGap}>
            <Text variant="sectionTitle" as="h2">
              Download your data
            </Text>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              One click, no waiting: a JSON file with your profile, your workspace memberships,
              everything you created (fields, properties, locations) and the comments you wrote. It
              doesn&apos;t include other people&apos;s data or public environmental readings, and
              the file says so.
            </Text>
            <div>
              <a
                href="/settings/export"
                download
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  borderRadius: "var(--wv-radius-sm)",
                  border: "1px solid var(--wv-border)",
                  color: "var(--wv-text-primary)",
                  textDecoration: "none",
                  fontFamily: "var(--wv-font-sans)",
                  fontSize: "0.875rem",
                }}
              >
                Download my data
              </a>
            </div>
          </div>
        </Card>

        <Card>
          <form onSubmit={deleteAccount} style={sectionGap}>
            <Text variant="sectionTitle" as="h2">
              Delete your account
            </Text>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              This permanently deletes your account, memberships and the comments you wrote, right
              away. Fields, properties and locations you added belong to the workspace, so they stay
              — without your name on them. This can&apos;t be undone; download your data first if
              you want a copy.
            </Text>
            <Input
              label={`Type ${DELETE_CONFIRMATION_WORD} to confirm`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              error={deleteError}
            />
            <div>
              <Button
                type="submit"
                variant="destructive"
                loading={deleting}
                disabled={confirmText.trim() !== DELETE_CONFIRMATION_WORD}
              >
                Delete my account
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
