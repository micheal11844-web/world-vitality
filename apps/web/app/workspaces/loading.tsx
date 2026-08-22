import { AppShellSkeleton } from "@world-vitality/ui-components";

/**
 * Same mechanism as `app/dashboard/loading.tsx`, applying to all five
 * workspace home pages and their `/map` sub-routes at once — a
 * `loading.tsx` here covers its whole nested route tree automatically,
 * same as `app/workspaces/layout.tsx`'s session gate does. See
 * `AppShellSkeleton`'s doc comment for what this is built from and why.
 */
export default function WorkspacesLoading() {
  return <AppShellSkeleton />;
}
