"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, Button, Card, Select, Text } from "@world-vitality/ui-components";
import type { BillingSummary } from "@world-vitality/billing-service";
import type { MessageKey } from "@world-vitality/i18n";
import { useI18n } from "../../lib/i18n/i18n-provider";
import {
  cancelSubscriptionAction,
  openCardPageAction,
  startCheckoutAction,
} from "../../lib/billing-actions";
import { AppBrand } from "../app-brand";
import { buildAppSidebar } from "../workspaces/workspace-nav";

export interface BillingPlanLimits {
  /** `null` = no set limit. */
  seats: number | null;
  savedItems: number | null;
}

export interface BillingOffer {
  plan: "standard" | "premium";
  currency: "NGN" | "USD";
  interval: "monthly" | "annual";
  /** Whole currency units (naira / dollars). */
  amountMajor: number;
}

export interface BillingViewProps {
  /** `null` when the plan could not be read — the page says so instead of guessing. */
  summary: BillingSummary | null;
  /** Only the owner of the organisation can subscribe, update the card or cancel. */
  isOwner: boolean;
  /** The person has just come back from Paystack's payment page. */
  checkoutReturn: boolean;
  /** Only prices that can really be bought (a Paystack plan exists for each). */
  offers: BillingOffer[];
  limits: Record<"basic" | "standard" | "premium", BillingPlanLimits>;
}

const PLAN_KEY = {
  basic: "billing.plan.basic",
  standard: "billing.plan.standard",
  premium: "billing.plan.premium",
  enterprise: "billing.plan.enterprise",
} as const satisfies Record<string, MessageKey>;

const CURRENCY_SYMBOL = { NGN: "₦", USD: "$" } as const;
const CURRENCY_KEY = {
  NGN: "billing.currency.NGN",
  USD: "billing.currency.USD",
} as const satisfies Record<string, MessageKey>;

