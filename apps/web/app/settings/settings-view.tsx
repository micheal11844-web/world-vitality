"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Checkbox, Input, Text, AppShell } from "@world-vitality/ui-components";
import type { OfficialMinTier } from "@world-vitality/identity-service";
import { AppBrand } from "../app-brand";
import { buildWorkspaceSidebarItems } from "../workspaces/workspace-nav";
import { updateDisplayNameAction, deleteAccountAction } from "../../lib/account-actions";
import { clearHomePlaceAction } from "../../lib/onboarding-actions";
import { saveNotificationSettingsAction } from "../../lib/notification-actions";
import { MAX_DISPLAY_NAME_LENGTH, DELETE_CONFIRMATION_WORD } from "../../lib/account-constants";

export interface SettingsViewProps {
  email: string;
  initialDisplayName: string;
  memberSince: string;
  /** Role chosen in onboarding, if any. */
  personaLabel: string | null;
  /** Home place chosen in onboarding, if any. */
  homeLabel: string | null;
  onboarded: boolean;
  /** `null` when the settings couldn't be loaded — the card then says so instead of guessing. */
  notificationSettings: { officialMinTier: OfficialMinTier; collaborationEnabled: boolean } | null;
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
  personaLabel,
  homeLabel,
  onboarded,
  notificationSettings,
  memberships,
}: SettingsViewProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [nameError, setNameError] = useState<string | undefined>();

  const [removingPlace, setRemovingPlace] = useState(false);
  const [placeRemoved, setPlaceRemoved] = useState(false);
  const [placeError, setPlaceError] = useState<string | undefined>();

  async function removePlace() {
    setRemovingPlace(true);
    setPlaceError(undefined);
    const result = await clearHomePlaceAction();
    setRemovingPlace(false);
    if (result.ok) setPlaceRemoved(true);
    else setPlaceError(result.error);
  }

  const [officialMinTier, setOfficialMinTier] = useState<OfficialMinTier>(
    notificationSettings?.officialMinTier ?? "info",
  );
  const [collaborationEnabled, setCollaborationEnabled] = useState(
    notificationSettings?.collaborationEnabled ?? true,
  );
  const [notifStatus, setNotifStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [notifError, setNotifError] = useState<string | undefined>();

  async function saveNotifications(e: React.FormEvent) {
    e.preventDefault();
    setNotifStatus("saving");
    setNotifError(undefined);
    const result = await saveNotificationSettingsAction({ officialMinTier, collaborationEnabled });
    if (result.ok) {
      setNotifStatus("saved");
    } else {
      setNotifStatus("error");
      setNotifError(result.error);
    }
  }

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
          items: [
            { key: "notifications", label: "Notifications", href: "/notifications" },
            { key: "settings", label: "Settings", href: "/settings", active: true },
          ],
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
              Your role and place
            </Text>
            {!onboarded ? (
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                You haven’t set these up yet. Tell me who you are and the place you care about, and
                I’ll show live conditions for it on your dashboard and in your workspaces.
              </Text>
            ) : (
              <Text variant="body">
                Role: <strong>{personaLabel ?? "not set"}</strong>
                <br />
                Home place: <strong>{placeRemoved ? "removed" : (homeLabel ?? "not set")}</strong>
              </Text>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}>
              <a
                href="/welcome?redo=1"
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
                {onboarded ? "Change" : "Set up"}
              </a>
              {onboarded && homeLabel && !placeRemoved && (
                <Button variant="secondary" onClick={removePlace} loading={removingPlace}>
                  Remove my place
                </Button>
              )}
            </div>
            {placeError && (
              <Text
                variant="caption"
                role="alert"
                style={{ color: "var(--wv-color-critical-500)" }}
              >
                {placeError}
              </Text>
            )}
          </div>
        </Card>

        <div id="notifications" style={{ scrollMarginTop: "var(--wv-space-lg)" }}>
          <Card>
            <form
              onSubmit={saveNotifications}
              style={{ ...sectionGap, fontFamily: "var(--wv-font-sans)" }}
            >
              <Text variant="sectionTitle" as="h2">
                Notifications
              </Text>
              {notificationSettings === null ? (
                <Text variant="body" role="status" style={{ color: "var(--wv-text-secondary)" }}>
                  We couldn&apos;t load your notification settings just now. Refresh to try again.
                </Text>
              ) : (
                <>
                  <fieldset
                    style={{ border: "none", margin: 0, padding: 0, ...sectionGap }}
                    aria-describedby="official-alerts-help"
                  >
                    <legend
                      style={{
                        padding: 0,
                        marginBottom: "var(--wv-space-xs)",
                        fontFamily: "var(--wv-font-sans)",
                        fontWeight: 600,
                      }}
                    >
                      Official weather alerts for your home place
                    </legend>
                    <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                      <input
                        type="radio"
                        name="official-min-tier"
                        value="info"
                        checked={officialMinTier === "info"}
                        onChange={() => {
                          setOfficialMinTier("info");
                          setNotifStatus("idle");
                        }}
                      />
                      <span>Show all of them, including minor advisories and statements</span>
                    </label>
                    <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                      <input
                        type="radio"
                        name="official-min-tier"
                        value="alert"
                        checked={officialMinTier === "alert"}
                        onChange={() => {
                          setOfficialMinTier("alert");
                          setNotifStatus("idle");
                        }}
                      />
                      <span>Only alerts and critical ones — skip minor advisories</span>
                    </label>
                    <Text
                      variant="caption"
                      id="official-alerts-help"
                      style={{ color: "var(--wv-text-secondary)" }}
                    >
                      Critical, life-safety alerts are always shown and can&apos;t be turned off.
                    </Text>
                  </fieldset>
                  <Checkbox
                    label="Tell me when a teammate comments on a field I created"
                    checked={collaborationEnabled}
                    onChange={(e) => {
                      setCollaborationEnabled(e.target.checked);
                      setNotifStatus("idle");
                    }}
                  />
                  <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
                    Notifications appear in the app only — World Vitality doesn&apos;t send push,
                    SMS or email yet, and checks for official alerts only while it&apos;s open. See
                    your <Link href="/notifications">Notification Center</Link>.
                  </Text>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}>
                    <Button type="submit" loading={notifStatus === "saving"}>
                      Save notification settings
                    </Button>
                    {notifStatus === "saved" && (
                      <Text
                        variant="caption"
                        role="status"
                        style={{ color: "var(--wv-text-secondary)" }}
                      >
                        Saved.
                      </Text>
                    )}
                  </div>
                  {notifStatus === "error" && notifError && (
                    <Text
                      variant="caption"
                      role="alert"
                      style={{ color: "var(--wv-color-critical-500)" }}
                    >
                      {notifError}
                    </Text>
                  )}
                </>
              )}
            </form>
          </Card>
        </div>

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

        <div id="download-data" style={{ scrollMarginTop: "var(--wv-space-lg)" }}>
          <Card>
            <div style={sectionGap}>
              <Text variant="sectionTitle" as="h2">
                Download your data
              </Text>
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                One click, no waiting: a JSON file with your profile, your role and home place, your
                notification settings and inbox, your workspace memberships, everything you created
                (fields, properties, locations) and the comments you wrote. It doesn&apos;t include
                other people&apos;s data or public environmental readings, and the file says so.
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
        </div>

        <div id="delete-account" style={{ scrollMarginTop: "var(--wv-space-lg)" }}>
          <Card>
            <form onSubmit={deleteAccount} style={sectionGap}>
              <Text variant="sectionTitle" as="h2">
                Delete your account
              </Text>
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                This permanently deletes your account, memberships, notifications and the comments
                you wrote, right away. Fields, properties and locations you added belong to the
                workspace, so they stay — without your name on them. This can&apos;t be undone;
                download your data first if you want a copy.
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
      </div>
    </AppShell>
  );
}
