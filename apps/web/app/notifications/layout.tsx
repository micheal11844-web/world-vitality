import type { ReactNode } from "react";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";
import { requireSession } from "../../lib/require-session";

export const dynamic = "force-dynamic";

/** Gates `/notifications` behind a real session — the inbox is per-account. */
export default async function NotificationsLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