const stack = { display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" } as const;
const muted = { color: "var(--wv-text-secondary)" } as const;
const sans = { fontFamily: "var(--wv-font-sans)" } as const;
const errorColor = { color: "var(--wv-critical)" } as const;

/** After paying, the confirmation comes from Paystack by webhook; check a few times, then stop. */
const CONFIRM_POLL_MS = 4000;
const CONFIRM_POLL_MAX = 8;

export function BillingView({
  summary,
  isOwner,
  checkoutReturn,
  offers,
  limits,
}: BillingViewProps) {
  const translator = useI18n();
  const { t } = translator;
  const router = useRouter();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const currencies = Array.from(new Set(offers.map((o) => o.currency)));
  const [currency, setCurrency] = useState<"NGN" | "USD">(currencies[0] ?? "NGN");
  const intervals = Array.from(new Set(offers.map((o) => o.interval)));
  const [period, setPeriod] = useState<"monthly" | "annual">(
    intervals.includes("monthly") ? "monthly" : (intervals[0] ?? "monthly"),
  );

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const paid = summary !== null && summary.plan !== "basic";
  const waitingForPayment = checkoutReturn && !paid && summary !== null;

  useEffect(() => {
    if (!waitingForPayment) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= CONFIRM_POLL_MAX) window.clearInterval(timer);
    }, CONFIRM_POLL_MS);
    return () => window.clearInterval(timer);
  }, [waitingForPayment, router]);

  const planLabel = (id: keyof typeof PLAN_KEY) => t(PLAN_KEY[id]);

  function stateText(s: BillingSummary): string {
    const plan = s.subscribedPlan ? planLabel(s.subscribedPlan) : planLabel(s.plan);
    switch (s.state) {
      case "manual":
        return t("billing.state.manual", { plan });
      case "active":
        return t("billing.state.active", { plan });
      case "ending":
        return s.endsOn
          ? t("billing.state.ending", {
              plan,
              date: translator.date(s.endsOn, { dateStyle: "long" }),
            })
          : t("billing.state.endingNoDate", { plan });
      case "past_due":
        return s.graceEndsOn
          ? t("billing.state.pastDue", {
              plan,
              date: translator.date(s.graceEndsOn, { dateStyle: "long" }),
            })
          : t("billing.state.pastDueNoDate", { plan });
      default:
        return s.canManage ? t("billing.state.lapsed") : t("billing.state.free");
    }
  }

  // Prices always show their thousands separator ("₦7.500" beside "₦25.000" in
  // Spanish: the language's default drops it on four-digit numbers, which looks
  // inconsistent next to the others), in the reader's own digits and separator.
  const digitsOnly = new Intl.NumberFormat(translator.locale, {
    useGrouping: false,
    maximumFractionDigits: 0,
  });
  const groupSeparator =
    new Intl.NumberFormat(translator.locale)
      .formatToParts(1_000_000)
      .find((part) => part.type === "group")?.value ?? ",";
  const money = (amountMajor: number, cur: "NGN" | "USD") => {
    const digits = Array.from(digitsOnly.format(amountMajor));
    const grouped = digits
      .map((d, i) => (i > 0 && (digits.length - i) % 3 === 0 ? `${groupSeparator}${d}` : d))
      .join("");
    return `${CURRENCY_SYMBOL[cur]}${grouped}`;
  };

  const limitValue = (n: number | null) =>
    n === null ? t("billing.limit.unlimited") : translator.number(n);

  function limitRows(of: BillingPlanLimits) {
    return (
      <dl style={{ ...sans, margin: 0, display: "grid", gap: "var(--wv-space-xs)" }}>
        <div>
          <dt style={{ ...muted, fontSize: "0.8125rem" }}>{t("billing.limit.seats")}</dt>
          <dd style={{ margin: 0 }}>{limitValue(of.seats)}</dd>
        </div>
        <div>
          <dt style={{ ...muted, fontSize: "0.8125rem" }}>{t("billing.limit.savedItems")}</dt>
          <dd style={{ margin: 0 }}>{limitValue(of.savedItems)}</dd>
        </div>
      </dl>
    );
  }

  async function goTo(
    which: string,
    action: () => Promise<{ ok: boolean; error?: string; url?: string }>,
  ) {
    setBusy(which);
    setError(undefined);
    const result = await action();
    if (result.ok && result.url) {
      // Full navigation: Paystack's pages are another site.
      window.location.href = result.url;
      return;
    }
    setBusy(null);
    setError(result.error);
  }

  async function cancel() {
    setBusy("cancel");
    setError(undefined);
    const result = await cancelSubscriptionAction();
    setBusy(null);
    if (result.ok) {
      setCancelled(true);
      setConfirmingCancel(false);
    } else {
      setError(result.error);
    }
  }

  const sidebar = buildAppSidebar({ current: "settings", t });
  const canBuy = isOwner && summary?.canSubscribe === true;
  const canManage = isOwner && summary?.canManage === true && !cancelled;
  const canCancel = canManage && (summary?.state === "active" || summary?.state === "past_due");
  const subscribedNow =
    summary?.state === "active" || summary?.state === "ending" || summary?.state === "past_due";

  const shownOffers = offers.filter((o) => o.currency === currency && o.interval === period);
  const offerFor = (plan: "standard" | "premium") => shownOffers.find((o) => o.plan === plan);

  return (
    <AppShell
      brand={<AppBrand />}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
    >
      <div style={{ ...stack, maxWidth: "48rem" }}>
        <Link href="/settings" style={{ ...sans, color: "var(--wv-accent)" }}>
          {t("billing.back")}
        </Link>
        <Text variant="pageTitle" as="h1">
          {t("billing.title")}
        </Text>

        {checkoutReturn && summary && (
          <Card role="status">
            {paid ? (
              <Text variant="body">
                {t("billing.return.done", { plan: planLabel(summary.plan) })}
              </Text>
            ) : (
              <div style={stack}>
                <Text variant="body">{t("billing.return.confirming")}</Text>
                <div>
                  <Button variant="secondary" onClick={() => window.location.reload()}>
                    {t("billing.return.refresh")}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {summary === null ? (
          <Card role="alert">
            <Text variant="body" style={errorColor}>
              {t("errors.billingUnavailable")}
            </Text>
          </Card>
        ) : (
          <Card>
            <div style={stack}>
              <Text variant="sectionTitle" as="h2">
                {t("billing.current.title")}
              </Text>
              <Text variant="body" style={{ fontWeight: 600 }}>
                {planLabel(summary.plan)}
              </Text>
              <Text variant="body" style={muted}>
                {stateText(summary)}
              </Text>
              {!isOwner && (
                <Text variant="body" style={muted}>
                  {t("billing.member.note", { plan: planLabel(summary.plan) })}
                </Text>
              )}
              {summary.plan !== "enterprise" && limitRows(limits[summary.plan])}
              {isOwner && subscribedNow && (
                <Text variant="caption" style={muted}>
                  {t("billing.switchNote")}
                </Text>
              )}
            </div>
          </Card>
        )}

        {summary !== null && canBuy && (
          <Card>
            <div style={stack}>
              <Text variant="sectionTitle" as="h2">
                {t("billing.plans.title")}
              </Text>
              {offers.length === 0 ? (
                <Text variant="body" style={muted}>
                  {t("billing.plans.none")}
                </Text>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "var(--wv-space-md)", flexWrap: "wrap" }}>
                    {intervals.length > 1 && (
                      <Select
                        label={t("billing.interval.label")}
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as "monthly" | "annual")}
                      >
                        <option value="monthly">{t("billing.interval.monthly")}</option>
                        <option value="annual">
                          {t("billing.interval.annual")} — {t("billing.interval.saving")}
                        </option>
                      </Select>
                    )}
                    {currencies.length > 1 && (
                      <Select
                        label={t("billing.currency.label")}
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as "NGN" | "USD")}
                      >
                        {currencies.map((c) => (
                          <option key={c} value={c}>
                            {t(CURRENCY_KEY[c])}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "var(--wv-space-md)", flexWrap: "wrap" }}>
                    <Card style={{ flex: "1 1 13rem" }} compact>
                      <div style={stack}>
                        <Text variant="sectionTitle" as="h3">
                          {planLabel("basic")}
                        </Text>
                        <Text variant="body">{t("billing.plans.free")}</Text>
                        {limitRows(limits.basic)}
                        {summary.plan === "basic" && (
                          <Text variant="caption" style={muted}>
                            {t("billing.plans.current")}
                          </Text>
                        )}
                      </div>
                    </Card>
                    {(["standard", "premium"] as const).map((plan) => {
                      const offer = offerFor(plan);
                      return (
                        <Card key={plan} style={{ flex: "1 1 13rem" }} compact>
                          <div style={stack}>
                            <Text variant="sectionTitle" as="h3">
                              {planLabel(plan)}
                            </Text>
                            <Text variant="body">
                              {offer
                                ? t(
                                    offer.interval === "monthly"
                                      ? "billing.price.monthly"
                                      : "billing.price.annual",
                                    { price: money(offer.amountMajor, offer.currency) },
                                  )
                                : t("billing.plans.notOffered")}
                            </Text>
                            {limitRows(limits[plan])}
                            {offer && (
                              <div>
                                <Button
                                  loading={busy === `buy-${plan}`}
                                  disabled={busy !== null}
                                  onClick={() =>
                                    goTo(`buy-${plan}`, () =>
                                      startCheckoutAction({
                                        plan,
                                        currency: offer.currency,
                                        interval: offer.interval,
                                      }),
                                    )
                                  }
                                >
                                  {t("billing.subscribe", { plan: planLabel(plan) })}
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  <Text variant="caption" style={muted}>
                    {t("billing.payNote")}
                  </Text>
                </>
              )}
            </div>
          </Card>
        )}

        {summary !== null && !isOwner && (
          <Text variant="caption" style={muted}>
            {t("billing.ownerOnly")}
          </Text>
        )}

        {(canManage || cancelled) && (
          <Card>
            <div style={stack}>
              <Text variant="sectionTitle" as="h2">
                {t("billing.manage.title")}
              </Text>
              {cancelled ? (
                <Text variant="body" role="status">
                  {t("billing.manage.cancelDone")}
                </Text>
              ) : (
                <>
                  <Text variant="body" style={muted}>
                    {t("billing.manage.cardBody")}
                  </Text>
                  <div>
                    <Button
                      variant="secondary"
                      loading={busy === "card"}
                      disabled={busy !== null}
                      onClick={() => goTo("card", openCardPageAction)}
                    >
                      {t("billing.manage.card")}
                    </Button>
                  </div>
                  {canCancel &&
                    (confirmingCancel ? (
                      <div style={stack}>
                        <Text variant="body" style={muted}>
                          {t("billing.manage.cancelBody")}
                        </Text>
                        <div
                          style={{ display: "flex", gap: "var(--wv-space-sm)", flexWrap: "wrap" }}
                        >
                          <Button
                            variant="destructive"
                            loading={busy === "cancel"}
                            disabled={busy !== null}
                            onClick={cancel}
                          >
                            {t("billing.manage.cancelConfirm")}
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={busy !== null}
                            onClick={() => setConfirmingCancel(false)}
                          >
                            {t("billing.manage.cancelKeep")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Button
                          variant="ghost"
                          disabled={busy !== null}
                          onClick={() => setConfirmingCancel(true)}
                        >
                          {t("billing.manage.cancel")}
                        </Button>
                      </div>
                    ))}
                </>
              )}
            </div>
          </Card>
        )}

        {error && (
          <Text variant="caption" role="alert" style={errorColor}>
            {error}
          </Text>
        )}

        <Text variant="caption" style={muted}>
          {t("billing.alwaysFree")}
        </Text>
      </div>
    </AppShell>
  );
}
