import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionState, SubscriptionStatus, SubscriptionSource } from "./subscription.js";
import type { PlanId } from "./plans.js";

/**
 * Where billing state is kept. `SupabaseBillingStore` is the real one
 * (tables from migration 0017, reachable only with the service-role key);
 * `InMemoryBillingStore` backs the tests.
 */

export interface BillingEventRecord {
  key: string;
  type: string;
  outcome: "applied" | "ignored";
  reason: string | null;
  userId: string | null;
}

export interface BillingStore {
  getSubscription(userId: string): Promise<SubscriptionState | null>;
  findSubscriptionBySubscriptionCode(code: string): Promise<SubscriptionState | null>;
  findUserIdByCustomerCode(code: string): Promise<string | null>;
  /** Looks the person up by the account email Paystack was given at checkout. */
  findUserIdByEmail(email: string): Promise<string | null>;
  saveSubscription(state: SubscriptionState): Promise<void>;
  hasEvent(key: string): Promise<boolean>;
  recordEvent(record: BillingEventRecord): Promise<void>;
}

/* ------------------------------------------------------------------ */

export class InMemoryBillingStore implements BillingStore {
  readonly subscriptions = new Map<string, SubscriptionState>();
  readonly events = new Map<string, BillingEventRecord>();
  /** email (lowercase) → userId; stands in for the `profiles` table. */
  readonly profiles = new Map<string, string>();

  async getSubscription(userId: string) {
    return this.subscriptions.get(userId) ?? null;
  }
  async findSubscriptionBySubscriptionCode(code: string) {
    for (const s of this.subscriptions.values()) if (s.subscriptionCode === code) return s;
    return null;
  }
  async findUserIdByCustomerCode(code: string) {
    for (const s of this.subscriptions.values()) if (s.customerCode === code) return s.userId;
    return null;
  }
  async findUserIdByEmail(email: string) {
    return this.profiles.get(email.toLowerCase()) ?? null;
  }
  async saveSubscription(state: SubscriptionState) {
    this.subscriptions.set(state.userId, state);
  }
  async hasEvent(key: string) {
    return this.events.has(key);
  }
  async recordEvent(record: BillingEventRecord) {
    if (!this.events.has(record.key)) this.events.set(record.key, record);
  }
}

/* ------------------------------------------------------------------ */

const SUBSCRIPTION_COLUMNS =
  "user_id, plan, status, source, currency, paystack_customer_code, paystack_subscription_code, current_period_end, past_due_since, updated_at";

interface SubscriptionRow {
  user_id: string;
  plan: string;
  status: string;
  source: string;
  currency: string | null;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  current_period_end: string | null;
  past_due_since: string | null;
  updated_at: string;
}

const STATUSES: readonly SubscriptionStatus[] = ["active", "non_renewing", "past_due", "cancelled"];
const SOURCES: readonly SubscriptionSource[] = ["paystack", "manual"];

function rowToState(row: SubscriptionRow): SubscriptionState | null {
  // A row with a value we do not know is treated as no subscription
  // rather than guessed at: the person falls back to Basic (or, with
  // billing off, to unlimited), and the odd row is left for a human.
  if (!["standard", "premium", "enterprise"].includes(row.plan)) return null;
  if (!STATUSES.includes(row.status as SubscriptionStatus)) return null;
  if (!SOURCES.includes(row.source as SubscriptionSource)) return null;
  return {
    userId: row.user_id,
    plan: row.plan as Exclude<PlanId, "basic">,
    status: row.status as SubscriptionStatus,
    source: row.source as SubscriptionSource,
    currency: row.currency === "NGN" || row.currency === "USD" ? row.currency : null,
    customerCode: row.paystack_customer_code,
    subscriptionCode: row.paystack_subscription_code,
    currentPeriodEnd: row.current_period_end,
    pastDueSince: row.past_due_since,
    updatedAt: row.updated_at,
  };
}

export class SupabaseBillingStore implements BillingStore {
  constructor(private readonly client: SupabaseClient) {}

  async getSubscription(userId: string): Promise<SubscriptionState | null> {
    const { data, error } = await this.client
      .from("billing_subscriptions")
      .select(SUBSCRIPTION_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(`Failed to load subscription: ${error.message}`);
    return data ? rowToState(data as SubscriptionRow) : null;
  }

  async findSubscriptionBySubscriptionCode(code: string): Promise<SubscriptionState | null> {
    const { data, error } = await this.client
      .from("billing_subscriptions")
      .select(SUBSCRIPTION_COLUMNS)
      .eq("paystack_subscription_code", code)
      .maybeSingle();
    if (error) throw new Error(`Failed to look up subscription: ${error.message}`);
    return data ? rowToState(data as SubscriptionRow) : null;
  }

  async findUserIdByCustomerCode(code: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("billing_subscriptions")
      .select("user_id")
      .eq("paystack_customer_code", code)
      .maybeSingle();
    if (error) throw new Error(`Failed to look up customer: ${error.message}`);
    return (data as { user_id: string } | null)?.user_id ?? null;
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("user_id")
      // Supabase Auth stores addresses in lowercase, and so does `profiles`.
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (error) throw new Error(`Failed to look up account by email: ${error.message}`);
    return (data as { user_id: string } | null)?.user_id ?? null;
  }

  async saveSubscription(state: SubscriptionState): Promise<void> {
    const { error } = await this.client.from("billing_subscriptions").upsert(
      {
        user_id: state.userId,
        plan: state.plan,
        status: state.status,
        source: state.source,
        currency: state.currency,
        paystack_customer_code: state.customerCode,
        paystack_subscription_code: state.subscriptionCode,
        current_period_end: state.currentPeriodEnd,
        past_due_since: state.pastDueSince,
        updated_at: state.updatedAt,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(`Failed to save subscription: ${error.message}`);
  }

  async hasEvent(key: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("billing_events")
      .select("event_key")
      .eq("event_key", key)
      .maybeSingle();
    if (error) throw new Error(`Failed to check billing event: ${error.message}`);
    return data !== null;
  }

  async recordEvent(record: BillingEventRecord): Promise<void> {
    const { error } = await this.client.from("billing_events").insert({
      event_key: record.key,
      event_type: record.type,
      outcome: record.outcome,
      reason: record.reason,
      user_id: record.userId,
    });
    // 23505 = unique violation: a concurrent delivery of the same event
    // already recorded it. That is the idempotency guard working.
    if (error && (error as { code?: string }).code !== "23505") {
      throw new Error(`Failed to record billing event: ${error.message}`);
    }
  }
}
