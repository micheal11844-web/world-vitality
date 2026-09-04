import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { can } from "@world-vitality/identity-service";
import { StateDisplay, Text } from "@world-vitality/ui-components";
import { WORKSPACE_LINKS } from "../../workspace-nav";
import { getWorkspaceRole } from "../../../../lib/get-workspace-role";
import { getAccountService } from "../../../../lib/account";
import { getAuthService } from "../../../../lib/auth";
import { SESSION_COOKIE } from "../../../../lib/constants";
import { TeamShell } from "./team-shell";
import { TeamClient, type ScopableResource } from "./team-client";
export const dynamic = "force-dynamic";

/**
 * Team management (BUILD_PLAN "STAGE — TEAM/INVITE UI"). One generic
 * route, `/workspaces/[workspaceId]/team`, serving all 10 authenticated
 * workspaces (Public Explorer is outside auth entirely and has no team
 * concept) — Next.js App Router supports a dynamic segment as a sibling
 * to the 11 existing static workspace folders without touching any of
 * them; a literal folder always wins over the dynamic one at the same
 * level, so `/workspaces/agriculture` still resolves to its own
 * `page.tsx` exactly as before.
 *
 * Deliberately minimal, workspace-agnostic chrome — a plain `AppShell`
 * with no AI panel and no per-workspace sidebar richness, not each
 * workspace's own bespoke `workspace-shell.tsx`. Dynamically importing
 * one of 11 different shell components by a runtime `workspaceId`
 * string would need its own non-trivial (and easy to get subtly wrong)
 * mapping; this page is used occasionally, not as a primary workspace
 * view, so simpler and honestly-less-polished chrome here is a
 * reasonable trade, not a corner cut silently.
 */
export default async function TeamPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const workspace = WORKSPACE_LINKS.find((w) => w.key === workspaceId);
  if (!workspace) {
    notFound();
  }

  const role = await getWorkspaceRole(workspaceId);

  if (!can(role, "workspace:manage_team")) {
    return (
      <TeamShell>
        <StateDisplay
          status="error"
          title="Access denied"
          description="This role does not have permission to manage team members for this workspace."
        />
      </TeamShell>
    );
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const session = sessionToken ? await getAuthService().getSession(sessionToken) : null;
  const currentUserId = session?.userId ?? "";

  const members = await getAccountService().listWorkspaceMembers(workspaceId);
  // Two workspaces have a real resource type to scope a
  // scoped_field_user invite to today: Agriculture's fields
  // (BUILD_PLAN "STAGE — AGRICULTURE FIELDS"), Insurance's insured
  // properties (BUILD_PLAN "STAGE — INSURANCE FOLLOW-UP: INSURED
  // PROPERTIES"), and Government & NGOs' monitored locations
  // (BUILD_PLAN "STAGE — GOVERNMENT & NGOS FOLLOW-UP: MONITORED
  // LOCATIONS") — each mapped into TeamClient's workspace-neutral
  // `ScopableResource` shape. Every other workspace passes an empty
  // list, and TeamClient simply doesn't show a picker when there's
  // nothing real to pick from — no fabricated resource concept
  // invented for workspaces that don't have one.
  const availableResources: ScopableResource[] =
    workspaceId === "agriculture"
      ? (await getAccountService().listFields(workspaceId)).map((f) => ({ id: f.id, label: f.name }))
      : workspaceId === "insurance"
        ? (await getAccountService().listProperties(workspaceId)).map((p) => ({
            id: p.id,
            label: `${p.policyNumber} — ${p.propertyAddress}`,
          }))
        : workspaceId === "government-ngos"
          ? (await getAccountService().listLocations(workspaceId)).map((l) => ({
              id: l.id,
              label: l.label,
            }))
          : [];

  return (
    <TeamShell>
      <div>
        <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
          Team — {workspace.label}
        </Text>
        <Text
          variant="body"
          style={{ color: "var(--wv-text-secondary)", marginBottom: "var(--wv-space-lg)" }}
        >
          Invite people to this workspace and manage their access.
        </Text>
        <TeamClient
          workspaceId={workspaceId}
          currentUserId={currentUserId}
          initialMembers={members}
          availableResources={availableResources}
        />
      </div>
    </TeamShell>
  );
}
