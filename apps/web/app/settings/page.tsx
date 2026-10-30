import { getAccountService } from "../../lib/account";
import { requireSession } from "../../lib/require-session";
import { logApplication, logTelemetry } from "../../lib/logger";
import { homePlaceLabel, type NotificationSettings } from "@world-vitality/identity-service";
import { getMyPreferences } from "../../lib/preferences";
import { getAccessContext } from "../../lib/get-access-context";
import { billingEnabled, getBillingStore } from "../../lib/billing";
import { summariseBilling } from "@world-vitality/billing-service";
import { WORKSPACE_LINKS } from "../workspaces/workspace-nav";
import { SettingsView, type SettingsViewProps } from "./settings-view";

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
  const [profile, roleRows, prefs, notificationSettings, access] = await Promise.all([
    account.getProfile(session.userId),
    account.getWorkspaceMemberships(session.userId),
    // Fails open (null): a preferences outage must not take Settings down.
    getMyPreferences(),
    account.getNotificationSettings(session.userId).catch((err): NotificationSettings | null => {
      logApplication.error("settings_notification_settings_failed", err);
      return null;
    }),
    // Fails open (null) as well: only decides how the roles are listed below.
    getAccessContext().catch((err) => {
      logApplication.error("settings_access_context_failed", err);
      return null;
    }),
  ]);
  logTelemetry.event("workspace_viewed", { workspace: "settings" });

  // The "Plan & billing" card exists only while billing is switched on. The
  // plan shown is the organisation owner's; if it cannot be read the card
  // still links to the plan page, which says so itself.
  let billing: SettingsViewProps["billing"] = null;
  if (billingEnabled()) {
    billing = { plan: null };
    try {
      const ownerId = access?.organization.ownerId ?? session.userId;
      const summary = summariseBilling(
        await getBillingStore().getSubscription(ownerId),
        new Date(),
      );
      billing = { plan: summary.plan };
    } catch (err) {
      logApplication.error("settings_billing_summary_failed", err);
    }
  }

  // The owner of an organisation is admin in every workspace without having
  // a role row for each, so list them all; a member sees the roles they were
  // given.
  const memberships =
    access?.organization.role === "owner"
      ? WORKSPACE_LINKS.map((w) => ({
          workspaceId: w.key,
          role: "admin_owner" as const,
          scopedResourceIds: undefined,
        }))
      : roleRows;

  return (
    <SettingsView
      email={profile.email}
      initialDisplayName={profile.displayName ?? ""}
      memberSince={profile.createdAt}
      personaId={prefs?.persona ?? null}
      homeLabel={prefs?.homePlace ? homePlaceLabel(prefs.homePlace) : null}
      onboarded={Boolean(prefs?.onboardedAt)}
      billing={billing}
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
