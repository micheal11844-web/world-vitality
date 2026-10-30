import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { billingEnabled } from "../../lib/billing";
import { LocaleBoundary } from "../../lib/i18n/locale-boundary";
import { requireSession } from "../../lib/require-session";

export const dynamic = "force-dynamic";

/**
 * Gates `/billing`. While `BILLING_ENABLED` is not "true" the page does not
 * exist (404, exactly like the Paystack webhook), so building it changes
 * nothing for anyone until billing is switched on. When it is on, it needs a
 * real session like every account page.
 */
export default async function BillingLayout({ children }: { children: ReactNode }) {
  if (!billingEnabled()) notFound();
  await requireSession();
  return <LocaleBoundary>{children}</LocaleBoundary>;
}
