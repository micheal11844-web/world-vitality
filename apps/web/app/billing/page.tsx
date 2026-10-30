import { PLANS, summariseBilling, type BillingSummary } from "@world-vitality/billing-service";
import { getBillingStore, getOfferedPrices } from "../../lib/billing";
import { getAccessContext } from "../../lib/get-access-context";
import { logApplication } from "../../lib/logger";
import { requireSession } from "../../lib/require-session";
import { BillingView, type BillingPlanLimits } from "./billing-view";

export const dynamic = "force-dynamic";

/**
 * Plan & billing (BUILD_PLAN v95). Shows the plan the signed-in person's
 * organisation is on — its OWNER's plan — what each plan includes, and, for
 * the owner only, the buttons to subscribe, update the card or cancel.
 * Members see the plan read-only with a note that the owner manages it.
 *
 * Only the two limits the app actually enforces are listed (people, saved
 * items): the plan catalogue also defines workspace counts and feature
 * switches, but nothing checks those yet, so the screen does not promise them.
 *
 * Reads fail loudly rather than quietly showing "Basic": a paying customer
 * told they are on the free plan (and offered a second subscription) because
 * of a database hiccup would be worse than an honest "couldn't load".
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await requireSession();
  const { checkout } = await searchParams;

  let isOwner = false;
  let summary: BillingSummary | null = null;
  try {
    const access = await getAccessContext();
    isOwner = access?.organization.role === "owner";
    const ownerId = access?.organization.ownerId ?? session.userId;
    summary = summariseBilling(await getBillingStore().getSubscription(ownerId), new Date());
  } catch (err) {
    logApplication.error("billing_page_load_failed", err, { userId: session.userId });
  }

  const limit = (id: "basic" | "standard" | "premium"): BillingPlanLimits => ({
    seats: PLANS[id].limits.seats,
    savedItems: PLANS[id].limits.savedItems,
  });

  return (
    <BillingView
      summary={summary}
      isOwner={isOwner}
      checkoutReturn={checkout === "return"}
      offers={getOfferedPrices().map((o) => ({
        plan: o.plan,
        currency: o.currency,
        interval: o.interval,
        amountMajor: o.amountMinor / 100,
      }))}
      limits={{ basic: limit("basic"), standard: limit("standard"), premium: limit("premium") }}
    />
  );
}
