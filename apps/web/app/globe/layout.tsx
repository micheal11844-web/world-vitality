import type { ReactNode } from "react";
import { requireSession } from "../../lib/require-session";

// Same reasoning as dashboard/layout.tsx — this segment reads cookies
// on every request, so it can never be statically prerendered.
export const dynamic = "force-dynamic";

/**
 * Gates `/globe` behind a real session (BUILD_PLAN "STAGE — GOD'S EYE
 * GLOBE VIEW"), same pattern as `dashboard/layout.tsx` and
 * `workspaces/layout.tsx`. This is not optional here the way it might
 * seem for a "just a visualization" page — the globe plots real
 * resource-scoped data (Insurance's insured properties in particular
 * carry the stricter, service-role-only RLS trust boundary
 * `0011_insurance_properties.sql` established specifically because
 * that data is real financial/business information), so an
 * unauthenticated visitor must never reach `page.tsx` at all, let alone
 * see resource pins before per-membership permission filtering even
 * has a chance to run.
 */
export default async function GlobeLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
