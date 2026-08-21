import type { ReactNode } from "react";
import { requireSession } from "../../lib/require-session";

// Same reasoning as app/dashboard/layout.tsx: an auth check reads
// cookies on every request, so this segment can never be statically
// prerendered.
export const dynamic = "force-dynamic";

/**
 * Gates every route under `/workspaces` — all five workspace home
 * pages (Agriculture, Weather & Climate, Construction, Renewable
 * Energy, Research) and each of their `/map` sub-routes, since a
 * `layout.tsx` here applies to the whole nested route tree
 * automatically. One gate, not five-plus copies of the same check.
 * See `lib/require-session.ts`'s doc comment for the real scope and
 * the one honestly-open gap (no `refreshSession` wiring yet).
 */
export default async function WorkspacesLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
