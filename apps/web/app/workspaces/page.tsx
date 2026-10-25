import { personaById } from "@world-vitality/identity-service";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";
import { getMyPreferences } from "../../lib/preferences";
import { WorkspacesView } from "./workspaces-view";

export const dynamic = "force-dynamic";

/**
 * The Workspaces page — what the sidebar's "Workspaces" row opens. All of
 * the signed-in user's workspaces as cards, with their own (from
 * onboarding) first. It is the same grid the Home dashboard shows under
 * the user's place, on a page of its own, so the sidebar can keep the long
 * list of workspaces folded away without it ever being hard to find.
 *
 * Gated by `app/workspaces/layout.tsx` like every page under this route.
 * Wrapped in `LocaleBoundary` here rather than in that layout because the
 * other workspace pages are not translated yet (see `LocaleBoundary`) —
 * this one is, so it declares its own language and direction.
 */
export default async function WorkspacesPage() {
  const prefs = await getMyPreferences();
  const persona = personaById(prefs?.persona);

  return (
    <LocaleBoundary>
      <WorkspacesView recommendedKey={persona?.workspaceKey ?? null} />
    </LocaleBoundary>
  );
}
