-- Payment history and receipts (BUILD_PLAN "v110").
--
-- One row per successful Paystack payment, written by the webhook when a
-- `charge.success` arrives, so the plan screen can list what a person has paid
-- and give them a receipt to print or save. Until now nothing recorded
-- payments: Paystack held them and the app only knew the plan it led to.
--
-- WHAT IS KEPT, and why only that. The Paystack transaction reference (what
-- identifies the payment at Paystack, and what a refund event quotes back), who
-- paid, how much and in which currency, which plan it was for, and when. NOT
-- kept: the customer's email (it is the account's own email, shown on the
-- receipt from the signed-in account), any card or bank detail, or the webhook
-- body. Paystack stays the system of record for the money itself; this table is
-- the convenience copy that lets the app show it.
--
-- `amount_minor` is the smallest unit of the currency (kobo / cents), exactly as
-- Paystack reports it. Only NGN and USD are recorded: those are the only
-- currencies the app sells in, and the webhook skips anything else rather than
-- failing (a failing webhook is retried for 72 hours).
--
-- `refund_status` follows Paystack's `refund.*` events for that payment. It
-- records THAT a refund exists and how far it has got, never an amount: the
-- webhook does not say clearly which unit a refund amount is in, and a partial
-- refund would need summing. The amount is at Paystack.
--
-- The row follows the account: delete the account and its payment rows go too
-- (privacy first; the payments themselves remain in the Paystack dashboard,
-- which is where the books are kept). Nothing here is ever deleted otherwise.
--
-- RLS on with zero policies and every grant to the browser roles revoked, like
-- 0017: only the service-role client in apps/web can read or write it. The
-- receipt page checks that the signed-in person is the payer before showing
-- anything.

create table if not exists public.billing_payments (
  reference text primary key check (char_length(reference) between 1 and 200),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency in ('NGN', 'USD')),
  -- The paid plan the payment was for; null when its Paystack plan is not one
  -- of ours (the receipt then says only "payment").
  plan text check (plan is null or plan in ('standard', 'premium')),
  paid_at timestamptz not null,
  refund_status text check (
    refund_status is null or refund_status in ('pending', 'processing', 'processed', 'failed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_payments_user_paid_idx
  on public.billing_payments (user_id, paid_at desc);

alter table public.billing_payments enable row level security;

revoke all on public.billing_payments from anon, authenticated;

comment on table public.billing_payments is
  'One row per successful Paystack payment (charge.success): reference, payer, amount in kobo/cents, currency, plan, date, and how far any refund has got. No email, card or bank details. Service-role only — see docs/runbooks/billing.md.';
