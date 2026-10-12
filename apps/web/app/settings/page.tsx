import { getAccountService } from "../../lib/account";
import { requireSession } from "../../lib/require-session";
import { logTelemetry } from "../../lib/logger";
import { homePlaceLabel, personaById } from "@world-vitality/identity-service";
import { getMyPreferences } from "../../lib/preferences";
import { WORKSPACE_LINKS } from "../workspaces/workspace-nav";
import { SettingsView } from "./settings-view";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  admin_owner: "Owner / admin",
  operational_user: "Operational user",
  scoped_field_user: "Field user (scoped)",
  viewer_external: "Viewer",
};

/**
 * Account Settings (PRD B.7; BUILD_PLAN "STAGE — ACCOUNT SETTINGS +
 * SIGN OUT"): profile, workspace memberships, data export and account
 * deletion. Server wrapper loads the real profile and memberships; the
 * interactive forms live in `SettingsView`.
 *
 * Also shows the role and home place chosen in onboarding, with
 * change/remove. Not built, honestly: notification preferences,
 * language/accessibility preferences and organization management (the
 * other B.7 items).
 */
export default async function SettingsPage() {
  const session = await requireSession();
  const account = getAccountService();
  const [profile, memberships, prefs] = await Promise.all([
    account.getProfile(session.userId),
    account.getWorkspaceMemberships(session.userId),
    // Fails open (null): a preferences outage must not take Settings down.
    getMyPreferences(),
  ]);
  logTelemetry.event("workspace_viewed", { workspace: "settings" });

  const workspaceNames = new Map(WORKSPACE_LINKS.map((w) => [w.key, w.label]));

  return (
    <SettingsView
      email={profile.email}
      initialDisplayName={profile.displayName ?? ""}
      memberSince={profile.createdAt}
      personaLabel={personaById(prefs?.persona)?.label ?? null}
      homeLabel={prefs?.homePlace ? homePlaceLabel(prefs.homePlace) : null}
      onboarded={Boolean(prefs?.onboardedAt)}
      memberships={memberships.map((m) => ({
        workspaceId: m.workspaceId,
        workspaceName: workspaceNames.get(m.workspaceId) ?? m.workspaceId,
        roleLabel: ROLE_LABELS[m.role] ?? m.role,
        scoped: Boolean(m.scopedResourceIds?.length),
      }))}
    />
  );
}
