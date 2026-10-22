import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getStaffStanding, requireStaff } from "../../lib/staff";

// Who is looking changes every request, so nothing here may be prerendered.
export const dynamic = "force-dynamic";

/**
 * Titled only for staff. A static `metadata` export would put "Admin
 * console" in the tab title of the "not found" page everyone else sees,
 * which would announce that the console exists. (Search engines are kept
 * out for every visitor by the `X-Robots-Tag` header set in
 * `next.config.mjs`, so nothing is lost by leaving the rest to staff.)
 */
export async function generateMetadata(): Promise<Metadata> {
  const standing = await getStaffStanding();
  if (standing.status !== "staff") return {};
  return {
    title: "Admin console — World Vitality",
    robots: { index: false, follow: false },
  };
}

/**
 * Gates everything under `/admin` to active staff (BUILD_PLAN "v87").
 * Each page then asks for the specific permission it needs, so this
 * layout is the floor, not the only check. Everyone else — signed-in
 * customers included — gets the ordinary "not found" page.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireStaff();
  return <>{children}</>;
}
