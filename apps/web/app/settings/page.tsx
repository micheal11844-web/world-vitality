import { getAccountService } from "../../lib/account";
import { requireSession } from "../../lib/require-session";
import { logApplication, logTelemetry } from "../../lib/logger";
import { homePlaceLabel, type NotificationSettings } from "@world-vitality/identity-service";
import { getMyPreferences } from "../../lib/preferences";
import { SettingsView } from "./settings-view";

export const dynamic = "force-dynamic";

/**
 * Account Settings (PRD B.7; BUILD_PLAN "STAGE — ACCOUNT SETTINGS +
 * SIGN OUT"): profile, workspace memberships, data export and account
 * deletion. Server wrapper loads the real profile and memberships; the
 * interactive forms live in `SettingsView`.
 *
 * Also shows the role and home place chosen in onboarding, with
 * change/remove, the notification preferences (in-app only — see the
 * Notification Center) and the display language. Not built, honestly:
 * accessibility preferences and organization management (the other B.7
 * items).
 */
export default async function SettingsPage() {
  const session = await requireSession();
  const account = getAccountService();
  const [profile, memberships, prefs, notificationSettings] = await Promise.all([
    account.getProfile(session.userId),
    account.getWorkspaceMemberships(session.userId),
    // Fails open (null): a preferences outage must not take Settings down.
    getMyPreferences(),
    account.getNotificationSettings(session.userId).catch((err): NotificationSettings | null => {
      logApplication.error("settings_notification_settings_failed", err);
      return null;
    }),
  ]);
  logTelemetry.event("workspace_viewed", { workspace: "settings" });

  return (
    <SettingsView
      email={profile.email}
      initialDisplayName={profile.displayName ?? ""}
      memberSince={profile.createdAt}
      personaId={prefs?.persona ?? null}
      homeLabel={prefs?.homePlace ? homePlaceLabel(prefs.homePlace) : null}
      onboarded={Boolean(prefs?.onboardedAt)}
      notificationSettings={
        notificationSettings
          ? {
              officialMinTier: notificationSettings.officialMinTier,
              collaborationEnabled: notificationSettings.collaborationEnabled,
            }
          : null
      }
      memberships={memberships.map((m) => ({
        workspaceId: m.workspaceId,
        role: m.role,
        scoped: Boolean(m.scopedResourceIds?.length),
      }))}
    />
  );
}
