import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  SupabaseStaffService,
  staffCan,
  type StaffPermission,
  type StaffRole,
} from "@world-vitality/identity-service";
import { getAuthService } from "./auth";
import { SESSION_COOKIE } from "./constants";
import { logSecurity } from "./logger";

/**
 * Server-side only — the service-role client behind the internal admin
 * console (BUILD_PLAN "v87"). Same construction and same rule as
 * `getAccountService()`: never import this from a Client Component.
 */
export function getStaffService(): SupabaseStaffService {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). " +
        "See services/identity-service/.env.example and docs/onboarding/repository-setup.md.",
    );
  }
  return new SupabaseStaffService(createClient(supabaseUrl, supabaseServiceRoleKey));
}

export interface StaffContext {
  userId: string;
  email: string;
  role: StaffRole;
}

export type StaffStanding =
  { status: "signed-out" } | { status: "not-staff" } | { status: "staff"; staff: StaffContext };

/**
 * Who is making this request, as far as the admin console is concerned.
 * Cached for the request, so the layout and the page that sits under it
 * share one lookup.
 *
 * Fail-closed: if the session or the staff table cannot be read, this
 * throws, which renders the error page — it never falls through to "allow".
 * A signed-in person with no active staff row is simply `not-staff`.
 */
export const getStaffStanding = cache(async (): Promise<StaffStanding> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return { status: "signed-out" };

  const session = await getAuthService().getSession(token);
  if (!session) return { status: "signed-out" };

  const member = await getStaffService().getStaffMember(session.userId);
  if (!member) return { status: "not-staff" };
  return {
    status: "staff",
    staff: { userId: session.userId, email: session.email, role: member.role },
  };
});

/**
 * The gate for every `/admin` page. Signed-out visitors go to the normal
 * sign-in page. Anyone else who is not allowed gets the ordinary
 * "not found" page — the console does not announce itself to people who
 * cannot use it.
 *
 * With no argument it admits any active staff member (what the layout
 * does); with a permission it also requires that permission (what each
 * page does), so a page added later without its own check still cannot
 * be opened by someone outside staff.
 */
export async function requireStaff(permission?: StaffPermission): Promise<StaffContext> {
  const standing = await getStaffStanding();
  if (standing.status === "signed-out") redirect("/login");
  if (standing.status === "not-staff") {
    logSecurity.warn("admin_access_denied", { reason: "not_staff" });
    notFound();
  }
  if (standing.status !== "staff") notFound();
  if (permission && !staffCan(standing.staff.role, permission)) {
    logSecurity.warn("admin_access_denied", {
      reason: "missing_permission",
      permission,
      role: standing.staff.role,
    });
    notFound();
  }
  return standing.staff;
}

/**
 * The same check for Server Actions, which are callable endpoints in their
 * own right and so cannot lean on the page that rendered them. Returns
 * `null` instead of redirecting: the action answers "not available".
 */
export async function staffForAction(permission: StaffPermission): Promise<StaffContext | null> {
  const standing = await getStaffStanding();
  if (standing.status !== "staff") return null;
  if (!staffCan(standing.staff.role, permission)) {
    logSecurity.warn("admin_access_denied", {
      reason: "missing_permission",
      permission,
      role: standing.staff.role,
    });
    return null;
  }
  return standing.staff;
}
