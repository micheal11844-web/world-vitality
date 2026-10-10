import type { ReactNode } from "react";
import { requireSession } from "../../lib/require-session";

export const dynamic = "force-dynamic";

/** Gates `/settings` behind a real session — same pattern as
 *  `dashboard/layout.tsx`. Account data is the most personal data in
 *  the app; it must never render for an unauthenticated visitor. */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
