import type { ReactNode } from "react";
import { requireSession } from "../../lib/require-session";

// Cookies are read on every request here, so this segment can never be
// statically prerendered anyway — stated explicitly rather than left
// implicit, same discipline as every workspace page's own
// `dynamic = "force-dynamic"` (this one needs it for a different
// reason: an auth check, not fresh environmental data).
export const dynamic = "force-dynamic";

/**
 * Gates every route under `/dashboard` (BUILD_PLAN Stage 13 follow-up
 * #3's flagged gap — see `lib/require-session.ts`'s doc comment for
 * why this is a `layout.tsx` check rather than Middleware). Redirects
 * to `/login` if there's no valid session; renders `children` as
 * normal otherwise. `DashboardPage` itself is unchanged.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
