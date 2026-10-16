"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Checkbox, Input, Text, AppShell } from "@world-vitality/ui-components";
import type { OfficialMinTier } from "@world-vitality/identity-service";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { LanguageSwitcher } from "../../lib/i18n/language-switcher";
import { personaLabel, roleLabel, workspaceName } from "../../lib/i18n/labels";
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
  /** Role chosen in onboarding (a persona id), if any — labelled in the reader's language here. */
  personaId: string | null;
  /** Home place chosen in onboarding, if any. */
  homeLabel: string | null;
  onboarded: boolean;
  /** `null` when the settings couldn't be loaded — the card then says so instead of guessing. */
  notificationSettings: { officialMinTier: OfficialMinTier; collaborationEnabled: boolean } | null;
  memberships: Array<{
    workspaceId: string;
    /** The workspace role id (e.g. `operational_user`), labelled here. */
    role: string;
    scoped: boolean;
  }>;
}

const sectionGap = { display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" } as const;

export function SettingsView({
  email,
  initialDisplayName,
  memberSince,
  personaId,
  homeLabel,
  onboarded,
  notificationSettings,
  memberships,
}: SettingsViewProps) {
  const translator = useI18n();
  const { t } = translator;
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
          label: t("nav.workspaces"),
          items: [
            { key: "home", label: t("nav.home"), href: "/dashboard" },
            ...buildWorkspaceSidebarItems(undefined, undefined, t),
          ],
        },
        {
          key: "account",
          label: t("nav.account"),
          items: [
            { key: "notifications", label: t("nav.notifications"), href: "/notifications" },
            { key: "settings", label: t("nav.settings"), href: "/settings", active: true },
          ],
        },
      ]}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      <div style={{ ...sectionGap, maxWidth: "40rem" }}>
        <Text variant="pageTitle" as="h1">
          {t("settings.title")}
        </Text>

        <Card>
          <form onSubmit={saveName} style={sectionGap}>
            <Text variant="sectionTitle" as="h2">
              {t("settings.profile.title")}
            </Text>
            {/* An email address is always left-to-right, even on an RTL page. */}
            <Input label={t("settings.profile.email")} value={email} readOnly disabled dir="ltr" />
            <Input
              label={t("settings.profile.displayName")}
              value={displayName}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setNameStatus("idle");
              }}
              error={nameStatus === "error" ? nameError : undefined}
              helperText={t("settings.profile.displayNameHelp")}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}>
              <Button type="submit" loading={nameStatus === "saving"}>
                {t("settings.profile.save")}
              </Button>
              {nameStatus === "saved" && (
                <Text variant="caption" role="status" style={{ color: "var(--wv-text-secondary)" }}>
                  {t("common.saved")}
                </Text>
              )}
            </div>
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              {t("settings.profile.memberSince", {
                date: translator.date(memberSince, { dateStyle: "long" }),
              })}
            </Text>
          </form>
        </Card>

        <Card>
          <div style={sectionGap}>
            <Text variant="sectionTitle" as="h2">
              {t("settings.roleAndPlace.title")}
            </Text>
            {!onboarded ? (
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                {t("settings.roleAndPlace.notSetUp")}
              </Text>
            ) : (
              <Text variant="body">
                {t("settings.roleAndPlace.role")}{" "}
                <strong>
                  {personaId ? personaLabel(personaId, t) : t("settings.roleAndPlace.notSet")}
                </strong>
                <br />
                {t("settings.roleAndPlace.homePlace")}{" "}
                <strong>
                  {placeRemoved
                    ? t("settings.roleAndPlace.removed")
                    : (homeLabel ?? t("settings.roleAndPlace.notSet"))}
                </strong>
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
                {onboarded ? t("common.change") : t("settings.roleAndPlace.setUp")}
              </a>
              {onboarded && homeLabel && !placeRemoved && (
                <Button variant="secondary" onClick={removePlace} loading={removingPlace}>
                  {t("settings.roleAndPlace.remove")}
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

        <div id="language" style={{ scrollMarginTop: "var(--wv-space-lg)" }}>
          <Card>
            <div style={sectionGap}>
              <Text variant="sectionTitle" as="h2">
                {t("settings.language.title")}
              </Text>
              <LanguageSwitcher />
              <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
                {t("settings.language.draftNote")}
              </Text>
              <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
                {t("settings.language.scopeNote")}
              </Text>
            </div>
          </Card>
        </div>

        <div id="notifications" style={{ scrollMarginTop: "var(--wv-space-lg)" }}>
          <Card>
            <form
              onSubmit={saveNotifications}
              style={{ ...sectionGap, fontFamily: "var(--wv-font-sans)" }}
            >
              <Text variant="sectionTitle" as="h2">
                {t("settings.notifications.title")}
              </Text>
              {notificationSettings === null ? (
                <Text variant="body" role="status" style={{ color: "var(--wv-text-secondary)" }}>
                  {t("settings.notifications.loadFailed")}
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
                      {t("settings.notifications.officialLegend")}
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
                      <span>{t("settings.notifications.showAll")}</span>
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
                      <span>{t("settings.notifications.alertsOnly")}</span>
                    </label>
                    <Text
                      variant="caption"
                      id="official-alerts-help"
                      style={{ color: "var(--wv-text-secondary)" }}
                    >
                      {t("settings.notifications.criticalAlways")}
                    </Text>
                  </fieldset>
                  <Checkbox
                    label={t("settings.notifications.collaboration")}
                    checked={collaborationEnabled}
                    onChange={(e) => {
                      setCollaborationEnabled(e.target.checked);
                      setNotifStatus("idle");
                    }}
                  />
                  <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
                    {t("settings.notifications.inAppNote")}{" "}
                    <Link href="/notifications">{t("settings.notifications.center")}</Link>.
                  </Text>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}>
                    <Button type="submit" loading={notifStatus === "saving"}>
                      {t("settings.notifications.save")}
                    </Button>
                    {notifStatus === "saved" && (
                      <Text
                        variant="caption"
                        role="status"
                        style={{ color: "var(--wv-text-secondary)" }}
                      >
                        {t("common.saved")}
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
              {t("settings.workspaces.title")}
            </Text>
            {memberships.length === 0 ? (
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                {t("settings.workspaces.none")}
              </Text>
            ) : (
              <ul
                style={{
                  margin: 0,
                  paddingInlineStart: "1.25rem",
                  fontFamily: "var(--wv-font-sans)",
                }}
              >
                {memberships.map((m) => (
                  <li key={m.workspaceId}>
                    <Link href={`/workspaces/${m.workspaceId}`}>
                      {workspaceName(m.workspaceId, t)}
                    </Link>{" "}
                    — {roleLabel(m.role, t)}
                    {m.scoped ? ` ${t("settings.workspaces.limited")}` : ""}
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
                {t("settings.download.title")}
              </Text>
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                {t("settings.download.body")}
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
                  {t("settings.download.button")}
                </a>
              </div>
            </div>
          </Card>
        </div>

        <div id="delete-account" style={{ scrollMarginTop: "var(--wv-space-lg)" }}>
          <Card>
            <form onSubmit={deleteAccount} style={sectionGap}>
              <Text variant="sectionTitle" as="h2">
                {t("settings.delete.title")}
              </Text>
              <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                {t("settings.delete.body")}
              </Text>
              <Input
                label={t("settings.delete.confirmLabel", { word: DELETE_CONFIRMATION_WORD })}
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
                  {t("settings.delete.button")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
