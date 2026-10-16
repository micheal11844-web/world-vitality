import type { ReactNode } from "react";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";
import { requireSession } from "../../lib/require-session";

export const dynamic = "force-dynamic";

/** Gates `/welcome` behind a real session — onboarding saves to the account. */
export default async function WelcomeLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
