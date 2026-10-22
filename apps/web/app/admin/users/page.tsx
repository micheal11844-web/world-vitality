import { staffPermissionsFor } from "@world-vitality/identity-service";
import { requireStaff } from "../../../lib/staff";
import { AdminShell } from "../admin-shell";
import { UserLookup } from "./user-lookup";

/**
 * Support's user lookup (BUILD_PLAN "v87"). The page itself reads nothing:
 * the search runs as a Server Action that records the lookup in the staff
 * audit log before it reads anything about the person.
 */
export default async function AdminUsersPage() {
  const staff = await requireStaff("users:lookup");
  return (
    <AdminShell current="users" permissions={staffPermissionsFor(staff.role)}>
      <UserLookup />
    </AdminShell>
  );
}
