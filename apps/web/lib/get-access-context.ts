import { cache } from "react";
import type { OrganizationMembership, WorkspaceMembership } from "@world-vitality/identity-service";
import { getAccountService } from "./account";
import { getSessionUserId } from "./get-session-user-id";

/**
 * Who the signed-in person is, which organisation they belong to, and the
 * workspace roles they hold — looked up once per request.
 *
 * `React.cache` makes the several callers on one page (a workspace page
 * asks for its membership, the shell asks again, the globe asks for three)
 * share a single set of queries instead of repeating them.
 *
 * Creates the person's own organisation the first time they need one
 * (`ensureOrganization` is a single idempotent database statement), so
 * nobody ever has to "set up" an organisation before using the app.
 *
 * Returns `null` when there is no valid session. **Throws** if the
 * database cannot be read; every caller wraps this in its own try/catch and
 * fails CLOSED (no organisation, so no saved items are shown) — see
 * `get-workspace-membership.ts`.
 */
export interface AccessContext {
  userId: string;
  organization: OrganizationMembership;
  /** The person's explicit `workspace_members` rows. */
  roleRows: WorkspaceMembership[];
}

export const getAccessContext = cache(async (): Promise<AccessContext | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const account = getAccountService();
  const [organization, roleRows] = await Promise.all([
    account.ensureOrganization(userId),
    account.getWorkspaceMemberships(userId),
  ]);
  return { userId, organization, roleRows };
});
