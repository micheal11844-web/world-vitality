-- Billing groundwork (BUILD_PLAN "v90"): who is on which paid plan, and a
-- record of which Paystack webhooks have been handled.
--
-- NOT APPLIED to any project yet, and nothing in the app needs it until
-- billing is switched on (BILLING_ENABLED=true). With billing off the app
-- never reads these tables. See docs/runbooks/billing.md.
--
-- `billing_subscriptions` has at most one row per person, and only for
-- someone who is on a paid plan: no row means the free Basic plan. A row
-- is written either by the Paystack webhook (source 'paystack') or, for
-- Enterprise customers who are invoiced outside Paystack, by hand with SQL
-- (source 'manual' — payment events never touch a manual row). Staff can
-- not create or change plans from the admin console, on purpose.
--
-- The row follows the account: delete the account and the row goes with
-- it. (Cancelling at Paystack when an account is deleted is a follow-up —
-- see the runbook.) Card and bank details are never stored here or
-- anywhere in this app; Paystack holds them. The Paystack customer and
-- subscription codes are identifiers, not credentials.
--
-- `billing_events` exists only so a webhook delivered twice is applied
-- once (Paystack retries until it gets a 200, and a retry is the identical
-- body). It holds a hash-based key, the event name and what we did with
-- it — deliberately NOT the payload, which contains the customer's email
-- and payment details. Paystack stops retrying after 72 hours, so rows
-- older than a month can be deleted safely.
--
-- Both tables: RLS on with zero policies and every grant to the browser
-- roles revoked, like 0016. Only the service-role client in apps/web can
-- touch them.

create table if not exists public.billing_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('standard', 'premium', 'enterprise')),
  status text not null check (status in ('active', 'non_renewing', 'past_due', 'cancelled')),
  source text not null default 'paystack' check (source in ('paystack', 'manual')),
  currency text check (currency is null or currency in ('NGN', 'USD')),
  paystack_customer_code text check (paystack_customer_code is null or char_length(paystack_customer_code) <= 100),
  paystack_subscription_code text check (paystack_subscription_code is null or char_length(paystack_subscription_code) <= 100),
  -- For 'non_renewing': the end of the term the person already paid for.
  current_period_end timestamptz,
  -- Set while 'past_due': when the first failed payment of this patch happened.
  past_due_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A Paystack-driven row always knows its Paystack subscription.
  constraint billing_subscriptions_paystack_has_code
    check (source = 'manual' or paystack_subscription_code is not null)
);

create unique index if not exists billing_subscriptions_subscription_code_idx
  on public.billing_subscriptions (paystack_subscription_code)
  where paystack_subscription_code is not null;

create index if not exists billing_subscriptions_customer_code_idx
  on public.billing_subscriptions (paystack_customer_code)
  where paystack_customer_code is not null;

create table if not exists public.billing_events (
  event_key text primary key check (char_length(event_key) between 1 and 200),
  event_type text not null check (char_length(event_type) between 1 and 80),
  outcome text not null check (outcome in ('applied', 'ignored')),
  reason text check (reason is null or char_length(reason) <= 80),
  user_id uuid references auth.users (id) on delete set null,
  received_at timestamptz not null default now()
);

create index if not exists billing_events_received_idx
  on public.billing_events (received_at desc);

alter table public.billing_subscriptions enable row level security;
alter table public.billing_events enable row level security;

revoke all on public.billing_subscriptions from anon, authenticated;
revoke all on public.billing_events from anon, authenticated;

comment on table public.billing_subscriptions is
  'One row per person on a paid plan; no row = free Basic. Written by the Paystack webhook (source paystack) or by hand for invoiced Enterprise customers (source manual). Service-role only — see docs/runbooks/billing.md.';
comment on table public.billing_events is
  'Paystack webhooks already handled, so a redelivery is applied once. Holds a key, event name and outcome only — never the payload. Rows older than ~1 month are safe to delete. Service-role only.';
