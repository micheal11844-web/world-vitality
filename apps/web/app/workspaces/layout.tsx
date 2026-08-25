import type { ReactNode } from "react";
import { requireSession } from "../../lib/require-session";

// Same reasoning as app/dashboard/layout.tsx: an auth check reads
// cookies on every request, so this segment can never be statically
// prerendered.
export const dynamic = "force-dynamic";

/**
 * Gates every route under `/workspaces` — every workspace home page
 * and each of their `/map` sub-routes, since a `layout.tsx` here
 * applies to the whole nested route tree automatically. One gate, not
 * one copy of the same check per workspace. (Public Explorer at
 * `/explore` is the one workspace-like page deliberately outside this
 * tree — see its own page.tsx for why.) See `lib/require-session.ts`'s
 * doc comment for the real scope and the one honestly-open gap (no
 * `refreshSession` wiring yet).
 */
export default async function WorkspacesLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
