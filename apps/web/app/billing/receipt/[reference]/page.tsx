import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { receiptSellerLines, refundStateOf } from "@world-vitality/billing-service";
import { Text } from "@world-vitality/ui-components";
import { getBillingStore } from "../../../../lib/billing";
import { formatMoneyMinor } from "../../../../lib/format-money";
import { getTranslator } from "../../../../lib/i18n/server";
import { logApplication } from "../../../../lib/logger";
import { requireSession } from "../../../../lib/require-session";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: `${t("billing.receipt.title")} — World Vitality`, robots: { index: false } };
}

const RECEIPT_CSS = `
.wv-receipt-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: var(--wv-space-lg) var(--wv-space-md);
  background: var(--wv-surface-subtle, var(--wv-surface));
  color: var(--wv-text-primary);
  font-family: var(--wv-font-sans);
}
.wv-receipt-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--wv-space-sm);
  max-width: 40rem;
  margin: 0 auto var(--wv-space-md);
}
.wv-receipt {
  box-sizing: border-box;
  max-width: 40rem;
  margin: 0 auto;
  padding: var(--wv-space-lg);
  background: var(--wv-surface);
  border: 1px solid var(--wv-border);
  border-radius: var(--wv-radius-md, 8px);
}
.wv-receipt dl { margin: 0; }
.wv-receipt-row {
  display: grid;
  grid-template-columns: minmax(7rem, 11rem) 1fr;
  gap: var(--wv-space-sm);
  padding-block: var(--wv-space-sm);
  border-block-end: 1px solid var(--wv-border);
}
.wv-receipt-row dt { color: var(--wv-text-secondary); }
.wv-receipt-row dd { margin: 0; overflow-wrap: anywhere; }
@media (max-width: 30rem) {
  .wv-receipt-row { grid-template-columns: 1fr; gap: 0; }
}
@media print {
  .wv-receipt-page { background: #fff; color: #111; padding: 0; min-height: 0; }
  .wv-receipt-actions { display: none; }
  .wv-receipt { border: 0; padding: 0; max-width: none; background: #fff; color: #111; }
  .wv-receipt-row dt { color: #444; }
  .wv-receipt-row { border-color: #ccc; }
}
`;

function decodeReference(raw: string): string | null {
  try {
    const value = decodeURIComponent(raw);
    return value.length > 0 && value.length <= 200 ? value : null;
  } catch {
    return null;
  }
}

/**
 * A printable receipt for one payment (BUILD_PLAN v110), reached from the
 * payment history on the plan screen. Only the person who paid can open it: a
 * payment that is not theirs, or does not exist, is a plain 404 either way, so
 * the page cannot be used to find out whether a reference exists.
 *
 * It states facts we hold (date, reference, plan, amount, the account's email,
 * that Paystack took the payment) and nothing we do not: it is a record of a
 * payment, and says so, not a tax invoice — the business's own details and tax
 * number are the owner's to add (`BILLING_RECEIPT_SELLER`). The date is shown in
 * UTC, with its name, so the receipt reads the same wherever it is opened.
 */
export default async function ReceiptPage({ params }: { params: Promise<{ reference: string }> }) {
  const session = await requireSession();
  const reference = decodeReference((await params).reference);
  if (!reference) notFound();
  const translator = await getTranslator();
  const { t, locale } = translator;

  let payment;
  try {
    payment = await getBillingStore().getPayment(reference);
  } catch (err) {
    logApplication.error("billing_receipt_load_failed", err, { userId: session.userId });
    return (
      <main className="wv-receipt-page">
        <style>{RECEIPT_CSS}</style>
        <div className="wv-receipt">
          <Text variant="body" role="status">
            {t("billing.history.unavailable")}
          </Text>
          <Link href="/billing" style={{ color: "var(--wv-accent)" }}>
            {t("billing.receipt.back")}
          </Link>
        </div>
      </main>
    );
  }
  if (!payment || payment.userId !== session.userId) notFound();

  const refund = refundStateOf(payment);
  const item = payment.plan
    ? t("billing.receipt.itemPlan", { plan: t(`billing.plan.${payment.plan}`) })
    : t("billing.receipt.itemOther");
  const seller = receiptSellerLines(process.env.BILLING_RECEIPT_SELLER);
  // Spelled-out fields, not `dateStyle`/`timeStyle`: those cannot be combined
  // with `timeZoneName`, and a receipt should say which time zone it is in.
  const paidOn = translator.date(payment.paidAt, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });

  return (
    <main className="wv-receipt-page">
      <style>{RECEIPT_CSS}</style>
      <div className="wv-receipt-actions">
        <Link href="/billing" style={{ color: "var(--wv-accent)" }}>
          ← {t("billing.receipt.back")}
        </Link>
        <PrintButton />
      </div>
      <article className="wv-receipt" aria-labelledby="receipt-title" data-testid="receipt">
        <Text variant="sectionTitle" as="h1" id="receipt-title" style={{ marginTop: 0 }}>
          {t("billing.receipt.title")}
        </Text>
        <dl>
          <div className="wv-receipt-row">
            <dt>{t("billing.receipt.issuedBy")}</dt>
            <dd>
              {seller.map((line, i) => (
                <span key={i} style={{ display: "block", fontWeight: i === 0 ? 600 : 400 }}>
                  {line}
                </span>
              ))}
            </dd>
          </div>
          <div className="wv-receipt-row">
            <dt>{t("billing.receipt.account")}</dt>
            <dd>
              <bdi>{session.email}</bdi>
            </dd>
          </div>
          <div className="wv-receipt-row">
            <dt>{t("billing.receipt.datePaid")}</dt>
            <dd>{paidOn}</dd>
          </div>
          <div className="wv-receipt-row">
            <dt>{t("billing.receipt.reference")}</dt>
            <dd>
              <bdi style={{ fontFamily: "var(--wv-font-mono, monospace)" }}>
                {payment.reference}
              </bdi>
            </dd>
          </div>
          <div className="wv-receipt-row">
            <dt>{t("billing.receipt.item")}</dt>
            <dd>{item}</dd>
          </div>
          <div className="wv-receipt-row">
            <dt>{t("billing.receipt.amount")}</dt>
            <dd style={{ fontWeight: 600 }}>
              <bdi>
                {formatMoneyMinor(locale, payment.amountMinor, payment.currency, {
                  alwaysDecimals: true,
                })}
              </bdi>
            </dd>
          </div>
          <div className="wv-receipt-row">
            <dt>{t("billing.receipt.method")}</dt>
            <dd>Paystack</dd>
          </div>
        </dl>
        {refund !== "none" && (
          <Text variant="body" style={{ display: "block", marginTop: "var(--wv-space-md)" }}>
            {refund === "in_progress"
              ? t("billing.receipt.refundInProgress")
              : refund === "processed"
                ? t("billing.receipt.refundProcessed")
                : t("billing.receipt.refundFailed")}
          </Text>
        )}
        <Text
          variant="caption"
          style={{
            display: "block",
            marginTop: "var(--wv-space-md)",
            color: "var(--wv-text-secondary)",
          }}
        >
          {t("billing.receipt.notInvoice")}
        </Text>
      </article>
    </main>
  );
}
