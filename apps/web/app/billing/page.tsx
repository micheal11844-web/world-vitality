import {
  PLANS,
  refundStateOf,
  summariseBilling,
  type BillingSummary,
} from "@world-vitality/billing-service";
import { getBillingStore, getOfferedPrices } from "../../lib/billing";
import { getAccessContext } from "../../lib/get-access-context";
import { logApplication } from "../../lib/logger";
import { requireSession } from "../../lib/require-session";
import { BillingView, type BillingPaymentRow, type BillingPlanLimits } from "./billing-view";

export const dynamic = "force-dynamic";

/** How many of a person's latest payments the history lists. */
const PAYMENT_HISTORY_LIMIT = 24;

/**
 * Plan & billing (BUILD_PLAN v95). Shows the plan the signed-in person's
 * organisation is on — its OWNER's plan — what each plan includes, and, for
 * the owner only, the buttons to subscribe, update the card or cancel.
 * Members see the plan read-only with a note that the owner manages it.
 *
 * The person's own payment history is listed too (their payments, whoever
 * owns the organisation now), each with a printable receipt. A failure to read
 * it is shown as its own note and never hides the plan.
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

  // The person's own payments (they are the one who paid), newest first.
  let payments: BillingPaymentRow[] | null = [];
  try {
    payments = (await getBillingStore().listPayments(session.userId, PAYMENT_HISTORY_LIMIT)).map(
      (p) => ({
        reference: p.reference,
        plan: p.plan,
        amountMinor: p.amountMinor,
        currency: p.currency,
        paidAt: p.paidAt,
        refund: refundStateOf(p),
      }),
    );
  } catch (err) {
    logApplication.error("billing_payment_history_failed", err, { userId: session.userId });
    payments = null;
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
      payments={payments}
      paymentHistoryLimit={PAYMENT_HISTORY_LIMIT}
    />
  );
}
